///<reference path="../headers/common.d.ts" />

import _ from 'lodash';

let _metricAggTypes = [
  {text: "Raw",            value: "raw",            allValue: false},
  {text: "Count",          value: 'count',          allValue: true, anyDataType: true},
  {text: "Distinct Count", value: 'count_distinct', allValue: false, anyDataType: true},
  {text: "Avg / Mean",     value: 'avg',            allValue: false},
  {text: "Min",            value: 'min',            allValue: false},
  {text: "Max",            value: 'max',            allValue: false},
  {text: "Sum",            value: 'sum',            allValue: false},
  {text: "Geometric Mean", value: 'geometric_mean', allValue: false},
  {text: "Variance",       value: 'variance',       allValue: false},
  {text: "Std Deviation",  value: 'stddev',         allValue: false},
  {text: "Arbitrary",      value: "arbitrary",      allValue: false}
];

export default class QueryDef {

  static getMetricAggTypes() {
    return _metricAggTypes;
  }
}
