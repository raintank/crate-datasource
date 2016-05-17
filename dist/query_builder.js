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
      function getTables() {
        var query = "SELECT table_name FROM information_schema.tables";
        return query;
      }

      _export("getTables", getTables);

      function getColumns(table) {
        var query = "SELECT column_name FROM information_schema.columns WHERE table_name='" + table + "'";
        return query;
      }

      _export("getColumns", getColumns);

      function getValues(table, column, limit) {
        var query = "SELECT " + column + " FROM " + table;
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
        query = query + " FROM " + target.table;

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
