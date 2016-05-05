export function getTables() {
  var query = "SELECT table_name FROM information_schema.tables";
  return query;
}

export function getColumns(table) {
  var query = "SELECT column_name FROM information_schema.columns WHERE table_name='" +
    table + "'";
  return query;
}

export function buildQuery(target) {
  console.log(target.selectColumns);
  var query = "SELECT ";
  query = query + target.selectColumns.join();
  query = query + " FROM " + target.table;
  query = query + " ORDER BY " + target.orderBy + " " + target.orderType;
  return query;
}