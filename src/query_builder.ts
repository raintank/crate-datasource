///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

export class CrateQueryBuilder {
  schema: string;
  table: string;
  defaultTimeColumn: string;
  defaultGroupInterval: string;

  constructor(schema: string,
              table: string,
              defaultTimeColumn: string,
              defaultGroupInterval: string,
              private templateSrv) {
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
  build(target: any, groupInterval = this.defaultGroupInterval) {
    let enabledAggs = _.filter(target.metricAggs, (agg) => {
      return !agg.hide;
    });
    let rawAggs = _.filter(enabledAggs, {type: 'raw'});

    // SELECT
    let query: string;
    if (rawAggs.length) {
      query = "SELECT " + this.defaultTimeColumn + " as time, " +
        this.renderMetricAggs(target.metricAggs);
    } else {
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
      query += ", " + _.map(rawAggs, 'column').join(', ');
    }

    // If GROUP BY specified, sort also by selected columns
    query += " ORDER BY time";
    if (target.groupByColumns && target.groupByColumns.length) {
      query += ", " + target.groupByColumns.join(', ');
    }
    query += " ASC";

    return query;
  }

  // workaround for limit datapoints requested from Crate
  buildCountPointsQuery(target: any) {
    let enabledAggs = _.filter(target.metricAggs, (agg) => {
      return !agg.hide;
    });
    let rawAggs = _.filter(enabledAggs, {type: 'raw'});

    // SELECT
    let query: string;
    let aggs: string;
    let renderedAggs = _.map(enabledAggs, (agg) => {
      return "count" + "(" + agg.column + ")";
    });
    if (renderedAggs.length) {
      aggs = renderedAggs.join(', ');
    } else {
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
      query += ", " + _.map(rawAggs, 'column').join(', ');
    }

    return query;
  }

  /**
   * Builds SQL query for getting available columns from table.
   * @return  {string}  SQL query.
   */
  getColumnsQuery() {
    let query = "SELECT column_name " +
                 "FROM information_schema.columns " +
                 "WHERE schema_name = '" + this.schema + "' " +
                   "AND table_name = '" + this.table + "' " +
                 "ORDER BY 1";
    return query;
  }

  getNumericColumnsQuery() {
    return "SELECT column_name " +
           "FROM information_schema.columns " +
           "WHERE schema_name = '" + this.schema + "' " +
             "AND table_name = '" + this.table + "' " +
             "AND data_type in ('integer', 'long', 'short', 'double', 'float', 'byte') " +
           "ORDER BY 1";
  }

  /**
   * Builds SQL query for getting unique values for given column.
   * @param  {string}  column  Column name
   * @param  {number}  limit   Optional. Limit number returned values.
   */
  getValuesQuery(column: string, limit?: number) {
    let query = "SELECT DISTINCT " + column + " " +
                 "FROM \"" + this.schema + "\".\"" + this.table + "\"";

    if (limit) {
      query += " LIMIT " + limit;
    }
    return query;
  }

  private renderMetricAggs(metricAggs): string {
    let enabledAggs = _.filter(metricAggs, (agg) => {
      return !agg.hide;
    });

    let renderedAggs = _.map(enabledAggs, (agg) => {
      let alias = '';
      if (agg.alias) {
        alias = ' AS \"' + agg.alias + '\"';
      }

      let column = quoteColumn(agg.column);
      if (agg.type === 'count_distinct') {
        return "count(distinct " + column + ")" + alias;
      } else if (agg.type === 'raw') {
        return column + alias;
      } else {
        return agg.type + "(" + column + ")" + alias;
      }
    });

    if (renderedAggs.length) {
      return renderedAggs.join(', ');
    } else {
      return "";
    }
  }

  private renderWhereClauses(whereClauses): string {
    let renderedClauses = _.map(whereClauses, (clauseObj, index) => {
      let rendered = "";
      if (index !== 0) {
        rendered += clauseObj.condition + " ";
      }

      // Quote arguments as required by the operator and value type
      let rendered_value: string;
      let value = clauseObj.value;
      if (clauseObj.operator.toLowerCase() === 'in') {
        // Handle IN operator. Split comma-separated values.
        // "42, 10, a" => 42, 10, 'a'
        rendered_value = '(' + _.map(value.split(','), v => {
          v = v.trim();
          if (!isNaN(v) || this.containsVariable(v)) {
            return v;
          } else {
            return "'" + v + "'";
          }
        }).join(', ') + ')';
      } else {
        rendered_value = _.map(value.split(','), v => {
          v = v.trim();
          if (!isNaN(v) || this.containsVariable(v)) {
            return v;
          } else {
            return "'" + v + "'";
          }
        }).join(', ');
      }
      rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + rendered_value;
      return rendered;
    });
    return renderedClauses.join(' ');
  }

  // Check for template variables
  private containsVariable(str: string): boolean {
    let variables = _.map(this.templateSrv.variables, 'name');
    return _.some(variables, variable => {
      let pattern = new RegExp('\\$' + variable);
      return pattern.test(str);
    });
  }
}

export function getSchemas() {
  var query = "SELECT DISTINCT schema_name " +
              "FROM information_schema.tables " +
              "WHERE schema_name NOT IN ('information_schema', 'blob', 'sys') " +
              "ORDER BY 1";
  return query;
}

export function getTables(schema) {
  var query = "SELECT table_name " +
               "FROM information_schema.tables " +
               "WHERE schema_name='" + schema + "' " +
               "ORDER BY 1";
  return query;
}

function quoteColumn(column: string): string {
  if (isWithUpperCase(column)) {
    return '\"' + column + '\"';
  } else {
    return column;
  }
}

function isWithUpperCase(str: string): boolean {
  return str.toLowerCase() !== str;
}
