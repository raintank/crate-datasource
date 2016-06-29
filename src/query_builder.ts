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
   * @param  {any}    target  Target object.
   * @return {string}         SQL query.
   */
  build(target) {
    let query = "SELECT date_trunc('minute', " + this.defaultTimeColumn + ") as time " +
      target.selectColumns +
      "FROM \"" + this.schema + "\".\"" + this.table + "\" " +
      "WHERE time >= ? AND time <= ?";

    // WHERE
    if (target.whereClauses && target.whereClauses.length) {
      query += " AND " + this.renderWhereClauses(target.whereClauses);
    }

    query += " GROUP BY time ";
    query += "ORDER BY time ASC";

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

  private renderWhereClauses(whereClauses) {
    let renderedClauses = _.map(whereClauses, (clauseObj, index) => {
      let rendered = "";
      if (index !== 0) {
        rendered += clauseObj.condition;
      }

      // Put non-numeric values into quotes.
      let value = _.isNumber(clauseObj.value) ? Number(clauseObj.value) : "'" + clauseObj.value + "'";
      rendered += clauseObj.key + ' ' + clauseObj.operator + ' ' + value;
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

export function getColumns(schema, table) {
  var query = "SELECT column_name " +
               "FROM information_schema.columns " +
               "WHERE schema_name='" + schema + "' " +
                 "AND table_name='" + table + "' " +
               "ORDER BY 1";
  return query;
}

export function getValues(schema, table, column, limit) {
  var query = "SELECT DISTINCT " + column + " " +
               "FROM \"" + schema + "\".\"" + table + "\"";
  if (limit) {
    query += " LIMIT " + limit;
  }
  return query;
}

export function addTimeRange(query, timeFrom, timeTo) {
  return query + " WHERE time > " + timeFrom + " AND time < " + timeTo;
}

function renderWhereClauses(whereClauses) {
  var renderedClauses = _.map(whereClauses, (clauseObj, index) => {
    var rendered = "";
    if (index !== 0) {
      rendered += ' ' + clauseObj.condition;
    }
    var right = _.isNumber(clauseObj.right) ? Number(clauseObj.right) : "'" + clauseObj.right + "'";
    rendered += ' ' + clauseObj.left + ' ' + clauseObj.operator + ' ' + right;
    return rendered;
  });
  return renderedClauses.join(' ');
}

export function buildQuery(target, addTimeRange) {
  var query = "SELECT ";
  query = query + target.selectColumns.join();
  query = query + " FROM \"" + target.schema + "\".\"" + target.table + "\"";

  // WHERE
  if (target.whereClauses && target.whereClauses.length) {
    query += " WHERE" + renderWhereClauses(target.whereClauses);
  }

  // Add time range
  if (addTimeRange) {
    if (!target.whereClauses || target.whereClauses.length === 0) {
      query += " WHERE ";
    } else {
      query += " AND ";
    }
    var timeColumn = target.orderBy;
    query += timeColumn + " >= ? AND " + timeColumn + " <= ?";
  }

  // ORDER BY
  query = query + " ORDER BY " + target.orderBy + " " + target.orderType;
  return query;
}
