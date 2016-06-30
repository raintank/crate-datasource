///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

let _metricAggTypes = [
  {text: "Count",          value: 'count',          requiresColumn: false},
  {text: "Distinct Count", value: 'count_distinct', requiresColumn: false},
  {text: "Min",            value: 'min',            requiresColumn: true},
  {text: "Max",            value: 'max',            requiresColumn: true},
  {text: "Sum",            value: 'sum',            requiresColumn: true},
  {text: "Avg / Mean",     value: 'avg',            requiresColumn: true},
  {text: "Geometric Mean", value: 'geometric_mean', requiresColumn: true},
  {text: "Variance",       value: 'variance',       requiresColumn: true},
  {text: "Std Deviation",  value: 'stddev',         requiresColumn: true},
  {text: "Arbitrary",      value: "arbitrary",      requiresColumn: true}
];

export default class QueryDef {

  static getMetricAggTypes() {
    return _metricAggTypes;
  }
}
