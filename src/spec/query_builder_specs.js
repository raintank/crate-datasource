//import {describe, beforeEach, it, sinon, expect} from '../utils/test_common';
import {CrateQueryBuilder} from '../query_builder';

describe('CrateQueryBuilder', function() {
  var ctx = {};

  beforeEach(function() {
    ctx.templateSrv = {
      containsVariable: (str, variable) => {return true;},
      variables: []
    };
    ctx.queryBuilder = new CrateQueryBuilder('stats', 'nodes', 'ts', 'minute', ctx.templateSrv);
  });

  describe('When building query', function() {

    beforeEach(function() {
      ctx.target = {
        metricAggs: [
          {type: 'avg', column: 'load'}
        ],
        whereClauses: [
          {condition: 'AND', column: 'hostname', operator: '=', value: 'backend01'}
        ],
        groupByColumns: [],
      };
    });

    it('should build proper Crate SQL query', function(done) {
      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND hostname = 'backend01' " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";
      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should build proper WHERE clause', function(done) {
      ctx.target.whereClauses = [
        {condition: 'AND', column: 'hostname', operator: '=', value: 'backend01'},
        {condition: 'OR', column: 'hostname', operator: '=', value: 'frontend01'}
      ];
      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND hostname = 'backend01' " +
                             "OR hostname = 'frontend01' " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";
      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should handle WHERE ... IN ... properly', function(done) {
      ctx.target.whereClauses = [
        {condition: 'AND', column: 'id', operator: 'IN', value: 'a, 42'}
      ];
      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND id IN ('a', 42) " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";
      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should handle WHERE IN properly if template variables has been used', function(done) {
      ctx.templateSrv.variables = [{name: 'id'}];

      ctx.target.whereClauses = [
        {condition: 'AND', column: 'id', operator: 'IN', value: '$id'}
      ];

      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND id IN ($id) " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";
      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should add GROUP BY columns to SELECT and ORDER BY expressions', function(done) {
      ctx.target = {
        metricAggs: [
          {type: 'avg', column: 'load'}
        ],
        whereClauses: [],
        groupByColumns: ['hostname'],
      };

      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load), hostname " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                           "GROUP BY time, hostname " +
                           "ORDER BY time, hostname ASC";

      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should add AS clause to SELECT if alias has been specified', function(done) {
      ctx.target = {
        metricAggs: [
          {type: 'avg', column: 'load[\'1\']', alias: 'load'}
        ],
        whereClauses: [],
        groupByColumns: [],
      };
      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load[\'1\']) AS \"load\" " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";
      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });
  });

  describe('When building columns query', function() {

    it('should build proper Crate SQL query', function(done) {
      var expected_query = "SELECT column_name " +
                           "FROM information_schema.columns " +
                           "WHERE schema_name = 'stats' " +
                             "AND table_name = 'nodes' " +
                           "ORDER BY 1";
      var query = ctx.queryBuilder.getColumnsQuery();
      expect(query).to.equal(expected_query);
      done();
    });
  });

  describe('When building values query', function() {

    it('should build proper Crate SQL query', function(done) {
      var expected_query = "SELECT DISTINCT load " +
                           "FROM \"stats\".\"nodes\"";
      var query = ctx.queryBuilder.getValuesQuery('load');
      expect(query).to.equal(expected_query);
      done();
    });

    it('should add limit to query if it passed', function(done) {
      var expected_query = "SELECT DISTINCT load " +
                           "FROM \"stats\".\"nodes\" LIMIT 10";
      var query = ctx.queryBuilder.getValuesQuery('load', 10);
      expect(query).to.equal(expected_query);
      done();
    });
  });
});
