///<reference path="../headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    function handleResponse(target, result) {
        if (target.rawQuery) {
            return handleRawResponse(target, result);
        }
        else {
            return handleBuildedResponse(target, result);
        }
    }
    exports_1("default", handleResponse);
    function handleRawResponse(target, result) {
        var columns = result.cols;
        var timeColumnIndex = 0;
        var valueColumnIndex = 1;
        var datapoints = lodash_1["default"].map(result.rows, function (row) {
            return [
                Number(row[valueColumnIndex]),
                Number(row[timeColumnIndex]) // timestamp
            ];
        });
        return [{
                target: columns[valueColumnIndex],
                datapoints: datapoints
            }];
    }
    function handleBuildedResponse(target, result) {
        var columns = result.cols;
        var timeColumnIndex = 0;
        var valueColumnIndex = 1;
        var groupByColumnIndexes, selectColumnIndexes;
        if (target.groupByColumns.length) {
            groupByColumnIndexes = lodash_1["default"].map(target.groupByColumns, function (groupByCol) {
                return lodash_1["default"].indexOf(columns, groupByCol);
            });
        }
        if (target.metricAggs.length) {
            selectColumnIndexes = lodash_1["default"].map(target.metricAggs, function (metricAgg) {
                return lodash_1["default"].indexOf(columns, makeColName(metricAgg.type, metricAgg.column));
            });
        }
        if (groupByColumnIndexes && groupByColumnIndexes.length && !lodash_1["default"].some(groupByColumnIndexes, -1)) {
            var groupedResponse = lodash_1["default"].groupBy(result.rows, function (row) {
                // Construct groupBy key from Group By columns, for example:
                // [metric, host] => 'metric host'
                return lodash_1["default"].map(groupByColumnIndexes, function (columnIndex) {
                    return row[columnIndex];
                }).join(' ');
            });
            return lodash_1["default"].flatten(lodash_1["default"].map(groupedResponse, function (rows, key) {
                return lodash_1["default"].map(selectColumnIndexes, function (valueIndex) {
                    var datapoints = lodash_1["default"].map(rows, function (row) {
                        return [
                            Number(row[valueIndex]),
                            Number(row[timeColumnIndex]) // timestamp
                        ];
                    });
                    return {
                        target: key + ': ' + columns[valueIndex],
                        datapoints: datapoints
                    };
                });
            }));
        }
        else {
            var datapoints = lodash_1["default"].map(result.rows, function (row) {
                return [
                    Number(row[valueColumnIndex]),
                    Number(row[timeColumnIndex]) // timestamp
                ];
            });
            return [{
                    target: target.table,
                    datapoints: datapoints
                }];
        }
    }
    function makeColName(type, column) {
        return type + '(' + column + ')';
    }
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
        }
    }
});
//# sourceMappingURL=response_handler.js.map