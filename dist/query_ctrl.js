///<reference path="../headers/common.d.ts" />
System.register(['angular', 'lodash', './sdk/sdk', './query_builder', './query_def'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var angular_1, lodash_1, sdk_1, query_builder_1, query_def_1;
    var CrateDatasourceQueryCtrl;
    return {
        setters:[
            function (angular_1_1) {
                angular_1 = angular_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (query_builder_1_1) {
                query_builder_1 = query_builder_1_1;
            },
            function (query_def_1_1) {
                query_def_1 = query_def_1_1;
            }],
        execute: function() {
            CrateDatasourceQueryCtrl = (function (_super) {
                __extends(CrateDatasourceQueryCtrl, _super);
                function CrateDatasourceQueryCtrl($scope, $injector, $q, uiSegmentSrv, templateSrv) {
                    _super.call(this, $scope, $injector);
                    this.$q = $q;
                    this.uiSegmentSrv = uiSegmentSrv;
                    this.templateSrv = templateSrv;
                    this.uiSegmentSrv = uiSegmentSrv;
                    this.templateSrv = templateSrv;
                    var ds = this.datasource;
                    this.crateQueryBuilder = new query_builder_1.CrateQueryBuilder(ds.schema, ds.table, ds.defaultTimeColumn, ds.defaultGroupInterval, templateSrv);
                    this.operators = ['<', '>', '<=', '>=', '=', '<>', '!=', 'in', 'like', '~', '!~'];
                    this.timeIntervals = [
                        { name: 'Auto', value: 'auto' },
                        { name: 'Auto (Grafana)', value: 'auto_gf' },
                        { name: 'Second', value: 'second' },
                        { name: 'Minute', value: 'minute' },
                        { name: 'Hour', value: 'hour' },
                        { name: 'Day', value: 'day' },
                        { name: 'Week', value: 'week' },
                        { name: 'Month', value: 'month' },
                        { name: 'Quarter', value: 'quarter' },
                        { name: 'Year', value: 'year' }
                    ];
                    this.resultFormats = [
                        { text: 'Time series', value: 'time_series' },
                        { text: 'Table', value: 'table' },
                    ];
                    var target_defaults = {
                        metricAggs: [
                            { type: 'avg', column: 'value' }
                        ],
                        groupByColumns: [],
                        groupByAliases: [],
                        whereClauses: [],
                        timeInterval: ds.defaultGroupInterval,
                        resultFormat: 'time_series'
                    };
                    lodash_1["default"].defaults(this.target, target_defaults);
                    this.updateGroupByAliases();
                    this.groupBySegments = lodash_1["default"].map(this.target.groupByColumns, this.uiSegmentSrv.newSegment);
                    // Build WHERE segments
                    this.whereSegments = [];
                    this.buildWhereSegments(this.target.whereClauses);
                    this.removeWhereSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove --' });
                    this.fixSegments(this.groupBySegments);
                }
                CrateDatasourceQueryCtrl.prototype.crateQuery = function (query, args) {
                    if (args === void 0) { args = []; }
                    return this.datasource._sql_query(query, args).then(function (response) {
                        return response.rows;
                    });
                };
                CrateDatasourceQueryCtrl.prototype.getCollapsedText = function () {
                    if (this.target.rawQuery) {
                        return this.target.query;
                    }
                    else {
                        return this.crateQueryBuilder.build(this.target);
                    }
                };
                ////////////////////
                // Event handlers //
                ////////////////////
                CrateDatasourceQueryCtrl.prototype.onChangeInternal = function () {
                    this.panelCtrl.refresh(); // Asks the panel to refresh data.
                };
                CrateDatasourceQueryCtrl.prototype.groupBySegmentChanged = function (segment, index) {
                    var _this = this;
                    if (segment.type === 'plus-button') {
                        segment.type = undefined;
                    }
                    this.target.groupByColumns = lodash_1["default"].map(lodash_1["default"].filter(this.groupBySegments, function (segment) {
                        return (segment.type !== 'plus-button' &&
                            segment.value !== _this.removeWhereSegment.value);
                    }), 'value');
                    this.groupBySegments = lodash_1["default"].map(this.target.groupByColumns, this.uiSegmentSrv.newSegment);
                    this.groupBySegments.push(this.uiSegmentSrv.newPlusButton());
                    if (segment.value === this.removeWhereSegment.value) {
                        this.target.groupByAliases.splice(index, 1);
                    }
                    this.updateGroupByAliases();
                    this.onChangeInternal();
                };
                CrateDatasourceQueryCtrl.prototype.onGroupByAliasChange = function (index) {
                    this.updateGroupByAliases();
                    this.onChangeInternal();
                };
                CrateDatasourceQueryCtrl.prototype.onAggTypeChange = function () {
                    this.onChangeInternal();
                };
                CrateDatasourceQueryCtrl.prototype.addMetricAgg = function () {
                    this.target.metricAggs.push({ type: 'avg', column: 'value' });
                    this.onChangeInternal();
                };
                CrateDatasourceQueryCtrl.prototype.removeMetricAgg = function (index) {
                    this.target.metricAggs.splice(index, 1);
                    this.onChangeInternal();
                };
                CrateDatasourceQueryCtrl.prototype.toggleShowMetric = function (agg) {
                    agg.hide = !agg.hide;
                    this.onChangeInternal();
                };
                CrateDatasourceQueryCtrl.prototype.toggleEditorMode = function () {
                    this.target.rawQuery = !this.target.rawQuery;
                };
                ///////////////////////
                // Query suggestions //
                ///////////////////////
                CrateDatasourceQueryCtrl.prototype.getColumns = function (allValue, onlyNumeric) {
                    var query;
                    if (onlyNumeric) {
                        query = this.crateQueryBuilder.getNumericColumnsQuery();
                    }
                    else {
                        query = this.crateQueryBuilder.getColumnsQuery();
                    }
                    var self = this;
                    return this.crateQuery(query).then(function (rows) {
                        if (allValue) {
                            rows.splice(0, 0, '*');
                        }
                        return self.transformToSegments(lodash_1["default"].flatten(rows), true);
                    });
                };
                CrateDatasourceQueryCtrl.prototype.getGroupByColumns = function () {
                    var _this = this;
                    return this.getColumns().then(function (columns) {
                        columns.splice(0, 0, angular_1["default"].copy(_this.removeWhereSegment));
                        return columns;
                    });
                };
                CrateDatasourceQueryCtrl.prototype.getValues = function (column, limit) {
                    if (limit === void 0) { limit = 10; }
                    var self = this;
                    var time_range = this.panelCtrl.range;
                    return this.crateQuery(this.crateQueryBuilder.getValuesQuery(column, limit, time_range))
                        .then(function (rows) {
                        return self.transformToSegments(lodash_1["default"].flatten(rows), true);
                    });
                };
                CrateDatasourceQueryCtrl.prototype.getColumnsOrValues = function (segment, index) {
                    var _this = this;
                    var self = this;
                    if (segment.type === 'condition') {
                        return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
                    }
                    if (segment.type === 'operator') {
                        return this.$q.when(this.uiSegmentSrv.newOperators(this.operators));
                    }
                    if (segment.type === 'key' || segment.type === 'plus-button') {
                        return this.getColumns().then(function (columns) {
                            columns.splice(0, 0, angular_1["default"].copy(_this.removeWhereSegment));
                            return columns;
                        });
                    }
                    else if (segment.type === 'value') {
                        return this.getValues(this.whereSegments[index - 2].value);
                    }
                };
                CrateDatasourceQueryCtrl.prototype.getMetricAggTypes = function () {
                    return query_def_1["default"].getMetricAggTypes();
                };
                CrateDatasourceQueryCtrl.prototype.getMetricAggDef = function (aggType) {
                    return lodash_1["default"].find(this.getMetricAggTypes(), { value: aggType });
                };
                CrateDatasourceQueryCtrl.prototype.whereSegmentUpdated = function (segment, index) {
                    this.whereSegments[index] = segment;
                    if (segment.value === this.removeWhereSegment.value) {
                        this.whereSegments.splice(index, 3);
                        if (this.whereSegments.length === 0) {
                            this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
                        }
                        else if (this.whereSegments.length > 2) {
                            this.whereSegments.splice(Math.max(index - 1, 0), 1);
                            if (this.whereSegments[this.whereSegments.length - 1].type !== 'plus-button') {
                                this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
                            }
                        }
                    }
                    else {
                        if (segment.type === 'plus-button') {
                            if (index > 2) {
                                this.whereSegments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
                            }
                            this.whereSegments.push(this.uiSegmentSrv.newOperator('='));
                            this.whereSegments.push(this.uiSegmentSrv.newFake('select tag value', 'value', 'query-segment-value'));
                            segment.type = 'key';
                            segment.cssClass = 'query-segment-key';
                        }
                        if ((index + 1) === this.whereSegments.length) {
                            this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
                        }
                    }
                    this.buildWhereClauses();
                    // Refresh only if all fields setted
                    if (lodash_1["default"].every(this.whereSegments, function (segment) {
                        return ((segment.value || segment.type === 'plus-button') &&
                            !(segment.fake && segment.type !== 'plus-button'));
                    })) {
                        this.panelCtrl.refresh();
                    }
                };
                ///////////////////////
                CrateDatasourceQueryCtrl.prototype.buildWhereSegments = function (whereClauses) {
                    var self = this;
                    lodash_1["default"].forEach(whereClauses, function (whereClause) {
                        if (whereClause.condition) {
                            self.whereSegments.push(self.uiSegmentSrv.newCondition(whereClause.condition));
                        }
                        self.whereSegments.push(self.uiSegmentSrv.newKey(whereClause.column));
                        self.whereSegments.push(self.uiSegmentSrv.newOperator(whereClause.operator));
                        self.whereSegments.push(self.uiSegmentSrv.newKeyValue(whereClause.value));
                    });
                    this.fixSegments(this.whereSegments);
                };
                CrateDatasourceQueryCtrl.prototype.buildWhereClauses = function () {
                    var i = 0;
                    var whereIndex = 0;
                    var segments = this.whereSegments;
                    var whereClauses = [];
                    while (segments.length > i && segments[i].type !== 'plus-button') {
                        if (whereClauses.length < whereIndex + 1) {
                            whereClauses.push({ condition: '', column: '', operator: '', value: '' });
                        }
                        if (segments[i].type === 'condition') {
                            whereClauses[whereIndex].condition = segments[i].value;
                        }
                        else if (segments[i].type === 'key') {
                            whereClauses[whereIndex].column = segments[i].value;
                        }
                        else if (segments[i].type === 'operator') {
                            whereClauses[whereIndex].operator = segments[i].value;
                        }
                        else if (segments[i].type === 'value') {
                            whereClauses[whereIndex].value = segments[i].value;
                            whereIndex++;
                        }
                        i++;
                    }
                    this.target.whereClauses = whereClauses;
                };
                CrateDatasourceQueryCtrl.prototype.fixSegments = function (segments) {
                    var count = segments.length;
                    var lastSegment = segments[Math.max(count - 1, 0)];
                    if (!lastSegment || lastSegment.type !== 'plus-button') {
                        segments.push(this.uiSegmentSrv.newPlusButton());
                    }
                };
                CrateDatasourceQueryCtrl.prototype.transformToSegments = function (results, addTemplateVars) {
                    var _this = this;
                    var segments = lodash_1["default"].map(lodash_1["default"].flatten(results), function (value) {
                        return _this.uiSegmentSrv.newSegment({
                            value: value.toString(),
                            expandable: false
                        });
                    });
                    if (addTemplateVars) {
                        for (var _i = 0, _a = this.templateSrv.variables; _i < _a.length; _i++) {
                            var variable = _a[_i];
                            segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '$' + variable.name, expandable: true }));
                        }
                    }
                    return segments;
                };
                CrateDatasourceQueryCtrl.prototype.updateGroupByAliases = function () {
                    var _this = this;
                    var groupByAliases = new Array(this.target.groupByColumns.length);
                    this.target.groupByColumns.forEach(function (column, index) {
                        if (_this.target.groupByAliases[index]) {
                            groupByAliases[index] = _this.target.groupByAliases[index];
                        }
                        else {
                            groupByAliases[index] = "";
                        }
                    });
                    this.target.groupByAliases = groupByAliases;
                };
                CrateDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
                return CrateDatasourceQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("CrateDatasourceQueryCtrl", CrateDatasourceQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map