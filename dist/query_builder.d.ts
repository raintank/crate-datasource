/// <reference path="../headers/common.d.ts" />
export declare class CrateQueryBuilder {
    private templateSrv;
    schema: string;
    table: string;
    defaultTimeColumn: string;
    defaultGroupInterval: string;
    constructor(schema: string, table: string, defaultTimeColumn: string, defaultGroupInterval: string, templateSrv: any);
    /**
     * Builds Crate SQL query from given target object.
     * @param  {any}     target         Target object.
     * @param  {string}  groupInterval  Crate interval for date_trunc() function.
     * @return {string}                 SQL query.
     */
    buildOld(target: any, groupInterval?: any): string;
    build(target: any, groupInterval?: number): string;
    buildCountPointsQuery(target: any): string;
    renderAdhocFilters(filters: any): any;
    /**
     * Builds SQL query for getting available columns from table.
     * @return  {string}  SQL query.
     */
    getColumnsQuery(): string;
    getNumericColumnsQuery(): string;
    /**
     * Builds SQL query for getting unique values for given column.
     * @param  {string}  column  Column name
     * @param  {number}  limit   Optional. Limit number returned values.
     */
    getValuesQuery(column: string, limit?: number): string;
    private renderMetricAggs(metricAggs, withAlias?);
    private renderWhereClauses(whereClauses);
    private containsVariable(str);
}
export declare function getSchemas(): string;
export declare function getTables(schema: any): string;
export declare function getEnabledAggs(metricAggs: any): any;
export declare function getRawAggs(metricAggs: any): any;
