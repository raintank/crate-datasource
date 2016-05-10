import {CrateDatasource} from './datasource';
import {CrateDatasourceQueryCtrl} from './query_ctrl';

class CrateConfigCtrl {}
CrateConfigCtrl.templateUrl = 'partials/config.html';

class CrateQueryOptionsCtrl {}
CrateQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

export {
  CrateDatasource as Datasource,
  CrateDatasourceQueryCtrl as QueryCtrl,
  CrateConfigCtrl as ConfigCtrl,
  CrateQueryOptionsCtrl as QueryOptionsCtrl
};
