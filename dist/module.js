System.register(['./datasource', './query_ctrl', './config_ctrl'], function(exports_1) {
    var datasource_1, query_ctrl_1, config_ctrl_1;
    var CrateQueryOptionsCtrl;
    return {
        setters:[
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (config_ctrl_1_1) {
                config_ctrl_1 = config_ctrl_1_1;
            }],
        execute: function() {
            CrateQueryOptionsCtrl = (function () {
                function CrateQueryOptionsCtrl() {
                }
                CrateQueryOptionsCtrl.templateUrl = 'partials/query.options.html';
                return CrateQueryOptionsCtrl;
            })();
            exports_1("Datasource", datasource_1.CrateDatasource);
            exports_1("QueryCtrl", query_ctrl_1.CrateDatasourceQueryCtrl);
            exports_1("ConfigCtrl", config_ctrl_1.CrateConfigCtrl);
            exports_1("QueryOptionsCtrl", CrateQueryOptionsCtrl);
        }
    }
});
//# sourceMappingURL=module.js.map