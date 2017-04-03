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
            value.indexOf("'") != -1 ||
            value.indexOf('"') != -1) {
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
    function crateToMsInterval(crateInterval) {
        var intervals_s = {
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
        }
        else {
            return undefined;
        }
    }
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
        else if (seconds > 1)
            return 'second';
        else
            return 'second';
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
                    this.checkQuerySource = instanceSettings.jsonData.checkQuerySource;
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
                    var timeFilter = this.getTimeFilter(timeFrom, timeTo);
                    var scopedVars = this.setScopedVars(options.scopedVars);
                    var queries = lodash_1["default"].map(options.targets, function (target) {
                        if (target.hide || (target.rawQuery && !target.query)) {
                            return [];
                        }
                        var query;
                        var rawAggQuery;
                        var queryTarget, rawAggTarget;
                        var getQuery;
                        var getRawAggQuery;
                        var getRawAggInterval;
                        var adhocFilters = _this.templateSrv.getAdhocFilters(_this.name);
                        if (target.rawQuery) {
                            query = target.query;
                        }
                        else {
                            var minInterval = Math.ceil((timeTo - timeFrom) / _this.CRATE_ROWS_LIMIT);
                            var maxLimit = timeTo - timeFrom;
                            var interval;
                            if (target.timeInterval === 'auto') {
                                interval = getMinCrateInterval(options.intervalMs);
                            }
                            else if (target.timeInterval === 'auto_gf') {
                                // Use intervalMs for panel, provided by Grafana
                                interval = options.intervalMs;
                            }
                            else {
                                interval = target.timeInterval;
                            }
                            // Split target into two queries (with aggs and raw data)
                            query = _this.queryBuilder.buildAggQuery(target, interval, adhocFilters);
                            queryTarget = lodash_1["default"].cloneDeep(target);
                            queryTarget.metricAggs = query_builder_1.getNotRawAggs(queryTarget.metricAggs);
                            rawAggQuery = _this.queryBuilder.buildRawAggQuery(target, 0, adhocFilters, maxLimit);
                            rawAggQuery = _this.templateSrv.replace(rawAggQuery, scopedVars, formatCrateValue);
                            rawAggTarget = lodash_1["default"].cloneDeep(target);
                            rawAggTarget.metricAggs = query_builder_1.getRawAggs(rawAggTarget.metricAggs);
                        }
                        query = _this.templateSrv.replace(query, scopedVars, formatCrateValue);
                        var queries = [
                            { query: query, target: queryTarget },
                            { query: rawAggQuery, target: rawAggTarget }
                        ];
                        queries = lodash_1["default"].filter(queries, function (q) {
                            return q.query;
                        });
                        return lodash_1["default"].map(queries, function (q) {
                            return _this._sql_query(q.query, [timeFrom, timeTo])
                                .then(function (result) {
                                if (q.target) {
                                    return response_handler_1["default"](q.target, result);
                                }
                                else {
                                    return response_handler_1["default"](target, result);
                                }
                            });
                        });
                    });
                    return this.$q.all(lodash_1["default"].flattenDepth(queries, 2)).then(function (result) {
                        return {
                            data: lodash_1["default"].flatten(result)
                        };
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
                    var query = this.queryBuilder.getValuesQuery(options.key, this.CRATE_ROWS_LIMIT, range);
                    return this.metricFindQuery(query);
                };
                CrateDatasource.prototype.setScopedVars = function (scopedVars) {
                    scopedVars.crate_schema = { text: this.schema, value: "\"" + this.schema + "\"" };
                    scopedVars.crate_table = { text: this.table, value: "\"" + this.table + "\"" };
                    var crate_source = "\"" + this.schema + "\".\"" + this.table + "\"";
                    scopedVars.crate_source = { text: crate_source, value: crate_source };
                    return scopedVars;
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
                    if (this.checkQuerySource) {
                        // Checks schema and table and throw error if it different from configured in data source
                        this.checkSQLSource(query);
                    }
                    return this._post('_sql', data);
                };
                CrateDatasource.prototype.checkSQLSource = function (query) {
                    var source_pattern = /.*[Ff][Rr][Oo][Mm]\s"?([^\.\s\"]*)"?\.?"?([^\.\s\"]*)"?/;
                    var match = query.match(source_pattern);
                    var schema = match[1];
                    var table = match[2];
                    if (schema !== this.schema || table !== this.table) {
                        throw { message: "Schema and table should be " + this.schema + "." + this.table };
                    }
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