/// <reference path="../headers/common.d.ts" />
import { CrateQueryBuilder } from './query_builder';
export declare class CrateDatasource {
    private $q;
    private backendSrv;
    private templateSrv;
    private timeSrv;
    type: string;
    url: string;
    name: string;
    basicAuth: string;
    withCredentials: boolean;
    schema: string;
    table: string;
    defaultTimeColumn: string;
    defaultGroupInterval: string;
    checkQuerySource: boolean;
    queryBuilder: CrateQueryBuilder;
    CRATE_ROWS_LIMIT: number;
    constructor(instanceSettings: any, $q: any, backendSrv: any, templateSrv: any, timeSrv: any);
    query(options: any): any;
    /**
     * Required.
     * Checks datasource and returns Crate cluster name and version or
     * error details.
     */
    testDatasource(): any;
    metricFindQuery(query: string): any;
    getTimeFilter(timeFrom: any, timeTo: any): string;
    getTagKeys(options: any): any;
    getTagValues(options: any): any;
    setScopedVars(scopedVars: any): any;
    /**
     * Sends SQL query to Crate and returns result.
     * @param {string} query SQL query string
     * @param {any[]}  args  Optional query arguments
     * @return
     */
    _sql_query(query: string, args?: any[]): any;
    checkSQLSource(query: any): void;
    _request(method: string, url: string, data?: any): any;
    _get(url?: string): any;
    _post(url: string, data?: any): any;
}
export declare function convertToCrateInterval(grafanaInterval: any): any;
