///<reference path="../headers/common.d.ts" />

import _ from 'lodash';
import * as dateMath from 'app/core/utils/datemath';
import moment from 'moment';
import {CrateQueryBuilder} from './query_builder';
import handleResponse from './response_handler';

export class CrateDatasource {
  type: string;
  url: string;
  name: string;
  basicAuth: string;
  withCredentials: boolean;
  schema: string;
  table: string;
  defaultTimeColumn: string;
  defaultGroupInterval: string;
  queryBuilder: CrateQueryBuilder;
  CRATE_ROWS_LIMIT: number;


  constructor(instanceSettings,
              private $q,
              private backendSrv,
              private templateSrv) {

    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.basicAuth = instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials;
    this.schema = instanceSettings.jsonData.schema;
    this.table = instanceSettings.jsonData.table;
    this.defaultTimeColumn = instanceSettings.jsonData.timeColumn;
    this.defaultGroupInterval = instanceSettings.jsonData.timeInterval;

    this.$q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;

    this.queryBuilder = new CrateQueryBuilder(this.schema,
                                              this.table,
                                              this.defaultTimeColumn,
                                              this.defaultGroupInterval,
                                              this.templateSrv);

    this.CRATE_ROWS_LIMIT = 10000;
  }

  // Called once per panel (graph)
  query(options) {
    let timeFrom = Math.ceil(dateMath.parse(options.range.from));
    let timeTo = Math.ceil(dateMath.parse(options.range.to));
    let getInterval = this.$q.when(convertToCrateInterval(options.interval));
    let timeFilter = this.getTimeFilter(timeFrom, timeTo);
    let scopedVars = options.scopedVars ? _.cloneDeep(options.scopedVars) : {};

    let queries = _.map(options.targets, target => {
      if (target.hide || (target.rawQuery && !target.query)) {
        return [];
      } else {
        let getQuery: any;

        if (target.rawQuery) {
          getQuery = this.$q.when(target.query);
        } else {
          if (target.timeInterval !== 'auto') {
            getInterval = this.$q.when(target.timeInterval);
          } else {
            // Use SELECT count(*) query for calculating required time interval
            // This is needed because Crate limit response to 10 000 rows.
            getInterval = this._count_series_query(target, timeFrom, timeTo, options)
              .then(count => {
                let min_interval = (timeTo - timeFrom ) / (this.CRATE_ROWS_LIMIT / count);
                return getMinCrateInterval(min_interval);
              });
          }
          getQuery = getInterval.then(interval => {
            return this.queryBuilder.build(target, interval)
          });
        }
        return getQuery.then(query => {
          scopedVars.timeFilter = {value: timeFilter};
          query = this.templateSrv.replace(query, scopedVars, formatCrateValue);
          return this._sql_query(query, [timeFrom, timeTo])
            .then(result => {
              return handleResponse(target, result);
            });
        });
      }
    });
    return this.$q.all(_.flatten(queries)).then(result => {
      return {
        data: _.flatten(result)
      };
    });
  }

  // Workaround for limit datapoints requested from Crate
  // Count points returned by time series query
  _count_series_query(target, timeFrom, timeTo, options) {
    let query = this.queryBuilder.buildCountPointsQuery(target);
    query = this.templateSrv.replace(query, options.scopedVars, formatCrateValue);
    return this._sql_query(query, [timeFrom, timeTo])
      .then(result => {
        return result.rowcount;
      });
  }

  /**
   * Required.
   * Checks datasource and returns Crate cluster name and version or
   * error details.
   */
  testDatasource() {
    return this._get()
    .then(response => {
      if (response.$$status === 200) {
        return {
          status: "success",
          message: "Cluster: " + response.cluster_name +
            ", version: " + response.version.number,
          title: "Success"
        };
      }
    })
    .catch(error => {
      let message = error.statusText ? error.statusText + ': ' : '';
      if (error.data && error.data.error) {
        message += error.data.error;
      } else if (error.data) {
        message += error.data;
      } else {
        message = "Can't connect to Crate instance";
      }
      return {
        status: "error",
        message: message,
        title: "Error"
      };
    });
  }

  metricFindQuery(query: string) {
    if (!query) {
      return this.$q.when([]);
    }

    query = this.templateSrv.replace(query, null, formatCrateValue);
    return this._sql_query(query).then(result => {
      return _.map(_.flatten(result.rows), row => {
        return {
          text: row,
          value: row
        };
      });
    });
  }

  getTimeFilter(timeFrom, timeTo) {
    return this.defaultTimeColumn + " >= '" + timeFrom + "' and " + this.defaultTimeColumn + " <= '" + timeTo + "'";
  }

  /**
   * Sends SQL query to Crate and returns result.
   * @param {string} query SQL query string
   * @param {any[]}  args  Optional query arguments
   * @return
   */
  _sql_query(query: string, args: any[] = []) {
    let data = {
      "stmt": query,
      "args": args
    };
    return this._post('_sql', data);
  }

  _request(method: string, url: string, data?: any) {
    let options = {
      url: this.url + "/" + url,
      method: method,
      data: data,
      headers: {
        "Content-Type": "application/json"
      }
    };

    if (this.basicAuth || this.withCredentials) {
      options["withCredentials"] = true;
    }
    if (this.basicAuth) {
      options.headers["Authorization"] = this.basicAuth;
    }

    return this.backendSrv.datasourceRequest(options)
    .then(response => {
      response.data.$$status = response.status;
      response.data.$$config = response.config;
      return response.data;
    });
  }

  _get(url = "") {
    return this._request('GET', url);
  }

  _post(url: string, data?: any) {
    return this._request('POST', url, data);
  }
}

// Special value formatter for Crate.
function formatCrateValue(value) {
  if (typeof value === 'string') {
    return wrapWithQuotes(value);
  } else {
    return value.map(v => wrapWithQuotes(v)).join(', ');
  }
}

function wrapWithQuotes(value) {
  if (!isNaN(value) ||
      value.indexOf("'") != -1) {
    return value;
  } else {
    return "'" + value + "'";
  }
}

export function convertToCrateInterval(grafanaInterval) {
  let crateIntervals = [
    {shorthand: 's', value: 'second'},
    {shorthand: 'm', value: 'minute'},
    {shorthand: 'h', value: 'hour'},
    {shorthand: 'd', value: 'day'},
    {shorthand: 'w', value: 'week'},
    {shorthand: 'M', value: 'month'},
    {shorthand: 'y', value: 'year'}
  ];
  let intervalRegex = /([\d]*)([smhdwMy])/;
  let parsedInterval = intervalRegex.exec(grafanaInterval);
  let value = Number(parsedInterval[1]);
  let unit = parsedInterval[2];
  let crateInterval = _.find(crateIntervals, {'shorthand': unit});
  return crateInterval ? crateInterval.value : undefined;
}

function getMinCrateInterval(ms) {
  let seconds = ms / 1000;
  if (seconds > 60 * 60 * 24 * 30 * 3)
    return 'year';
  else if (seconds > 60 * 60 * 24 * 30) // TODO: check defenition of month interval
    return 'quarter';
  else if (seconds > 60 * 60 * 24 * 7)
    return 'month';
  else if (seconds > 60 * 60 * 24)
    return 'week';
  else if (seconds > 60 * 60)
    return 'day';
  else if (seconds > 60)
    return 'hour';
  else
    return 'minute';
}
