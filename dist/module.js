'use strict';

System.register(['./datasource', './query_ctrl'], function (_export, _context) {
  "use strict";

  var CrateDatasource, CrateDatasourceQueryCtrl, CrateConfigCtrl, CrateQueryOptionsCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      CrateDatasource = _datasource.CrateDatasource;
    }, function (_query_ctrl) {
      CrateDatasourceQueryCtrl = _query_ctrl.CrateDatasourceQueryCtrl;
    }],
    execute: function () {
      _export('ConfigCtrl', CrateConfigCtrl = function CrateConfigCtrl() {
        _classCallCheck(this, CrateConfigCtrl);
      });

      CrateConfigCtrl.templateUrl = 'partials/config.html';

      _export('QueryOptionsCtrl', CrateQueryOptionsCtrl = function CrateQueryOptionsCtrl() {
        _classCallCheck(this, CrateQueryOptionsCtrl);
      });

      CrateQueryOptionsCtrl.templateUrl = 'partials/query.options.html';

      _export('Datasource', CrateDatasource);

      _export('QueryCtrl', CrateDatasourceQueryCtrl);

      _export('ConfigCtrl', CrateConfigCtrl);

      _export('QueryOptionsCtrl', CrateQueryOptionsCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
