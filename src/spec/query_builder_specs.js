//import {describe, beforeEach, it, sinon, expect} from '../utils/test_common';
import {CrateQueryBuilder} from '../query_builder';

describe('CrateQueryBuilder', function() {
  var ctx = {};

  describe('When building query', function() {

    beforeEach(function() {
      ctx.queryBuilder = new CrateQueryBuilder('stats', 'nodes', 'ts', 'minute');
      ctx.target = {
        metricAggs: [
          {type: 'avg', column: 'load'}
        ],
        whereClauses: [
          {condition: 'AND', key: 'hostname', operator: '=', value: 'backend01'}
        ]
      };
    });

    it('should build proper Crate SQL query', function(done) {
      var expected_query = "SELECT date_trunc('minute', ts) as time, " +
                           "avg(load) " +
                           "FROM \"stats\".\"nodes\" " +
                           "WHERE time >= ? AND time <= ? " +
                             "AND hostname = 'backend01' " +
                           "GROUP BY time " +
                           "ORDER BY time ASC";
      var query = ctx.queryBuilder.build(ctx.target);
      expect(query).to.equal(expected_query);
      done();
    });
  });

  describe('When building columns query', function() {

    beforeEach(function() {
      ctx.queryBuilder = new CrateQueryBuilder('stats', 'nodes', 'ts', '1m');
    });

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

    beforeEach(function() {
      ctx.queryBuilder = new CrateQueryBuilder('stats', 'nodes', 'ts', '1m');
    });

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
