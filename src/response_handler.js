import _ from 'lodash';

export function handle_response(target, response) {
  var datapoints = _.map(response.data.rows, row => {
    return [
      Number(row[0]),
      Number(row[1])
    ];
  });

  return {
    target: target.table,
    datapoints: datapoints
  };
}