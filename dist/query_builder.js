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
                 * @param  {string}  groupInterval  Crate interval for date_trunc() function.
                 * @return {string}                 SQL query.
                 */
                CrateQueryBuilder.prototype.build = function (target, groupInterval) {
                    if (groupInterval === void 0) { groupInterval = this.defaultGroupInterval; }
                    var enabledAggs = lodash_1["default"].filter(target.metricAggs, function (agg) {
                        return !agg.hide;
                    });
                    var rawAggs = lodash_1["default"].filter(enabledAggs, { type: 'raw' });
                    // SELECT
                    var query;
                    if (rawAggs.length) {
                        query = "SELECT " + this.defaultTimeColumn + " as time, " +
                            this.renderMetricAggs(target.metricAggs);
                    }
                    else {
                        query = "SELECT date_trunc('" + groupInterval + "', " +
                            this.defaultTimeColumn + ") as time, " +
                            this.renderMetricAggs(target.metricAggs);
                    }
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
                    if (!rawAggs.length) {
                        query += " GROUP BY time";
                        if (target.groupByColumns && target.groupByColumns.length) {
                            query += ", " + target.groupByColumns.join(', ');
                        }
                    }
                    // If GROUP BY specified, sort also by selected columns
                    query += " ORDER BY time";
                    if (target.groupByColumns && target.groupByColumns.length) {
                        query += ", " + target.groupByColumns.join(', ');
                    }
                    query += " ASC";
                    return query;
                };
                // workaround for limit datapoints requested from Crate
                CrateQueryBuilder.prototype.buildCountPointsQuery = function (target) {
                    var enabledAggs = lodash_1["default"].filter(target.metricAggs, function (agg) {
                        return !agg.hide;
                    });
                    var rawAggs = lodash_1["default"].filter(enabledAggs, { type: 'raw' });
                    // SELECT
                    var query;
                    var aggs;
                    var renderedAggs = lodash_1["default"].map(enabledAggs, function (agg) {
                        return "count" + "(" + agg.column + ")";
                    });
                    if (renderedAggs.length) {
                        aggs = renderedAggs.join(', ');
                    }
                    else {
                        aggs = "";
                    }
                    query = "SELECT count(*) " +
                        "FROM \"" + this.schema + "\".\"" + this.table + "\" " +
                        "WHERE " + this.defaultTimeColumn + " >= ? AND " +
                        this.defaultTimeColumn + " <= ?";
                    // WHERE
                    if (target.whereClauses && target.whereClauses.length) {
                        query += " AND " + this.renderWhereClauses(target.whereClauses);
                    }
                    // GROUP BY
                    if (!rawAggs.length) {
                        query += " GROUP BY ";
                        if (target.groupByColumns && target.groupByColumns.length) {
                            query += target.groupByColumns.join(', ');
                        }
                    }
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
                CrateQueryBuilder.prototype.renderMetricAggs = function (metricAggs) {
                    var enabledAggs = lodash_1["default"].filter(metricAggs, function (agg) {
                        return !agg.hide;
                    });
                    var renderedAggs = lodash_1["default"].map(enabledAggs, function (agg) {
                        var alias = '';
                        if (agg.alias) {
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