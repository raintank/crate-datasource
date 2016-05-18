'use strict';

System.register(['lodash'], function (_export, _context) {
  var _;

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      function handle_response(target, response) {
        var valueColumnIndex;
        var timeColumnIndex = _.findIndex(target.selectColumns, function (col) {
          return col === target.orderBy;
        });

        if (timeColumnIndex === 0) {
          valueColumnIndex = 1;
        } else {
          valueColumnIndex = 0;
        }

        if (target.groupBy) {
          var groupByColumnIndex = _.indexOf(response.data.cols, target.groupBy);
          var groupedResponse = _.groupBy(response.data.rows, function (row) {
            return row[groupByColumnIndex];
          });
          var datasets = _.map(groupedResponse, function (rows, key) {
            var datapoints = _.map(rows, function (row) {
              return [Number(row[valueColumnIndex]), // value
              Number(row[timeColumnIndex]) // timestamp
              ];
            });
            return {
              target: key,
              datapoints: datapoints
            };
          });
          return datasets;
        } else {
          var datapoints = _.map(response.data.rows, function (row) {
            return [Number(row[valueColumnIndex]), // value
            Number(row[timeColumnIndex]) // timestamp
            ];
          });

          return {
            target: target.table,
            datapoints: datapoints
          };
        }
      }

      _export('handle_response', handle_response);
    }
  };
});
//# sourceMappingURL=response_handler.js.map
