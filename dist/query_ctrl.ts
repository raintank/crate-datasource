///<reference path="../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import {QueryCtrl} from './sdk/sdk';
import {CrateQueryBuilder} from './query_builder';
import queryDef from './query_def';

export class CrateDatasourceQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  crateQueryBuilder: CrateQueryBuilder;
  groupBySegments: any;
  whereSegments: any;
  removeWhereSegment: any;
  operators: any;
  timeIntervals: any[];
  resultFormats: any[];

  constructor($scope, $injector, private $q, private uiSegmentSrv, private templateSrv)  {
    super($scope, $injector);

    this.uiSegmentSrv = uiSegmentSrv;
    this.templateSrv = templateSrv;

    let ds = this.datasource;
    this.crateQueryBuilder = new CrateQueryBuilder(ds.schema,
                                                   ds.table,
                                                   ds.defaultTimeColumn,
                                                   ds.defaultGroupInterval,
                                                   templateSrv);

    this.operators = ['<', '>', '<=', '>=', '=', '<>', '!=', 'in', 'like', '~', '!~'];

    this.timeIntervals = [
      {name: 'Auto',    value: 'auto'},
      {name: 'Auto (Grafana)',    value: 'auto_gf'},
      {name: 'Second',  value: 'second'},
      {name: 'Minute',  value: 'minute'},
      {name: 'Hour',    value: 'hour'},
      {name: 'Day',     value: 'day'},
      {name: 'Week',    value: 'week'},
      {name: 'Month',   value: 'month'},
      {name: 'Quarter', value: 'quarter'},
      {name: 'Year',    value: 'year'}
    ];

    this.resultFormats = [
      {text: 'Time series', value: 'time_series'},
      {text: 'Table', value: 'table'},
    ];

    var target_defaults = {
      metricAggs: [
        {type: 'avg', column: 'value'}
      ],
      groupByColumns: [],
      groupByAliases: [],
      whereClauses: [],
      timeInterval: ds.defaultGroupInterval,
      resultFormat: 'time_series'
    };
    _.defaults(this.target, target_defaults);

    this.updateGroupByAliases();

    this.groupBySegments = _.map(this.target.groupByColumns, this.uiSegmentSrv.newSegment);

    // Build WHERE segments
    this.whereSegments = [];
    this.buildWhereSegments(this.target.whereClauses);

    this.removeWhereSegment = uiSegmentSrv.newSegment({fake: true, value: '-- remove --'});
    this.fixSegments(this.groupBySegments);
  }

  crateQuery(query, args = []) {
    return this.datasource._sql_query(query, args).then(response => {
      return response.rows;
    });
  }

  getCollapsedText(): string {
    if (this.target.rawQuery) {
      return this.target.query;
    } else {
      return this.crateQueryBuilder.build(this.target);
    }
  }

  ////////////////////
  // Event handlers //
  ////////////////////

  onChangeInternal(): void {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }

  groupBySegmentChanged(segment, index): void {
    if (segment.type === 'plus-button') {
      segment.type = undefined;
    }
    this.target.groupByColumns = _.map(_.filter(this.groupBySegments, segment => {
      return (segment.type !== 'plus-button' &&
              segment.value !== this.removeWhereSegment.value);
    }), 'value');
    this.groupBySegments = _.map(this.target.groupByColumns, this.uiSegmentSrv.newSegment);
    this.groupBySegments.push(this.uiSegmentSrv.newPlusButton());

    if (segment.value === this.removeWhereSegment.value) {
      this.target.groupByAliases.splice(index, 1);
    }
    this.updateGroupByAliases();

    this.onChangeInternal();
  }

  onGroupByAliasChange(index) {
    this.updateGroupByAliases();
    this.onChangeInternal();
  }

  onAggTypeChange(): void {
    this.onChangeInternal();
  }

  addMetricAgg(): void {
    this.target.metricAggs.push({ type: 'avg', column: 'value' });
    this.onChangeInternal();
  }

  removeMetricAgg(index): void {
    this.target.metricAggs.splice(index, 1);
    this.onChangeInternal();
  }

  toggleShowMetric(agg): void {
    agg.hide = !agg.hide;
    this.onChangeInternal();
  }

  toggleEditorMode(): void {
    this.target.rawQuery = !this.target.rawQuery;
  }

  ///////////////////////
  // Query suggestions //
  ///////////////////////

  getColumns(allValue?: boolean, onlyNumeric?: boolean) {
    let query;
    if (onlyNumeric) {
      query = this.crateQueryBuilder.getNumericColumnsQuery();
    } else {
      query = this.crateQueryBuilder.getColumnsQuery();
    }
    let self = this;
    return this.crateQuery(query).then(rows => {
      if (allValue) {
        rows.splice(0, 0, '*');
      }
      return self.transformToSegments(_.flatten(rows), true);
    });
  }

  getGroupByColumns() {
    return this.getColumns().then(columns => {
      columns.splice(0, 0, angular.copy(this.removeWhereSegment));
      return columns;
    });
  }

  getValues(column, limit = 10) {
    let self = this;
    let time_range = this.panelCtrl.range;
    return this.crateQuery(this.crateQueryBuilder.getValuesQuery(column, limit, time_range))
      .then(rows => {
        return self.transformToSegments(_.flatten(rows), true);
      });
  }

  getColumnsOrValues(segment, index) {
    var self = this;
    if (segment.type === 'condition') {
      return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
    }
    if (segment.type === 'operator') {
      return this.$q.when(this.uiSegmentSrv.newOperators(this.operators));
    }

    if (segment.type === 'key' || segment.type === 'plus-button') {
      return this.getColumns().then(columns => {
        columns.splice(0, 0, angular.copy(this.removeWhereSegment));
        return columns;
      });
    } else if (segment.type === 'value') {
      return this.getValues(this.whereSegments[index - 2].value);
    }
  }

  getMetricAggTypes() {
    return queryDef.getMetricAggTypes();
  }

  getMetricAggDef(aggType) {
    return _.find(this.getMetricAggTypes(), { value: aggType });
  }

  whereSegmentUpdated(segment, index) {
    this.whereSegments[index] = segment;

    if (segment.value === this.removeWhereSegment.value) {
      this.whereSegments.splice(index, 3);
      if (this.whereSegments.length === 0) {
        this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
      } else if (this.whereSegments.length > 2) {
        this.whereSegments.splice(Math.max(index - 1, 0), 1);
        if (this.whereSegments[this.whereSegments.length - 1].type !== 'plus-button') {
          this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
        }
      }
    } else {
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
    if (_.every(this.whereSegments, segment => {
      return ((segment.value || segment.type === 'plus-button') &&
              !(segment.fake && segment.type !== 'plus-button'));
    })) {
      this.panelCtrl.refresh();
    }
  }

  ///////////////////////

  buildWhereSegments(whereClauses: any): void {
    var self = this;
    _.forEach(whereClauses, whereClause => {
      if (whereClause.condition) {
        self.whereSegments.push(self.uiSegmentSrv.newCondition(whereClause.condition));
      }
      self.whereSegments.push(self.uiSegmentSrv.newKey(whereClause.column));
      self.whereSegments.push(self.uiSegmentSrv.newOperator(whereClause.operator));
      self.whereSegments.push(self.uiSegmentSrv.newKeyValue(whereClause.value));
    });
    this.fixSegments(this.whereSegments);
  }

  buildWhereClauses() {
    var i = 0;
    var whereIndex = 0;
    var segments = this.whereSegments;
    var whereClauses = [];
    while (segments.length > i && segments[i].type !== 'plus-button') {
      if (whereClauses.length < whereIndex + 1) {
        whereClauses.push({condition: '', column: '', operator: '', value: ''});
      }
      if (segments[i].type === 'condition') {
        whereClauses[whereIndex].condition = segments[i].value;
      } else if (segments[i].type === 'key') {
        whereClauses[whereIndex].column = segments[i].value;
      } else if (segments[i].type === 'operator') {
        whereClauses[whereIndex].operator = segments[i].value;
      } else if (segments[i].type === 'value') {
        whereClauses[whereIndex].value = segments[i].value;
        whereIndex++;
      }
      i++;
    }
    this.target.whereClauses = whereClauses;
  }

  fixSegments(segments) {
    var count = segments.length;
    var lastSegment = segments[Math.max(count-1, 0)];

    if (!lastSegment || lastSegment.type !== 'plus-button') {
      segments.push(this.uiSegmentSrv.newPlusButton());
    }
  }

  transformToSegments(results, addTemplateVars?: boolean) {
    var segments = _.map(_.flatten(results), value => {
      return this.uiSegmentSrv.newSegment({
        value: value.toString(),
        expandable: false
      });
    });

    if (addTemplateVars) {
      for (let variable of this.templateSrv.variables) {
        segments.unshift(this.uiSegmentSrv.newSegment({ type: 'template', value: '$' + variable.name, expandable: true }));
      }
    }
    return segments;
  }

  updateGroupByAliases() {
    let groupByAliases = new Array(this.target.groupByColumns.length);
    this.target.groupByColumns.forEach((column, index) => {
      if (this.target.groupByAliases[index]) {
        groupByAliases[index] = this.target.groupByAliases[index];
      } else {
        groupByAliases[index] = "";
      }
    });
    this.target.groupByAliases = groupByAliases;
  }

}
