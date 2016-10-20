/// <reference path="../headers/common.d.ts" />
export default class QueryDef {
    static getMetricAggTypes(): ({
        text: string;
        value: string;
        allValue: boolean;
    } | {
        text: string;
        value: string;
        allValue: boolean;
        anyDataType: boolean;
    })[];
}
