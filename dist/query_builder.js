"use strict";

System.register(["lodash"], function (_export, _context) {
  var _;

  function renderWhereClauses(whereClauses) {
    var renderedClauses = _.map(whereClauses, function (clauseObj, index) {
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

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      function getSchemas() {
        var query = "SELECT DISTINCT schema_name " + "FROM information_schema.tables " + "WHERE schema_name NOT IN ('information_schema', 'blob', 'sys') " + "ORDER BY 1";
        return query;
      }

      _export("getSchemas", getSchemas);

      function getTables(schema) {
        var query = "SELECT table_name " + "FROM information_schema.tables " + "WHERE schema_name='" + schema + "' " + "ORDER BY 1";
        return query;
      }

      _export("getTables", getTables);

      function getColumns(schema, table) {
        var query = "SELECT column_name " + "FROM information_schema.columns " + "WHERE schema_name='" + schema + "' " + "AND table_name='" + table + "' " + "ORDER BY 1";
        return query;
      }

      _export("getColumns", getColumns);

      function getValues(schema, table, column, limit) {
        var query = "SELECT DISTINCT " + column + " " + "FROM \"" + schema + "\".\"" + table + "\"";
        if (limit) {
          query += " LIMIT " + limit;
        }
        return query;
      }

      _export("getValues", getValues);

      function addTimeRange(query, timeFrom, timeTo) {
        return query + " WHERE time > " + timeFrom + " AND time < " + timeTo;
      }
      _export("addTimeRange", addTimeRange);

      function buildQuery(target, timeFrom, timeTo) {
        var query = "SELECT ";
        query = query + target.selectColumns.join();
        query = query + " FROM \"" + target.schema + "\".\"" + target.table + "\"";

        // WHERE
        if (target.whereClauses && target.whereClauses.length) {
          query += " WHERE" + renderWhereClauses(target.whereClauses);
        }

        // Add time range
        if (timeFrom || timeTo) {
          if (!target.whereClauses || target.whereClauses.length === 0) {
            query += " WHERE ";
          } else {
            query += " AND ";
          }
          var timeColumn = target.orderBy;
          query += timeColumn + " > " + timeFrom + " AND " + timeColumn + " < " + timeTo;
        }

        // ORDER BY
        query = query + " ORDER BY " + target.orderBy + " " + target.orderType;
        return query;
      }

      _export("buildQuery", buildQuery);
    }
  };
});
//# sourceMappingURL=query_builder.js.map
