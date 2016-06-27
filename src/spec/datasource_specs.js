//import {describe, beforeEach, it, sinon, expect} from '../utils/test_common';
import {Datasource} from '../module';
import Q from "q";

describe('CrateDatasource', function() {
  var ctx = {};

  describe('When testing datasource', function() {

    beforeEach(function() {
      ctx.$q = Q;
      ctx.backendSrv = {};
      ctx.templateSrv = {};
      ctx.ds = new Datasource({url: "http://crate.io:4200"}, ctx.$q, ctx.backendSrv, ctx.templateSrv);
    });

    it('should return Crate cluster name and version if test ok', function(done) {
      ctx.backendSrv.datasourceRequest = function(options) {
        return ctx.$q.when({
          status: 200,
          data: {
            "ok" : true,
            "status" : 200,
            "name" : "Negasonic Teenage Warhead",
            "cluster_name" : "Crate Test Cluster",
            "version" : {
              "number" : "0.54.8",
              "build_hash" : "c3a7dc4caecfe4fef2992148c8b78347d8c30b2e",
              "build_timestamp" : "2016-04-08T12:26:00Z",
              "build_snapshot" : false,
              "es_version" : "1.7.5",
              "lucene_version" : "4.10.4"
            }
          }
        });
      };

      ctx.ds.testDatasource().then(function(result) {
        expect(result).to.have.property('status');
        expect(result).to.have.property('title');
        expect(result).to.have.property('message');
        expect(result.status).to.equal('success');
        expect(result.title).to.equal('Success');
        expect(result.message).to.equal('Cluster: Crate Test Cluster, version: 0.54.8');
        done();
      });
    });

    it('should return Crate error if host and port was set properly but url is wrong', function(done) {
      ctx.backendSrv.datasourceRequest = function(options) {
        var deferred = ctx.$q.defer();
        deferred.reject({
          status: 400,
          statusText: "Bad Request",
          data: "No handler found for uri [/wrong] and method [GET]"
        });
        return deferred.promise;
      };

      ctx.ds.testDatasource().then(function(result) {
        expect(result).to.have.property('status');
        expect(result).to.have.property('title');
        expect(result).to.have.property('message');
        expect(result.status).to.equal('error');
        expect(result.title).to.equal('Error');
        expect(result.message).to.equal('Bad Request: No handler found for uri [/wrong] and method [GET]');
        done();
      });
    });

    it('should return http error if url is unreachable', function(done) {
      ctx.backendSrv.datasourceRequest = function(options) {
        var deferred = ctx.$q.defer();
        deferred.reject({
          status: 500,
          statusText: "Internal Server Error",
          data: {
            error: "Internal Server Error",
            message: "Internal Server Error"
          }
        });
        return deferred.promise;
      };

      ctx.ds.testDatasource().then(function(result) {
        expect(result).to.have.property('status');
        expect(result).to.have.property('title');
        expect(result).to.have.property('message');
        expect(result.status).to.equal('error');
        expect(result.title).to.equal('Error');
        expect(result.message).to.equal('Internal Server Error: Internal Server Error');
        done();
      });
    });

  });
});
