export function getTables() {
  var query = "SELECT table_name FROM information_schema.tables";
  return query;
}

export function getColumns(table) {
  var query = "SELECT column_name FROM information_schema.columns WHERE table_name='" +
    table + "'";
  return query;
}