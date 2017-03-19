///<reference path="../headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var CrateQueryBuilder;
    function getSchemas() {
        var query = "SELECT schema_name " +
            "FROM information_schema.schemata " +
            "WHERE schema_name NOT IN ('information_schema', 'blob', 'sys', 'pg_catalog') " +
            "ORDER BY 1";
        return query;
    }
    exports_1("getSchemas", getSchemas);
    function getTables(schema) {
        var query = "SELECT table_name " +
            "FROM information_schema.tables " +
            "WHERE table_schema='" + schema + "' " +
            "ORDER BY 1";
        return query;
    }
    exports_1("getTables", getTables);
    function quoteColumn(column) {
        if (isWithUpperCase(column)) {
            return '\"' + column + '\"';
        }
        else {
            return column;
        }
    }
    function isWithUpperCase(str) {
        return str.toLowerCase() !== str;
    }
    function aggregateMetrics(metricAggs, aggType) {
        var aggs = lodash_1["default"].cloneDeep(metricAggs);
        return lodash_1["default"].map(aggs, function (agg) {
            if (agg.type === 'raw') {
                agg.type = aggType;
                return agg;
            }
            else {
                return agg;
            }
        });
    }
    function getEnabledAggs(metricAggs) {
        return lodash_1["default"].filter(metricAggs, function (agg) {
            return !agg.hide;
        });
    }
    exports_1("getEnabledAggs", getEnabledAggs);
    function getRawAggs(metricAggs) {
        return lodash_1["default"].filter(metricAggs, { type: 'raw' });
    }
    exports_1("getRawAggs", getRawAggs);
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            CrateQueryBuilder = (function () {
                function CrateQueryBuilder(schema, table, defaultTimeColumn, defaultGroupInterval, templateSrv) {
                    this.templateSrv = templateSrv;
                    this.schema = schema;
                    this.table = table;
                    this.defaultTimeColumn = defaultTimeColumn;
                    this.defaultGroupInterval = defaultGroupInterval;
                    this.templateSrv = templateSrv;
                }
                /**
                 * Builds Crate SQL query from given target object.
                 * @param  {any}     target         Target object.
                 * @param  {number}  groupInterval  Interval for grouping values.
                 * @param  {string}  defaultAgg     Default aggregation for values.
                 * @return {string}                 SQL query.
                 */
                CrateQueryBuilder.prototype.build = function (target, groupInterval, defaultAgg) {
                    if (groupInterval === void 0) { groupInterval = 0; }
                    if (defaultAgg === void 0) { defaultAgg = 'avg'; }
                    var query;
                    var timeExp;
                    var aggs = getEnabledAggs(target.metricAggs);
                    var rawAggs = getRawAggs(aggs);
                    if (!aggs.length) {
                        return null;
                    }
                    if (groupInterval) {
                        // Manually aggregate by time interval, ie "SELECT floor(ts/10)*10 as time ..."
                        timeExp = "floor(" + this.defaultTimeColumn + "/" + groupInterval + ")*" + groupInterval;
                        aggs = aggregateMetrics(aggs, 'avg');
                    }
                    else {
                        timeExp = this.defaultTimeColumn;
                    }
                    // SELECT
                    var renderedAggs = this.renderMetricAggs(aggs);
                    query = "SELECT " + timeExp + " as time, " + renderedAggs;
                    // Add GROUP BY columns to SELECT statement.
                    if (target.groupByColumns && target.groupByColumns.length) {
                        query += ", " + target.groupByColumns.join(', ');
                    }
                    query += " FROM \"" + this.schema + "\".\"" + this.table + "\" " +
                        "WHERE $timeFilter";
                    // WHERE
                    if (target.whereClauses && target.whereClauses.length) {
                        query += " AND " + this.renderWhereClauses(target.whereClauses);
                    }
                    // GROUP BY
                    query += " GROUP BY time";
                    if (!groupInterval && rawAggs.length) {
                        query += ", " + this.renderMetricAggs(rawAggs, false);
                    }
                    if (target.groupByColumns && target.groupByColumns.length) {
                        query += ", " + target.groupByColumns.join(', ');
                    }
                    // If GROUP BY specified, sort also by selected columns
                    query += " ORDER BY time";
                    if (target.groupByColumns && target.groupByColumns.length) {
                        query += ", " + target.groupByColumns.join(', ');
                    }
                    query += " ASC";
                    return query;
                };
                CrateQueryBuilder.prototype.renderAdhocFilters = function (filters) {
                    var conditions = lodash_1["default"].map(filters, function (tag, index) {
                        var str = "";
                        var operator = tag.operator;
                        var value = tag.value;
                        if (index > 0) {
                            str = (tag.condition || 'AND') + ' ';
                        }
                        if (operator === '=~') {
                            operator = '~';
                        }
                        return str + '"' + tag.key + '" ' + operator + ' \'' + value.replace(/'/g, "''") + '\'';
                    });
                    return conditions.join(' ');
                };
                /**
                 * Builds SQL query for getting available columns from table.
                 * @return  {string}  SQL query.
                 */
                CrateQueryBuilder.prototype.getColumnsQuery = function () {
                    var query = "SELECT column_name " +
                        "FROM information_schema.columns " +
                        "WHERE table_schema = '" + this.schema + "' " +
                        "AND table_name = '" + this.table + "' " +
                        "ORDER BY 1";
                    return query;
                };
                CrateQueryBuilder.prototype.getNumericColumnsQuery = function () {
                    return "SELECT column_name " +
                        "FROM information_schema.columns " +
                        "WHERE table_schema = '" + this.schema + "' " +
                        "AND table_name = '" + this.table + "' " +
                        "AND data_type in ('integer', 'long', 'short', 'double', 'float', 'byte') " +
                        "ORDER BY 1";
                };
                /**
                 * Builds SQL query for getting unique values for given column.
                 * @param  {string}  column  Column name
                 * @param  {number}  limit   Optional. Limit number returned values.
                 */
                CrateQueryBuilder.prototype.getValuesQuery = function (column, limit) {
                    var query = "SELECT DISTINCT " + column + " " +
                        "FROM \"" + this.schema + "\".\"" + this.table + "\" " +
                        "WHERE $timeFilter";
                    if (limit) {
                        query += " LIMIT " + limit;
                    }
                    return query;
                };
                CrateQueryBuilder.prototype.renderMetricAggs = function (metricAggs, withAlias) {
                    if (withAlias === void 0) { withAlias = true; }
                    var enabledAggs = lodash_1["default"].filter(metricAggs, function (agg) {
                        return !agg.hide;
                    });
                    var renderedAggs = lodash_1["default"].map(enabledAggs, function (agg) {
                        var alias = '';
                        if (agg.alias && withAlias) {
                            alias = ' AS \"' + agg.alias + '\"';
                        }
                        var column = quoteColumn(agg.column);
                        if (agg.type === 'count_distinct') {
                            return "count(distinct " + column + ")" + alias;
                        }
                        else if (agg.type === 'raw') {
                            return column + alias;
                        }
                        else {
                            return agg.type + "(" + column + ")" + alias;
                        }
                    });
                    if (renderedAggs.length) {
                        return renderedAggs.join(', ');
                    }
                    else {
                        return "";
                    }
                };
                CrateQueryBuilder.prototype.renderWhereClauses = function (whereClauses) {
                    var _this = this;
                    var renderedClauses = lodash_1["default"].map(whereClauses, function (clauseObj, index) {
                        var rendered = "";
                        if (index !== 0) {
                            rendered += clauseObj.condition + " ";
                        }
                        // Quote arguments as required by the operator and value type
                        var rendered_value;
                        var value = clauseObj.value;
                        if (clauseObj.operator.toLowerCase() === 'in') {
                            // Handle IN operator. Split comma-separated values.
                            // "42, 10, a" => 42, 10, 'a'
                            rendered_value = '(' + lodash_1["default"].map(value.split(','), function (v) {
                                v = v.trim();
                                if (!isNaN(v) || _this.containsVariable(v)) {
                                    return v;
                                }
                                else {
                                    return "'" + v + "'";
                                }
                            }).join(', ') + ')';
                        }
                        else {
                            rendered_value = lodash_1["default"].map(value.split(','), function (v) {
                                v = v.trim();
                                if (!isNaN(v) || _this.containsVariable(v)) {
                                    return v;
                                }
                                else {
                                    return "'" + v + "'";
                                }
                            }).join(', ');
                        }
                        rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + rendered_value;
                        return rendered;
                    });
                    return renderedClauses.join(' ');
                };
                // Check for template variables
                CrateQueryBuilder.prototype.containsVariable = function (str) {
                    var variables = lodash_1["default"].map(this.templateSrv.variables, 'name');
                    return lodash_1["default"].some(variables, function (variable) {
                        var pattern = new RegExp('\\$' + variable);
                        return pattern.test(str);
                    });
                };
                return CrateQueryBuilder;
            })();
            exports_1("CrateQueryBuilder", CrateQueryBuilder);
        }
    }
});
//# sourceMappingURL=query_builder.js.map