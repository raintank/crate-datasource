///<reference path="../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';

export class CrateConfigCtrl {
  static templateUrl = 'partials/config.html';
  current: any;
  timeIntervals: any[] = [
    {name: '10 seconds', value: '10s'},
    {name: '1 minute',   value: '1m'},
    {name: '10 minutes', value: '10m'},
    {name: '1 hour', value: '1h'}
  ];

  constructor($scope) {
    this.current.jsonData.timeInterval = this.current.jsonData.timeInterval || this.timeIntervals[0].value;
  }
}
