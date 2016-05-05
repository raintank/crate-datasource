import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';
import * as queryBuilder from './query_builder';

export class CrateDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;

    // TODO: remove later
    // Set raw query mode by default
    this.target.rawQuery = false;

    var target_defaults = {
      table: "default",
      selectColumns: ["*"]
    };
    _.defaults(this.target, target_defaults);

    this.tableSegment = this.uiSegmentSrv.newSegment(this.target.table);
    this.selectColumnSegments = _.map(this.target.selectColumns, this.uiSegmentSrv.newSegment);

    this.fixSelectColumnSegments();
  }

  crateQuery(query) {
    return this.datasource._sql_query(query).then(response => {
      return response.data.rows;
    });
  }

  buildQuery() {
    this.target.query = queryBuilder.buildQuery(this.target);
    this.onChangeInternal();
  }

  // Event handlers
  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }

  tableChanged() {
    this.target.table = this.tableSegment.value;
    this.buildQuery();
  }

  columnSegmentChanged(segment, index) {
    console.log(segment, index);
    if (segment.type === 'plus-button') {
      segment.type = undefined;
      this.selectColumnSegments.push(this.uiSegmentSrv.newPlusButton());
    }
    this.target.selectColumns = _.map(_.filter(this.selectColumnSegments, segment => {
      return segment.type !== 'plus-button';
    }), 'value');
    this.buildQuery();
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  // Query suggestions
  getTables() {
    var self = this;
    return this.crateQuery(queryBuilder.getTables())
      .then(rows => {
        return self.transformToSegments(rows);
      });
  }

  getColumns() {
    var self = this;
    return this.crateQuery(queryBuilder.getColumns(this.tableSegment.value))
      .then(rows => {
        return self.transformToSegments(rows);
      });
  }

  fixSelectColumnSegments() {
    var count = this.selectColumnSegments.length;
    var lastSegment = this.selectColumnSegments[Math.max(count-1, 0)];

    if (!lastSegment || lastSegment.type !== 'plus-button') {
      this.selectColumnSegments.push(this.uiSegmentSrv.newPlusButton());
    }
  }

  transformToSegments(results) {
    var segments = _.map(_.flatten(results), table => {
      return this.uiSegmentSrv.newSegment({
        value: table,
        expandable: false
      });
    });
    return segments;
  }

}

CrateDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

