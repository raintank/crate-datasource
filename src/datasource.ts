///<reference path="../headers/common.d.ts" />

import _ from 'lodash';
import * as dateMath from 'app/core/utils/datemath';
import moment from 'moment';
import {CrateQueryBuilder, getEnabledAggs, getRawAggs, getNotRawAggs} from './query_builder';
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
  checkQuerySource: boolean;
  queryBuilder: CrateQueryBuilder;
  CRATE_ROWS_LIMIT: number;


  constructor(instanceSettings,
              private $q,
              private backendSrv,
              private templateSrv,
              private timeSrv) {

    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.basicAuth = instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials;
    this.schema = instanceSettings.jsonData.schema;
    this.table = instanceSettings.jsonData.table;
    this.defaultTimeColumn = instanceSettings.jsonData.timeColumn;
    this.defaultGroupInterval = instanceSettings.jsonData.timeInterval;
    this.checkQuerySource = instanceSettings.jsonData.checkQuerySource;

    this.$q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.timeSrv = timeSrv;

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
    let timeFilter = this.getTimeFilter(timeFrom, timeTo);
    let scopedVars = this.setScopedVars(options.scopedVars);

    let queries = _.map(options.targets, target => {
      if (target.hide || (target.rawQuery && !target.query)) { return []; }

      let query: string;
      let rawAggQuery: string;
      let queryTarget, rawAggTarget;
      let getQuery: any;
      let getRawAggQuery: any;
      let getRawAggInterval: any;
      let adhocFilters = this.templateSrv.getAdhocFilters(this.name);

      if (target.rawQuery) {
        query = target.query;
      } else {
        let minInterval = Math.ceil((timeTo - timeFrom) / this.CRATE_ROWS_LIMIT);
        let maxLimit = timeTo - timeFrom;
        let interval;

        if (target.timeInterval === 'auto') {
          interval = getMinCrateInterval(options.intervalMs);
        } else if (target.timeInterval === 'auto_gf') {
          // Use intervalMs for panel, provided by Grafana
          interval = options.intervalMs;
        } else {
          interval = target.timeInterval;
        }

        // Split target into two queries (with aggs and raw data)
        query = this.queryBuilder.buildAggQuery(target, interval, adhocFilters);
        queryTarget = _.cloneDeep(target);
        queryTarget.metricAggs = getNotRawAggs(queryTarget.metricAggs);

        rawAggQuery = this.queryBuilder.buildRawAggQuery(target, 0, adhocFilters, maxLimit);
        rawAggQuery = this.templateSrv.replace(rawAggQuery, scopedVars, formatCrateValue);
        rawAggTarget = _.cloneDeep(target);
        rawAggTarget.metricAggs = getRawAggs(rawAggTarget.metricAggs);
      }

      query = this.templateSrv.replace(query, scopedVars, formatCrateValue);

      let queries = [
        {query: query, target: queryTarget},
        {query: rawAggQuery, target: rawAggTarget}
      ];
      queries = _.filter(queries, q => {
        return q.query;
      });

      return _.map(queries, q => {
        return this._sql_query(q.query, [timeFrom, timeTo])
          .then(result => {
            if (q.target) {
              return handleResponse(q.target, result);
            } else {
              return handleResponse(target, result);
            }
          });
      })
    });
    return this.$q.all(_.flattenDepth(queries, 2)).then(result => {
      return {
        data: _.flatten(result)
      };
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
          text: row.toString(),
          value: row
        };
      });
    });
  }

  getTimeFilter(timeFrom, timeTo) {
    return this.defaultTimeColumn + " >= '" + timeFrom + "' and " + this.defaultTimeColumn + " <= '" + timeTo + "'";
  }

  getTagKeys(options) {
    let query = this.queryBuilder.getColumnsQuery();
    return this.metricFindQuery(query);
  }

  getTagValues(options) {
    let range = this.timeSrv.timeRange();
    let query = this.queryBuilder.getValuesQuery(options.key, this.CRATE_ROWS_LIMIT, range);
    return this.metricFindQuery(query);
  }

  setScopedVars(scopedVars) {
    scopedVars.crate_schema = {text: this.schema, value: `"${this.schema}"`};
    scopedVars.crate_table = {text: this.table, value: `"${this.table}"`};

    let crate_source = `"${this.schema}"."${this.table}"`;
    scopedVars.crate_source  = {text: crate_source, value: crate_source};

    return scopedVars;
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

    if (this.checkQuerySource) {
      // Checks schema and table and throw error if it different from configured in data source
      this.checkSQLSource(query);
    }

    return this._post('_sql', data);
  }

  checkSQLSource(query) {
    let source_pattern = /.*[Ff][Rr][Oo][Mm]\s"?([^\.\s\"]*)"?\.?"?([^\.\s\"]*)"?/;
    let match = query.match(source_pattern);
    let schema = match[1];
    let table = match[2];
    if (schema !== this.schema || table !== this.table) {
      throw { message: `Schema and table should be ${this.schema}.${this.table}` };
    }
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
      value.indexOf("'") != -1 ||
      value.indexOf('"') != -1) {
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

function crateToMsInterval(crateInterval: string) {
  let intervals_s = {
    'year': 60 * 60 * 24 * 30 * 12,
    'quarter': 60 * 60 * 24 * 30 * 3,
    'month': 60 * 60 * 24 * 30,
    'week': 60 * 60 * 24 * 7,
    'day': 60 * 60 * 24,
    'hour': 60 * 60,
    'minute': 60,
    'second': 1
  };

  if (intervals_s[crateInterval]) {
    return intervals_s[crateInterval] * 1000; // Return ms
  } else {
    return undefined;
  }
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
  else if (seconds > 1)
    return 'second';
  else
    return 'second';
}
