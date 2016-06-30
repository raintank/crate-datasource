///<reference path="../headers/common.d.ts" />

import _ from 'lodash';
import * as dateMath from 'app/core/utils/datemath';
import * as queryBuilder from './query_builder';
import * as response_handler from './response_handler';

export class CrateDatasource {
  type: string;
  url: string;
  name: string;
  schema: string;
  table: string;
  defaultTimeColumn: string;
  defaultGroupInterval: string;


  constructor(instanceSettings,
              private $q,
              private backendSrv,
              private templateSrv) {

    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.schema = instanceSettings.jsonData.schema;
    this.table = instanceSettings.jsonData.table;
    this.defaultTimeColumn = instanceSettings.jsonData.defaultTimeColumn;
    this.defaultGroupInterval = instanceSettings.jsonData.defaultGroupInterval;
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
  }

  // Called once per panel (graph)
  query(options) {
    let timeFrom = Math.ceil(dateMath.parse(options.range.from));
    let timeTo = Math.ceil(dateMath.parse(options.range.to));

    let queries = _.map(options.targets, target => {
      if (target.hide || (target.rawQuery && !target.query)) {
        return [];
      } else {
        if (target.rawQuery) {
          return this._sql_query(target.query, [timeFrom, timeTo])
            .then(response => {
              return response_handler.handle_response(target, response);
            });
        } else {
          return this._sql_query(queryBuilder.buildQuery(target, true), [timeFrom, timeTo])
            .then(response => {
              return response_handler.handle_response(target, response);
            });
        }
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
    return this.backendSrv.datasourceRequest({
      url: this.url + '/',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        let cluster_name = response.data.cluster_name;
        let crate_version = response.data.version.number;
        return {
          status: "success",
          message: "Cluster: " + cluster_name + ", version: " + crate_version,
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

  /**
   * Sends SQL query to Crate and returns result.
   *
   * @param {string} query SQL query string
   * @param {any[]}  args  Optional query arguments
   *
   * @return
   */
  _sql_query(query: string, args: any[] = []) {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/_sql',
      data: {
        "stmt": query,
        "args": args
      },
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(result => {
      return result;
    }, error => {
      return error;
    });
  }

}
