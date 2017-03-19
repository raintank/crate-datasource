///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

export default function handleResponse(target, result) {
  if (target.resultFormat === 'table') {
    return handleTableResponse(target, result);
  }

  if (target.rawQuery) {
    return handleRawResponse(target, result);
  } else {
    return handleBuildedResponse(target, result);
  }
}

function handleTableResponse(target, result) {
  return {
    columns: _.map(result.cols, col => {
      return {text: col};
    }),
    rows: result.rows,
    type: 'table'
  };
}

function handleRawResponse(target, result) {
  let columns = result.cols;
  let timeColumnIndex = 0;
  let valueColumnIndex = 1;

  if (columns.length > 2) {
    let groupedResponse = _.groupBy(result.rows, row => {
      // Assume row structure is
      // [ts, value, ...group by columns]
      return row.slice(2).join(' ');
    });

    return _.map(groupedResponse, (rows, key) => {
      return {
        target: key + ': ' + columns[valueColumnIndex],
        datapoints: convertToGrafanaPoints(rows, timeColumnIndex, valueColumnIndex)
      };
    });
  } else {
    return [{
      target: columns[valueColumnIndex],
      datapoints: convertToGrafanaPoints(result.rows, timeColumnIndex, valueColumnIndex)
    }];
  }
}

function handleBuildedResponse(target, result) {
  let columns = result.cols;
  let timeColumnIndex = 0;
  let groupByColumnIndexes: number[], selectColumnIndexes: number[];

  if (target.groupByColumns.length) {
    groupByColumnIndexes = _.map(target.groupByColumns, groupByCol => {
      return _.indexOf(columns, groupByCol);
    });
  }

  let enabledAggs = _.filter(target.metricAggs, (agg) => {
    return !agg.hide;
  });

  if (enabledAggs.length) {
    selectColumnIndexes = _.map(enabledAggs, (metricAgg, index) => {
      return index + 1;
    });
  } else {
    return [];
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
        let datapoints = convertToGrafanaPoints(rows, timeColumnIndex, valueIndex);

        // Build alias for Group By column values
        let group_by_alias: string;
        if (rows.length) {
          group_by_alias = _.map(groupByColumnIndexes, (columnIndex, i) => {
            let first_row = rows[0];
            if (target.groupByAliases && target.groupByAliases[i]) {
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
    return _.map(selectColumnIndexes, (valueIndex) => {
      let datapoints = convertToGrafanaPoints(result.rows, timeColumnIndex, valueIndex);

      return {
        target: columns[valueIndex],
        datapoints: datapoints
      };
    });
  }
}

function convertToGrafanaPoints(rows, timeColumnIndex, valueColumnIndex) {
  return _.map(rows, row => {
    let ts = Number(row[timeColumnIndex]);
    let val = row[valueColumnIndex];
    val = val !== null ? Number(val) : null;

    return [val, ts];
  });
}

function makeColName(aggType, column) {
  if (aggType === 'count_distinct') {
    return 'count(DISTINCT ' + column + ')';
  } else {
    return aggType + '(' + column + ')';
  }
}
