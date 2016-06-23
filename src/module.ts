import {CrateDatasource} from './datasource';
import {CrateDatasourceQueryCtrl} from './query_ctrl';

class CrateConfigCtrl {
  static templateUrl = 'partials/config.html';
}

class CrateQueryOptionsCtrl {
  static templateUrl = 'partials/query.options.html';
}

export {
  CrateDatasource as Datasource,
  CrateDatasourceQueryCtrl as QueryCtrl,
  CrateConfigCtrl as ConfigCtrl,
  CrateQueryOptionsCtrl as QueryOptionsCtrl
};
