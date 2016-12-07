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

  let enabledAggs = _.filter(target.metricAggs, (agg) => {
    return !agg.hide;
  });
  if (enabledAggs.length) {
    selectColumnIndexes = _.map(enabledAggs, metricAgg => {
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
      return _.map(groupByColumnIndexes, columnIndex => {
        return row[columnIndex];
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

        // Build alias for Group By column values
        let group_by_alias: string;
        if (rows.length) {
          group_by_alias = _.map(groupByColumnIndexes, (columnIndex, i) => {
            let first_row = rows[0];
            if (target.groupByAliases[i]) {
              let pattern = new RegExp(target.groupByAliases[i]);
              let match = pattern.exec(first_row[columnIndex]);
              if (match && match.length > 1) {
                return match[1];
              } else if (match){
                return match[0];
              } else {
                return first_row[columnIndex];
              }
            } else {
              return first_row[columnIndex];
            }
          }).join(' ');
        } else {
          group_by_alias = key;
        }

        return {
          target: group_by_alias + ': ' + columns[valueIndex],
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

function makeColName(aggType, column) {
  if (aggType === 'count_distinct') {
    return 'count(DISTINCT ' + column + ')';
  } else {
    return aggType + '(' + column + ')';
  }
}
