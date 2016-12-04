///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

export default function handleResponse(target, result) {
  if (target.rawQuery) {
    return handleRawResponse(target, result);
  } else {
    return handleBuildedResponse(target, result);
  }
}

function handleRawResponse(target, result) {
  let columns = result.cols;
  let timeColumnIndex = 0;
  let valueColumnIndex = 1;

  let datapoints = _.map(result.rows, row => {
    return [
      Number(row[valueColumnIndex]), // value
      Number(row[timeColumnIndex])  // timestamp
    ];
  });

  return [{
    target: columns[valueColumnIndex],
    datapoints: datapoints
  }];
}

function handleBuildedResponse(target, result) {
  let columns = result.cols;
  let timeColumnIndex = 0;
  let valueColumnIndex = 1;
  let groupByColumnIndexes, selectColumnIndexes;

  if (target.groupByColumns.length) {
    groupByColumnIndexes = _.map(target.groupByColumns, groupByCol => {
      return _.indexOf(columns, groupByCol);
    });
  }

  if (target.metricAggs.length) {
    selectColumnIndexes = _.map(target.metricAggs, metricAgg => {
      if (metricAgg.alias) {
        return _.indexOf(columns, metricAgg.alias);
      } else {
        return _.indexOf(columns, makeColName(metricAgg.type, metricAgg.column));
      }
    });
  }

  if (groupByColumnIndexes && groupByColumnIndexes.length && !_.some(groupByColumnIndexes, -1)) {
    let groupedResponse = _.groupBy(result.rows, row => {
      // Construct groupBy key from Group By columns, for example:
      // [metric, host] => 'metric host'
      return _.map(groupByColumnIndexes, (columnIndex, i) => {
        if (target.groupByAliases[i]) {
          let pattern = new RegExp(target.groupByAliases[i]);
          let match = pattern.exec(row[columnIndex]);
          if (match && match.length > 1) {
            return match[1];
          } else if (match){
            return match[0];
          } else {
            return row[columnIndex];
          }
        } else {
          return row[columnIndex];
        }
      }).join(' ');
    });

    return _.flatten(_.map(groupedResponse, (rows, key) => {
      return _.map(selectColumnIndexes, (valueIndex) => {
        let datapoints = _.map(rows, row => {
          return [
            Number(row[valueIndex]), // value
            Number(row[timeColumnIndex])  // timestamp
          ];
        });
        return {
          target: key + ': ' + columns[valueIndex],
          datapoints: datapoints
        };
      });
    }));
  } else {
    let datapoints = _.map(result.rows, row => {
      return [
        Number(row[valueColumnIndex]), // value
        Number(row[timeColumnIndex])  // timestamp
      ];
    });

    return [{
      target: columns[valueColumnIndex],
      datapoints: datapoints
    }];
  }
}

function makeColName(type, column) {
  return type + '(' + column + ')';
}
