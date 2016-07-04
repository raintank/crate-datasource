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
              defaultGroupInterval: string) {
    this.schema = schema;
    this.table = table;
    this.defaultTimeColumn = defaultTimeColumn;
    this.defaultGroupInterval = defaultGroupInterval;
  }

  /**
   * Builds Crate SQL query from given target object.
   * @param  {any}     target         Target object.
   * @param  {string}  groupInterval  Crate interval for date_trunc() function.
   * @return {string}                 SQL query.
   */
  build(target: any, groupInterval = this.defaultGroupInterval) {
    // SELECT
    let query = "SELECT date_trunc('" + groupInterval + "', " +
      this.defaultTimeColumn + ") as time, " +
      this.renderMetricAggs(target.metricAggs);

    // Add GROUP BY columns to SELECT statement.
    if (target.groupByColumns && target.groupByColumns.length) {
      query += ", " + target.groupByColumns.join(', ');
    }
    query += " FROM \"" + this.schema + "\".\"" + this.table + "\" " +
             "WHERE time >= ? AND time <= ?";

    // WHERE
    if (target.whereClauses && target.whereClauses.length) {
      query += " AND " + this.renderWhereClauses(target.whereClauses);
    }

    // GROUP BY
    query += " GROUP BY time";
    if (target.groupByColumns && target.groupByColumns.length) {
      query += ", " + target.groupByColumns.join(', ');
    }

    query += " ORDER BY time ASC";

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
      if (agg.type === 'count_distinct') {
        return "count(distinct " + agg.column + ")";
      } else {
        return agg.type + "(" + agg.column + ")";
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

      // Put non-numeric values into quotes.
      let value = _.isNumber(clauseObj.value) ? Number(clauseObj.value) : "'" + clauseObj.value + "'";
      rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + value;
      return rendered;
    });
    return renderedClauses.join(' ');
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
