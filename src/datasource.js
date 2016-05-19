import _ from 'lodash';
import * as dateMath from 'app/core/utils/datemath';
import * as queryBuilder from './query_builder';
import * as response_handler from './response_handler';

export class CrateDatasource {

  constructor(instanceSettings, $q, backendSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.$q = $q;
    this.backendSrv = backendSrv;
  }

  // Called once per panel (graph)
  query(options) {
    var timeFrom = Math.ceil(dateMath.parse(options.range.from));
    var timeTo = Math.ceil(dateMath.parse(options.range.to));

    var queries = _.map(options.targets, target => {
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

  // Required
  // Used for testing datasource in datasource configuration pange
  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        var cluster_name = response.data.cluster_name;
        var crate_version = response.data.version.number;
        return {
          status: "success",
          message: "Cluster: " + cluster_name + ", version: " + crate_version,
          title: "Success"
        };
      }
    });
  }

  _sql_query(query, args=[]) {
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
    });
  }

}
