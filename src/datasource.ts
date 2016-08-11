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
  crateConnection: CrateConnection;


  constructor(instanceSettings,
              private $q,
              private backendSrv,
              private templateSrv) {

    this.type = instanceSettings.type;

    this.url = instanceSettings.url;
    let additional_urls = instanceSettings.jsonData.additionalUrls.split(',');
    let multiply_urls = _.uniq([this.url].concat(additional_urls));
    this.crateConnection = new CrateConnection(multiply_urls);

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
    // Custom value formatter
    this.templateSrv.formatValue = formatCrateValue;

    this.queryBuilder = new CrateQueryBuilder(this.schema,
                                              this.table,
                                              this.defaultTimeColumn,
                                              this.defaultGroupInterval,
                                              this.templateSrv);
  }

  // Called once per panel (graph)
  query(options) {
    let timeFrom = Math.ceil(dateMath.parse(options.range.from));
    let timeTo = Math.ceil(dateMath.parse(options.range.to));
    let interval = convertToCrateInterval(options.interval);

    let queries = _.map(options.targets, target => {
      if (target.hide || (target.rawQuery && !target.query)) {
        return [];
      } else {
        let query: string;
        if (target.rawQuery) {
          query = target.query;
        } else {
          if (target.timeInterval !== 'auto') {
            interval = target.timeInterval;
          }
          query = this.queryBuilder.build(target, interval);
        }
        query = this.templateSrv.replace(query);
        return this._sql_query(query, [timeFrom, timeTo])
          .then(result => {
            return handleResponse(target, result);
          });
      }
    });
    return this.$q.all(_.flatten(queries)).then(result => {
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
    return this._get().then(response => {
      if (response.$$status === 200) {
        return {
          status: "success",
          message: "Cluster: " + response.cluster_name +
            ", version: " + response.version.number,
          title: "Success"
        };
      }
    }, error => {
      let message = error.statusText + ': ';
      if (error.data && error.data.error) {
        message += error.data.error;
      } else {
        message += error.data;
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

    query = this.templateSrv.replace(query);
    return this._sql_query(query).then(result => {
      return _.map(_.flatten(result.rows), row => {
        return {
          text: row,
          value: "'" + row + "'"
        };
      });
    });
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
    let baseUrl = this.url;

    // Use multiple hosts if direct http access used
    if (isDirectAccess(this.url)) {
      baseUrl = this.crateConnection.getUrl();
    }

    let options = {
      url: baseUrl + "/" + url,
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

    return this.backendSrv.datasourceRequest(options);
  }

  _get(url = "") {
    return this._request('GET', url).then(response => {
      response.data.$$status = response.status;
      response.data.$$config = response.config;
      return response.data;
    });
  }

  _post(url: string, data?: any) {
    return this._request('POST', url, data).then(response => {
      response.data.$$status = response.status;
      response.data.$$config = response.config;
      return response.data;
    });
  }
}

export class CrateConnection {
  urlList: string[];
  mainUrl: string;

  private currentUrlIndex: number;

  constructor(urlList) {
    this.urlList = urlList;

    if (urlList.length) {
      this.mainUrl = urlList[0];
    }
    this.currentUrlIndex = 0;
  }

  getUrl(): string {
    return this.urlList[this.getNextIndex()];
  }

  private getNextIndex(): number {
    if (this.currentUrlIndex === this.urlList.length) {
      this.currentUrlIndex = 0;
      return 0;
    } else {
      return this.currentUrlIndex++;
    }
  }
}

function isDirectAccess(url): boolean {
  let proxyUrlPattern = /^\/api/;
  if (url.search(proxyUrlPattern) !== -1) {
    return false;
  } else {
    return true;
  }
}

// Special value formatter for Crate.
// Render multi-value variables for using in SQL "IN" expression:
// $host => ('backend01', 'backend02')
// WHERE host IN $host => WHERE host IN ('backend01', 'backend02')
function formatCrateValue(value, format, variable) {
  if (typeof value === 'string') {
    return value;
  }
  return '(' + value.join(', ') + ')';
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
