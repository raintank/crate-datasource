///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

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
