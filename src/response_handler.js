import _ from 'lodash';

export function handle_response(target, response) {
  var valueColumnIndex;
  var timeColumnIndex = _.findIndex(target.selectColumns, col => {
    return col === target.orderBy;
  });

  if (timeColumnIndex === 0) {
    valueColumnIndex = 1;
  } else {
    valueColumnIndex = 0;
  }

  var datapoints = _.map(response.data.rows, row => {
    return [
      Number(row[valueColumnIndex]), // value
      Number(row[timeColumnIndex])  // timestamp
    ];
  });

  return {
    target: target.table,
    datapoints: datapoints
  };
}