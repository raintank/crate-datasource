//import {describe, beforeEach, it, sinon, expect} from '../utils/test_common';
import {CrateQueryBuilder} from '../query_builder';

describe('CrateQueryBuilder', function() {
  var ctx = {};

  beforeEach(function() {
    ctx.templateSrv = {
      containsVariable: (str, variable) => {return true;},
      variables: []
    };
    ctx.limit = 100;
    ctx.adhocFilters = [];
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
        timeInterval: 'auto'
      };

      ctx.interval = 'second';
    });

    it('should build proper Crate SQL query', function(done) {
      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND hostname = 'backend01' " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should build proper WHERE clause', function(done) {
      ctx.target.whereClauses = [
        {condition: 'AND', column: 'hostname', operator: '=', value: 'backend01'},
        {condition: 'OR', column: 'hostname', operator: '=', value: 'frontend01'}
      ];

      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND hostname = 'backend01' " +
                             "OR hostname = 'frontend01' " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);

      // Raw agg query
      ctx.target.metricAggs = [
        {type: 'raw', column: 'load'}
      ];

      expected_query = "SELECT ts as time, " +
                       "load " +
                       "FROM \"stats\".\"nodes\" " +
                       "WHERE ts >= ? AND ts <= ? " +
                         "AND hostname = 'backend01' " +
                         "OR hostname = 'frontend01' " +
                       "GROUP BY time, load " +
                       "ORDER BY time ASC";

      query = ctx.queryBuilder.buildRawAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should handle WHERE ... IN ... properly', function(done) {
      ctx.target.whereClauses = [
        {condition: 'AND', column: 'id', operator: 'IN', value: 'a, 42'}
      ];
      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND id IN ('a', 42) " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should handle WHERE IN properly if template variables has been used', function(done) {
      ctx.templateSrv.variables = [{name: 'id'}];

      ctx.target.whereClauses = [
        {condition: 'AND', column: 'id', operator: 'IN', value: '$id'}
      ];

      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND id IN ($id) " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval);
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

      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load), hostname " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                           "GROUP BY time, hostname " +
                           "ORDER BY time, hostname ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);

      // Raw agg query
      ctx.target.metricAggs = [
        {type: 'raw', column: 'load'}
      ];

      expected_query = "SELECT ts as time, " +
                       "load, hostname " +
                       "FROM \"stats\".\"nodes\" " +
                       "WHERE ts >= ? AND ts <= ? " +
                       "GROUP BY time, load, hostname " +
                       "ORDER BY time, hostname ASC";

      query = ctx.queryBuilder.buildRawAggQuery(ctx.target, ctx.interval);
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

      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load[\'1\']) AS \"load\" " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should add limit to query if it passed', function(done) {
      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND hostname = 'backend01' " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval, ctx.adhocFilters, ctx.limit);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should quote column names with capital letters', function(done) {
      var queryBuilder = new CrateQueryBuilder('stats', 'nodes', 'tsCamelCase', 'minute', ctx.templateSrv);
      ctx.target = {
        metricAggs: [
          {type: 'sum', column: 'intValue'}
        ],
        whereClauses: [],
        groupByColumns: [],
      };

      var expected_query = "SELECT date_trunc('second', \"tsCamelCase\") as time, " +
                           "sum(\"intValue\") " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE \"tsCamelCase\" >= ? AND \"tsCamelCase\" <= ? " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = queryBuilder.buildAggQuery(ctx.target, ctx.interval);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should add ad-hoc filters if it set', function(done) {
      ctx.target.whereClauses = [];
      ctx.adhocFilters = [
        {key: 'region', operator: '=', value: 'west'},
        {key: 'load', operator: '>', value: '2'}
      ];

      var expected_query = "SELECT date_trunc('second', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                             "AND region = 'west' " +
                             "AND load > 2 " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval, ctx.adhocFilters);
      expect(query).to.equal(expected_query);
      done();
    });
  });

  describe('When building raw query', function() {
    beforeEach(function() {
      ctx.target = {
        metricAggs: [
          {type: 'raw', column: 'load'}
        ],
        whereClauses: [
          {condition: 'AND', column: 'hostname', operator: '=', value: 'backend01'}
        ],
        groupByColumns: [],
        timeInterval: 'auto'
      };
    });

    it('should build proper SQL query', function(done) {
      ctx.target = {
        metricAggs: [
          {type: 'raw', column: 'load'}
        ],
        whereClauses: [],
        groupByColumns: [],
      };

      var expected_query = "SELECT ts as time, " +
                           "load " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= ? AND ts <= ? " +
                           "GROUP BY time, load " +
                           "ORDER BY time ASC LIMIT 100";

      var query = ctx.queryBuilder.buildRawAggQuery(ctx.target, ctx.interval, ctx.adhocFilters, ctx.limit);
      expect(query).to.equal(expected_query);
      done();
    });
  });

  describe('When Group By time Interval set', function () {
    beforeEach(function () {
      ctx.target = {
        metricAggs: [
          { type: 'avg', column: 'load' }
        ],
        groupByColumns: [],
        timeInterval: 'auto'
      };
    });

    it('should use date_trunc if set to "second"', function (done) {
      ctx.interval = 'second';

      var expected_query = "SELECT date_trunc('second', ts) as time, " +
        "avg(load) " +
        "FROM \"stats\".\"nodes\" " +
        "WHERE ts >= ? AND ts <= ? " +
        "GROUP BY time " +
        "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval, ctx.adhocFilters, ctx.limit);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should use date_trunc if set to "minute"', function (done) {
      ctx.interval = 'minute';

      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
        "avg(load) " +
        "FROM \"stats\".\"nodes\" " +
        "WHERE ts >= ? AND ts <= ? " +
        "GROUP BY time " +
        "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval, ctx.adhocFilters, ctx.limit);
      expect(query).to.equal(expected_query);
      done();
    });

    it('should use floor() if set to "auto_gf"', function (done) {
      ctx.interval = 60;

      var expected_query = "SELECT floor(ts/60)*60 as time, " +
        "avg(load) " +
        "FROM \"stats\".\"nodes\" " +
        "WHERE ts >= ? AND ts <= ? " +
        "GROUP BY time " +
        "ORDER BY time ASC";

      var query = ctx.queryBuilder.buildAggQuery(ctx.target, ctx.interval, ctx.adhocFilters, ctx.limit);
      expect(query).to.equal(expected_query);
      done();
    });
  });

  describe('When building columns query', function() {

    it('should build proper Crate SQL query', function(done) {
      var expected_query = "SELECT column_name " +
                           "FROM information_schema.columns " +
                           "WHERE table_schema = 'stats' " +
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

    it('should add time range to query if it passed', function(done) {
      var expected_query = "SELECT DISTINCT load " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE ts >= 123 AND ts <= 456 " +
                           "LIMIT 10";

      var timeRange = {from: 123, to: 456};
      var query = ctx.queryBuilder.getValuesQuery('load', 10, timeRange);
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
