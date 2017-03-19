///<reference path="../headers/common.d.ts" />
System.register([], function(exports_1) {
    var CrateConfigCtrl;
    return {
        setters:[],
        execute: function() {
            CrateConfigCtrl = (function () {
                function CrateConfigCtrl($scope) {
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
                    this.current.jsonData.timeInterval = this.current.jsonData.timeInterval || this.timeIntervals[1].value;
                }
                CrateConfigCtrl.templateUrl = 'partials/config.html';
                return CrateConfigCtrl;
            })();
            exports_1("CrateConfigCtrl", CrateConfigCtrl);
        }
    }
});
//# sourceMappingURL=config_ctrl.js.map