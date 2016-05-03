import {QueryCtrl} from 'app/plugins/sdk';

export class CrateDatasourceQueryCtrl extends QueryCtrl {

  constructor($scope, $injector, uiSegmentSrv)  {
    super($scope, $injector);

    this.scope = $scope;
    this.uiSegmentSrv = uiSegmentSrv;
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}

CrateDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';

