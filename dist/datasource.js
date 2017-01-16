///<reference path="../headers/common.d.ts" />
System.register(['lodash', 'app/core/utils/datemath', './query_builder', './response_handler'], function(exports_1) {
    var lodash_1, dateMath, query_builder_1, response_handler_1;
    var CrateDatasource;
    // Special value formatter for Crate.
    function formatCrateValue(value) {
        if (typeof value === 'string') {
            return wrapWithQuotes(value);
        }
        else {
            return value.map(function (v) { return wrapWithQuotes(v); }).join(', ');
        }
    }
    function wrapWithQuotes(value) {
        if (!isNaN(value) ||
            value.indexOf("'") != -1) {
            return value;
        }
        else {
            return "'" + value + "'";
        }
    }
    function convertToCrateInterval(grafanaInterval) {
        var crateIntervals = [
            { shorthand: 's', value: 'second' },
            { shorthand: 'm', value: 'minute' },
            { shorthand: 'h', value: 'hour' },
            { shorthand: 'd', value: 'day' },
            { shorthand: 'w', value: 'week' },
            { shorthand: 'M', value: 'month' },
            { shorthand: 'y', value: 'year' }
        ];
        var intervalRegex = /([\d]*)([smhdwMy])/;
        var parsedInterval = intervalRegex.exec(grafanaInterval);
        var value = Number(parsedInterval[1]);
        var unit = parsedInterval[2];
        var crateInterval = lodash_1["default"].find(crateIntervals, { 'shorthand': unit });
        return crateInterval ? crateInterval.value : undefined;
    }
    exports_1("convertToCrateInterval", convertToCrateInterval);
    function getMinCrateInterval(ms) {
        var seconds = ms / 1000;
        if (seconds > 60 * 60 * 24 * 30 * 3)
            return 'year';
        else if (seconds > 60 * 60 * 24 * 30)
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
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (dateMath_1) {
                dateMath = dateMath_1;
            },
            function (query_builder_1_1) {
                query_builder_1 = query_builder_1_1;
            },
            function (response_handler_1_1) {
                response_handler_1 = response_handler_1_1;
            }],
        execute: function() {
            CrateDatasource = (function () {
                function CrateDatasource(instanceSettings, $q, backendSrv, templateSrv, timeSrv) {
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.timeSrv = timeSrv;
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
                    this.timeSrv = timeSrv;
                    this.queryBuilder = new query_builder_1.CrateQueryBuilder(this.schema, this.table, this.defaultTimeColumn, this.defaultGroupInterval, this.templateSrv);
                    this.CRATE_ROWS_LIMIT = 10000;
                }
                // Called once per panel (graph)
                CrateDatasource.prototype.query = function (options) {
                    var _this = this;
                    var timeFrom = Math.ceil(dateMath.parse(options.range.from));
                    var timeTo = Math.ceil(dateMath.parse(options.range.to));
                    var getInterval = this.$q.when(convertToCrateInterval(options.interval));
                    var timeFilter = this.getTimeFilter(timeFrom, timeTo);
                    var scopedVars = options.scopedVars ? lodash_1["default"].cloneDeep(options.scopedVars) : {};
                    var queries = lodash_1["default"].map(options.targets, function (target) {
                        if (target.hide || (target.rawQuery && !target.query)) {
                            return [];
                        }
                        else {
                            var getQuery;
                            if (target.rawQuery) {
                                getQuery = _this.$q.when(target.query);
                            }
                            else {
                                if (target.timeInterval !== 'auto') {
                                    getInterval = _this.$q.when(target.timeInterval);
                                }
                                else {
                                    // Use SELECT count(*) query for calculating required time interval
                                    // This is needed because Crate limit response to 10 000 rows.
                                    getInterval = _this._count_series_query(target, timeFrom, timeTo, options)
                                        .then(function (count) {
                                        var min_interval = (timeTo - timeFrom) / (_this.CRATE_ROWS_LIMIT / count);
                                        return getMinCrateInterval(min_interval);
                                    });
                                }
                                getQuery = getInterval.then(function (interval) {
                                    return _this.queryBuilder.build(target, interval);
                                });
                            }
                            return getQuery.then(function (query) {
                                var adhocFilters = _this.templateSrv.getAdhocFilters(_this.name);
                                if (adhocFilters.length > 0) {
                                    timeFilter += " AND " + _this.queryBuilder.renderAdhocFilters(adhocFilters);
                                }
                                scopedVars.timeFilter = { value: timeFilter };
                                query = _this.templateSrv.replace(query, scopedVars, formatCrateValue);
                                return _this._sql_query(query, [timeFrom, timeTo])
                                    .then(function (result) {
                                    return response_handler_1["default"](target, result);
                                });
                            });
                        }
                    });
                    return this.$q.all(lodash_1["default"].flatten(queries)).then(function (result) {
                        return {
                            data: lodash_1["default"].flatten(result)
                        };
                    });
                };
                // Workaround for limit datapoints requested from Crate
                // Count points returned by time series query
                CrateDatasource.prototype._count_series_query = function (target, timeFrom, timeTo, options) {
                    var query = this.queryBuilder.buildCountPointsQuery(target);
                    query = this.templateSrv.replace(query, options.scopedVars, formatCrateValue);
                    return this._sql_query(query, [timeFrom, timeTo])
                        .then(function (result) {
                        return result.rowcount;
                    });
                };
                /**
                 * Required.
                 * Checks datasource and returns Crate cluster name and version or
                 * error details.
                 */
                CrateDatasource.prototype.testDatasource = function () {
                    return this._get()
                        .then(function (response) {
                        if (response.$$status === 200) {
                            return {
                                status: "success",
                                message: "Cluster: " + response.cluster_name +
                                    ", version: " + response.version.number,
                                title: "Success"
                            };
                        }
                    })
                        .catch(function (error) {
                        var message = error.statusText ? error.statusText + ': ' : '';
                        if (error.data && error.data.error) {
                            message += error.data.error;
                        }
                        else if (error.data) {
                            message += error.data;
                        }
                        else {
                            message = "Can't connect to Crate instance";
                        }
                        return {
                            status: "error",
                            message: message,
                            title: "Error"
                        };
                    });
                };
                CrateDatasource.prototype.metricFindQuery = function (query) {
                    if (!query) {
                        return this.$q.when([]);
                    }
                    query = this.templateSrv.replace(query, null, formatCrateValue);
                    return this._sql_query(query).then(function (result) {
                        return lodash_1["default"].map(lodash_1["default"].flatten(result.rows), function (row) {
                            return {
                                text: row.toString(),
                                value: row
                            };
                        });
                    });
                };
                CrateDatasource.prototype.getTimeFilter = function (timeFrom, timeTo) {
                    return this.defaultTimeColumn + " >= '" + timeFrom + "' and " + this.defaultTimeColumn + " <= '" + timeTo + "'";
                };
                CrateDatasource.prototype.getTagKeys = function (options) {
                    var query = this.queryBuilder.getColumnsQuery();
                    return this.metricFindQuery(query);
                };
                CrateDatasource.prototype.getTagValues = function (options) {
                    var range = this.timeSrv.timeRange();
                    var timeFrom = this.getCrateTime(range.from);
                    var timeTo = this.getCrateTime(range.to);
                    var timeFilter = this.getTimeFilter(timeFrom, timeTo);
                    var scopedVars = { timeFilter: { value: timeFilter } };
                    var query = this.queryBuilder.getValuesQuery(options.key, this.CRATE_ROWS_LIMIT);
                    query = this.templateSrv.replace(query, scopedVars);
                    return this.metricFindQuery(query);
                };
                CrateDatasource.prototype.getCrateTime = function (date) {
                    return date.valueOf();
                };
                /**
                 * Sends SQL query to Crate and returns result.
                 * @param {string} query SQL query string
                 * @param {any[]}  args  Optional query arguments
                 * @return
                 */
                CrateDatasource.prototype._sql_query = function (query, args) {
                    if (args === void 0) { args = []; }
                    var data = {
                        "stmt": query,
                        "args": args
                    };
                    return this._post('_sql', data);
                };
                CrateDatasource.prototype._request = function (method, url, data) {
                    var options = {
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
                        .then(function (response) {
                        response.data.$$status = response.status;
                        response.data.$$config = response.config;
                        return response.data;
                    });
                };
                CrateDatasource.prototype._get = function (url) {
                    if (url === void 0) { url = ""; }
                    return this._request('GET', url);
                };
                CrateDatasource.prototype._post = function (url, data) {
                    return this._request('POST', url, data);
                };
                return CrateDatasource;
            })();
            exports_1("CrateDatasource", CrateDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map