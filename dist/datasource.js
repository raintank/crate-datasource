'use strict';

System.register(['lodash', 'app/core/utils/datemath', './query_builder', './response_handler'], function (_export, _context) {
  var _, dateMath, queryBuilder, response_handler, _createClass, CrateDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreUtilsDatemath) {
      dateMath = _appCoreUtilsDatemath;
    }, function (_query_builder) {
      queryBuilder = _query_builder;
    }, function (_response_handler) {
      response_handler = _response_handler;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('CrateDatasource', CrateDatasource = function () {
        function CrateDatasource(instanceSettings, $q, backendSrv) {
          _classCallCheck(this, CrateDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.$q = $q;
          this.backendSrv = backendSrv;
        }

        // Called once per panel (graph)


        _createClass(CrateDatasource, [{
          key: 'query',
          value: function query(options) {
            var _this = this;

            var timeFrom = Math.ceil(dateMath.parse(options.range.from));
            var timeTo = Math.ceil(dateMath.parse(options.range.to));

            var queries = _.map(options.targets, function (target) {
              if (target.hide || target.rawQuery && !target.query) {
                return [];
              } else {
                if (target.rawQuery) {
                  return _this._sql_query(target.query).then(function (response) {
                    return response_handler.handle_response(target, response);
                  });
                } else {
                  return _this._sql_query(queryBuilder.buildQuery(target, timeFrom, timeTo)).then(function (response) {
                    return response_handler.handle_response(target, response);
                  });
                }
              }
            });
            return this.$q.all(_.flatten(queries)).then(function (result) {
              return {
                data: _.flatten(result)
              };
            });
          }
        }, {
          key: 'testDatasource',
          value: function testDatasource() {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/',
              method: 'GET'
            }).then(function (response) {
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
        }, {
          key: '_sql_query',
          value: function _sql_query(query) {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/_sql',
              data: {
                "stmt": query
              },
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        }]);

        return CrateDatasource;
      }());

      _export('CrateDatasource', CrateDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
