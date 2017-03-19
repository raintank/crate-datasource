/// <reference path="../headers/common.d.ts" />
import { QueryCtrl } from './sdk/sdk';
import { CrateQueryBuilder } from './query_builder';
export declare class CrateDatasourceQueryCtrl extends QueryCtrl {
    private $q;
    private uiSegmentSrv;
    private templateSrv;
    static templateUrl: string;
    crateQueryBuilder: CrateQueryBuilder;
    groupBySegments: any;
    whereSegments: any;
    removeWhereSegment: any;
    operators: any;
    timeIntervals: any[];
    resultFormats: any[];
    constructor($scope: any, $injector: any, $q: any, uiSegmentSrv: any, templateSrv: any);
    crateQuery(query: any, args?: any[]): any;
    getCollapsedText(): string;
    onChangeInternal(): void;
    groupBySegmentChanged(segment: any, index: any): void;
    onGroupByAliasChange(index: any): void;
    onAggTypeChange(): void;
    addMetricAgg(): void;
    removeMetricAgg(index: any): void;
    toggleShowMetric(agg: any): void;
    toggleEditorMode(): void;
    getColumns(allValue?: boolean, onlyNumeric?: boolean): any;
    getGroupByColumns(): any;
    getValues(column: any, limit?: number): any;
    getColumnsOrValues(segment: any, index: any): any;
    getMetricAggTypes(): ({
        text: string;
        value: string;
        allValue: boolean;
    } | {
        text: string;
        value: string;
        allValue: boolean;
        anyDataType: boolean;
    })[];
    getMetricAggDef(aggType: any): any;
    whereSegmentUpdated(segment: any, index: any): void;
    buildWhereSegments(whereClauses: any): void;
    buildWhereClauses(): void;
    fixSegments(segments: any): void;
    transformToSegments(results: any, addTemplateVars?: boolean): any;
    updateGroupByAliases(): void;
}
