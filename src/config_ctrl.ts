///<reference path="../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

export class CrateConfigCtrl {
  static templateUrl = 'partials/config.html';
  current: any;

  timeIntervals: any[] = [
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

  constructor($scope) {
    this.current.jsonData.timeInterval = this.current.jsonData.timeInterval || this.timeIntervals[1].value;
  }
}
