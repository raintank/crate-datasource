///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

export class CrateQueryBuilder {
  schema: string;
  table: string;
  defaultTimeColumn: string;
  defaultGroupInterval: string;

  constructor(schema: string,
              table: string,
              defaultTimeColumn: string,
              defaultGroupInterval: string,
              private templateSrv) {
    this.schema = schema;
    this.table = table;
    this.defaultTimeColumn = defaultTimeColumn;
    this.defaultGroupInterval = defaultGroupInterval;
    this.templateSrv = templateSrv;
  }

  /**
   * Builds Crate SQL query from given target object.
   * @param  {any}     target         Target object.
   * @param  {number}  groupInterval  Interval for grouping values.
   * @param  {string}  defaultAgg     Default aggregation for values.
   * @return {string}                 SQL query.
   */
  build(target: any, groupInterval=0, defaultAgg='avg') {
    let query: string;
    let timeExp: string;

    let aggs = getEnabledAggs(target.metricAggs);
    let rawAggs = getRawAggs(aggs);

    if (!aggs.length) { return null; }

    if (groupInterval) {
      // Manually aggregate by time interval, ie "SELECT floor(ts/10)*10 as time ..."
      timeExp = `floor(${this.defaultTimeColumn}/${groupInterval})*${groupInterval}`;
      aggs = aggregateMetrics(aggs, 'avg');
    } else {
      timeExp = this.defaultTimeColumn;
    }

    // SELECT
    let renderedAggs = this.renderMetricAggs(aggs);
    query = "SELECT " + timeExp + " as time, " + renderedAggs;

    // Add GROUP BY columns to SELECT statement.
    if (target.groupByColumns && target.groupByColumns.length) {
      query += ", " + target.groupByColumns.join(', ');
    }
    query += " FROM \"" + this.schema + "\".\"" + this.table + "\" " +
             "WHERE $timeFilter";

    // WHERE
    if (target.whereClauses && target.whereClauses.length) {
      query += " AND " + this.renderWhereClauses(target.whereClauses);
    }

    // GROUP BY
    query += " GROUP BY time";
    if (!groupInterval && rawAggs.length) {
      query += ", " + this.renderMetricAggs(rawAggs, false);
    }

    if (target.groupByColumns && target.groupByColumns.length) {
      query += ", " + target.groupByColumns.join(', ');
    }

    // If GROUP BY specified, sort also by selected columns
    query += " ORDER BY time";
    if (target.groupByColumns && target.groupByColumns.length) {
      query += ", " + target.groupByColumns.join(', ');
    }
    query += " ASC";

    return query;
  }

  renderAdhocFilters(filters) {
    let conditions = _.map(filters, (tag, index) => {
      let str = "";
      let operator = tag.operator;
      let value = tag.value;
      if (index > 0) {
        str = (tag.condition || 'AND') + ' ';
      }

      if (operator === '=~') {
        operator = '~';
      }

      return str + '"' + tag.key + '" ' + operator + ' \'' + value.replace(/'/g, "''") + '\'';
    });
    return conditions.join(' ');
  }

  /**
   * Builds SQL query for getting available columns from table.
   * @return  {string}  SQL query.
   */
  getColumnsQuery() {
    let query = "SELECT column_name " +
                 "FROM information_schema.columns " +
                 "WHERE table_schema = '" + this.schema + "' " +
                   "AND table_name = '" + this.table + "' " +
                 "ORDER BY 1";
    return query;
  }

  getNumericColumnsQuery() {
    return "SELECT column_name " +
           "FROM information_schema.columns " +
           "WHERE table_schema = '" + this.schema + "' " +
             "AND table_name = '" + this.table + "' " +
             "AND data_type in ('integer', 'long', 'short', 'double', 'float', 'byte') " +
           "ORDER BY 1";
  }

  /**
   * Builds SQL query for getting unique values for given column.
   * @param  {string}  column  Column name
   * @param  {number}  limit   Optional. Limit number returned values.
   */
  getValuesQuery(column: string, limit?: number) {
    let query = `SELECT DISTINCT ${column} ` +
                `FROM "${this.schema}"."${this.table}" ` +
                `WHERE ${this.defaultTimeColumn} >= ? AND ${this.defaultTimeColumn} <= ?`;

    if (limit) {
      query += " LIMIT " + limit;
    }
    return query;
  }

  private renderMetricAggs(metricAggs: any, withAlias=true): string {
    let enabledAggs = _.filter(metricAggs, (agg) => {
      return !agg.hide;
    });

    let renderedAggs = _.map(enabledAggs, (agg) => {
      let alias = '';
      if (agg.alias && withAlias) {
        alias = ' AS \"' + agg.alias + '\"';
      }

      let column = quoteColumn(agg.column);
      if (agg.type === 'count_distinct') {
        return "count(distinct " + column + ")" + alias;
      } else if (agg.type === 'raw') {
        return column + alias;
      } else {
        return agg.type + "(" + column + ")" + alias;
      }
    });

    if (renderedAggs.length) {
      return renderedAggs.join(', ');
    } else {
      return "";
    }
  }

  private renderWhereClauses(whereClauses): string {
    let renderedClauses = _.map(whereClauses, (clauseObj, index) => {
      let rendered = "";
      if (index !== 0) {
        rendered += clauseObj.condition + " ";
      }

      // Quote arguments as required by the operator and value type
      let rendered_value: string;
      let value = clauseObj.value;
      if (clauseObj.operator.toLowerCase() === 'in') {
        // Handle IN operator. Split comma-separated values.
        // "42, 10, a" => 42, 10, 'a'
        rendered_value = '(' + _.map(value.split(','), v => {
          v = v.trim();
          if (!isNaN(v) || this.containsVariable(v)) {
            return v;
          } else {
            return "'" + v + "'";
          }
        }).join(', ') + ')';
      } else {
        rendered_value = _.map(value.split(','), v => {
          v = v.trim();
          if (!isNaN(v) || this.containsVariable(v)) {
            return v;
          } else {
            return "'" + v + "'";
          }
        }).join(', ');
      }
      rendered += clauseObj.column + ' ' + clauseObj.operator + ' ' + rendered_value;
      return rendered;
    });
    return renderedClauses.join(' ');
  }

  // Check for template variables
  private containsVariable(str: string): boolean {
    let variables = _.map(this.templateSrv.variables, 'name');
    return _.some(variables, variable => {
      let pattern = new RegExp('\\$' + variable);
      return pattern.test(str);
    });
  }
}

export function getSchemas() {
  var query = "SELECT schema_name " +
              "FROM information_schema.schemata " +
              "WHERE schema_name NOT IN ('information_schema', 'blob', 'sys', 'pg_catalog') " +
              "ORDER BY 1";
  return query;
}

export function getTables(schema) {
  var query = "SELECT table_name " +
               "FROM information_schema.tables " +
               "WHERE table_schema='" + schema + "' " +
               "ORDER BY 1";
  return query;
}

function quoteColumn(column: string): string {
  if (isWithUpperCase(column)) {
    return '\"' + column + '\"';
  } else {
    return column;
  }
}

function isWithUpperCase(str: string): boolean {
  return str.toLowerCase() !== str;
}

function aggregateMetrics(metricAggs: any, aggType: string) {
  let aggs = _.cloneDeep(metricAggs);
  return _.map(aggs, agg => {
    if (agg.type === 'raw') {
      agg.type = aggType;
      return agg;
    } else {
      return agg;
    }
  });
}

export function getEnabledAggs(metricAggs) {
  return _.filter(metricAggs, (agg) => {
    return !agg.hide;
  });
}

export function getRawAggs(metricAggs) {
  return _.filter(metricAggs, {type: 'raw'});
}
