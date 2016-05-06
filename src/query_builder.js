export function getTables() {
  var query = "SELECT table_name FROM information_schema.tables";
  return query;
}

export function getColumns(table) {
  var query = "SELECT column_name FROM information_schema.columns WHERE table_name='" +
    table + "'";
  return query;
}

export function addTimeRange(query, timeFrom, timeTo) {
  return query + " WHERE time > " + timeFrom + " AND time < " + timeTo;
}

export function buildQuery(target, timeFrom, timeTo) {
  console.log(target.selectColumns);
  var query = "SELECT ";
  query = query + target.selectColumns.join();
  query = query + " FROM " + target.table;

  // Add time range
  if (timeFrom || timeTo) {
    var timeColumn = target.orderBy;
    query = query + " WHERE " + timeColumn + " > " + timeFrom +
      " AND " + timeColumn + " < " + timeTo;
  }

  query = query + " ORDER BY " + target.orderBy + " " + target.orderType;
  return query;
}