///<reference path="../headers/common.d.ts" />
System.register([], function(exports_1) {
    var _metricAggTypes, QueryDef;
    return {
        setters:[],
        execute: function() {
            _metricAggTypes = [
                { text: "Raw", value: "raw", allValue: false },
                { text: "Count", value: 'count', allValue: true, anyDataType: true },
                { text: "Distinct Count", value: 'count_distinct', allValue: false, anyDataType: true },
                { text: "Avg / Mean", value: 'avg', allValue: false },
                { text: "Min", value: 'min', allValue: false },
                { text: "Max", value: 'max', allValue: false },
                { text: "Sum", value: 'sum', allValue: false },
                { text: "Geometric Mean", value: 'geometric_mean', allValue: false },
                { text: "Variance", value: 'variance', allValue: false },
                { text: "Std Deviation", value: 'stddev', allValue: false },
                { text: "Arbitrary", value: "arbitrary", allValue: false }
            ];
            QueryDef = (function () {
                function QueryDef() {
                }
                QueryDef.getMetricAggTypes = function () {
                    return _metricAggTypes;
                };
                return QueryDef;
            })();
            exports_1("default", QueryDef);
        }
    }
});
//# sourceMappingURL=query_def.js.map