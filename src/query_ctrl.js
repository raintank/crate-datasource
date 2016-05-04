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
    this.target.rawQuery = true;

    this.tableSegment = this.uiSegmentSrv.newSegment(this.target.table || "default");
  }

  crateQuery(query) {
    return this.datasource._sql_query(query).then(response => {
      return response.data.rows;
    });
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }

  toggleEditorMode() {
    this.target.rawQuery = !this.target.rawQuery;
  }

  // Query suggestions
  getTables() {
    var self = this;
    return this.crateQuery(queryBuilder.getTables()).then(rows => {
      console.log(self.transformToSegments(rows));
      return self.transformToSegments(rows);
    });
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

  tableChanged() {}
}

CrateDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

