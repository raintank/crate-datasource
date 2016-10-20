///<reference path="../headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var CrateQueryBuilder;
    function getSchemas() {
        var query = "SELECT DISTINCT schema_name " +
            "FROM information_schema.tables " +
            "WHERE schema_name NOT IN ('information_schema', 'blob', 'sys') " +
            "ORDER BY 1";
        return query;
    }
    exports_1("getSchemas", getSchemas);
    function getTables(schema) {
        var query = "SELECT table_name " +
            "FROM information_schema.tables " +
            "WHERE schema_name='" + schema + "' " +
            "ORDER BY 1";
        return query;
    }
    exports_1("getTables", getTables);
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
                        console.log('RAW');
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
                        "WHERE " + this.defaultTimeColumn + " >= ? AND " +
                        this.defaultTimeColumn + " <= ?";
                    // WHERE
                    if (target.whereClauses && target.whereClauses.length) {
                        query += " AND " + this.renderWhereClauses(target.whereClauses);
                    }
                    // GROUP BY
                    query += " GROUP BY time";
                    if (target.groupByColumns && target.groupByColumns.length) {
                        query += ", " + target.groupByColumns.join(', ');
                    }
                    if (rawAggs.length) {
                        query += ", " + lodash_1["default"].map(rawAggs, 'column').join(', ');
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
                    query += " GROUP BY ";
                    if (target.groupByColumns && target.groupByColumns.length) {
                        query += target.groupByColumns.join(', ');
                    }
                    if (rawAggs.length) {
                        query += ", " + lodash_1["default"].map(rawAggs, 'column').join(', ');
                    }
                    return query;
                };
                /**
                 * Builds SQL query for getting available columns from table.
                 * @return  {string}  SQL query.
                 */
                CrateQueryBuilder.prototype.getColumnsQuery = function () {
                    var query = "SELECT column_name " +
                        "FROM information_schema.columns " +
                        "WHERE schema_name = '" + this.schema + "' " +
                        "AND table_name = '" + this.table + "' " +
                        "ORDER BY 1";
                    return query;
                };
                CrateQueryBuilder.prototype.getNumericColumnsQuery = function () {
                    return "SELECT column_name " +
                        "FROM information_schema.columns " +
                        "WHERE schema_name = '" + this.schema + "' " +
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
                        "FROM \"" + this.schema + "\".\"" + this.table + "\"";
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
                        if (agg.type === 'count_distinct') {
                            return "count(distinct " + agg.column + ")";
                        }
                        else if (agg.type === 'raw') {
                            return agg.column;
                        }
                        else {
                            return agg.type + "(" + agg.column + ")";
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
                        // Put non-numeric values into quotes.
                        var value;
                        if (lodash_1["default"].isNumber(clauseObj.value) ||
                            _this.containsVariable(clauseObj.value)) {
                            value = clauseObj.value;
                        }
                        else {
                            value = "'" + clauseObj.value + "'";
                        }
                        rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + value;
                        return rendered;
                    });
                    return renderedClauses.join(' ');
                };
                // Check for template variables
                CrateQueryBuilder.prototype.containsVariable = function (str) {
                    var variables = lodash_1["default"].map(this.templateSrv.variables, 'name');
                    var self = this;
                    return lodash_1["default"].some(variables, function (variable) {
                        return self.templateSrv.containsVariable(str, variable);
                    });
                };
                return CrateQueryBuilder;
            })();
            exports_1("CrateQueryBuilder", CrateQueryBuilder);
        }
    }
});
//# sourceMappingURL=query_builder.js.map