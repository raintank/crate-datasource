///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

export default function handleResponse(target, result) {
  let columns = result.cols;
  let timeColumnIndex = 0;
  let valueColumnIndex = 1;

  let groupByColumnIndexes;
  if (target.groupByColumns.length) {
    groupByColumnIndexes = _.map(target.groupByColumns, groupByCol => {
      return _.indexOf(columns, groupByCol);
    });
  }

  if (groupByColumnIndexes && groupByColumnIndexes.length && !_.some(groupByColumnIndexes, -1)) {
    let groupedResponse = _.groupBy(result.rows, row => {
      // Construct groupBy key from Group By columns, for example:
      // [metric, host] => 'metric host'
      return _.map(groupByColumnIndexes, columnIndex => {
        return row[columnIndex];
      }).join(' ');
    });

    return _.map(groupedResponse, (rows, key) => {
      let datapoints = _.map(rows, row => {
        return [
          Number(row[valueColumnIndex]), // value
          Number(row[timeColumnIndex])  // timestamp
        ];
      });
      return {
        target: key,
        datapoints: datapoints
      };
    });
  } else {
    let datapoints = _.map(result.rows, row => {
      return [
        Number(row[valueColumnIndex]), // value
        Number(row[timeColumnIndex])  // timestamp
      ];
    });

    return [{
      target: target.table,
      datapoints: datapoints
    }];
  }
}
