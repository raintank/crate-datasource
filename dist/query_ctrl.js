'use strict';

System.register(['angular', 'lodash', 'app/plugins/sdk', './query_builder'], function (_export, _context) {
  "use strict";

  var angular, _, QueryCtrl, queryBuilder, _createClass, CrateDatasourceQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_angular) {
      angular = _angular.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_query_builder) {
      queryBuilder = _query_builder;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('CrateDatasourceQueryCtrl', CrateDatasourceQueryCtrl = function (_QueryCtrl) {
        _inherits(CrateDatasourceQueryCtrl, _QueryCtrl);

        function CrateDatasourceQueryCtrl($scope, $injector, $q, uiSegmentSrv) {
          _classCallCheck(this, CrateDatasourceQueryCtrl);

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CrateDatasourceQueryCtrl).call(this, $scope, $injector));

          _this.scope = $scope;
          _this.$q = $q;
          _this.uiSegmentSrv = uiSegmentSrv;

          _this.operators = {
            compare: ['<', '>', '<=', '>=', '=', '<>', '!=', 'like'],
            regex: ['~', '!~']
          };

          var target_defaults = {
            schema: "doc",
            table: "default",
            selectColumns: ["*"],
            whereClauses: [],
            orderBy: "time",
            orderType: "ASC"
          };
          _.defaults(_this.target, target_defaults);

          var orderTypes = ["ASC", "DESC"];

          _this.orderTypes = _.map(orderTypes, _this.uiSegmentSrv.newSegment);
          _this.orderTypeSegment = _this.uiSegmentSrv.newSegment(_this.target.orderType);
          _this.orderBySegment = _this.uiSegmentSrv.newSegment(_this.target.orderBy);
          _this.schemaSegment = _this.uiSegmentSrv.newSegment(_this.target.schema);
          _this.tableSegment = _this.uiSegmentSrv.newSegment(_this.target.table);
          _this.selectColumnSegments = _.map(_this.target.selectColumns, _this.uiSegmentSrv.newSegment);

          // Build WHERE segments
          _this.whereSegments = [];
          _.forEach(_this.target.whereClauses, function (whereClause) {
            if (whereClause.condition) {
              _this.whereSegments.push(uiSegmentSrv.newCondition(whereClause.condition));
            }
            _this.whereSegments.push(uiSegmentSrv.newSegment(whereClause.left));
            _this.whereSegments.push(uiSegmentSrv.newOperator(whereClause.operator));
            _this.whereSegments.push(uiSegmentSrv.newKeyValue(whereClause.right));
          });

          _this.fixSelectColumnSegments();
          _this.fixSegments(_this.whereSegments);

          _this.removeWhereSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove --' });
          return _this;
        }

        _createClass(CrateDatasourceQueryCtrl, [{
          key: 'crateQuery',
          value: function crateQuery(query) {
            return this.datasource._sql_query(query).then(function (response) {
              return response.data.rows;
            });
          }
        }, {
          key: 'buildQuery',
          value: function buildQuery() {
            this.target.query = queryBuilder.buildQuery(this.target);
            this.onChangeInternal();
          }
        }, {
          key: 'onChangeInternal',
          value: function onChangeInternal() {
            this.panelCtrl.refresh(); // Asks the panel to refresh data.
          }
        }, {
          key: 'schemaChanged',
          value: function schemaChanged() {
            this.target.schema = this.schemaSegment.value;
            this.buildQuery();
          }
        }, {
          key: 'tableChanged',
          value: function tableChanged() {
            this.target.table = this.tableSegment.value;
            this.buildQuery();
          }
        }, {
          key: 'columnSegmentChanged',
          value: function columnSegmentChanged(segment, index) {
            if (segment.type === 'plus-button') {
              segment.type = undefined;
              this.selectColumnSegments.push(this.uiSegmentSrv.newPlusButton());
            }
            this.target.selectColumns = _.map(_.filter(this.selectColumnSegments, function (segment) {
              return segment.type !== 'plus-button';
            }), 'value');
            this.buildQuery();
          }
        }, {
          key: 'orderByChanged',
          value: function orderByChanged() {
            this.target.orderBy = this.orderBySegment.value;
            this.target.orderType = this.orderTypeSegment.value;
            this.buildQuery();
          }
        }, {
          key: 'toggleEditorMode',
          value: function toggleEditorMode() {
            this.target.rawQuery = !this.target.rawQuery;
          }
        }, {
          key: 'getSchemas',
          value: function getSchemas() {
            var self = this;
            return this.crateQuery(queryBuilder.getSchemas()).then(function (rows) {
              return self.transformToSegments(rows);
            });
          }
        }, {
          key: 'getTables',
          value: function getTables() {
            var self = this;
            return this.crateQuery(queryBuilder.getTables(this.schemaSegment.value)).then(function (rows) {
              return self.transformToSegments(rows);
            });
          }
        }, {
          key: 'getColumns',
          value: function getColumns() {
            var self = this;
            return this.crateQuery(queryBuilder.getColumns(this.schemaSegment.value, this.tableSegment.value)).then(function (rows) {
              return self.transformToSegments(rows);
            });
          }
        }, {
          key: 'getValues',
          value: function getValues(column) {
            var limit = arguments.length <= 1 || arguments[1] === undefined ? 10 : arguments[1];

            var self = this;
            return this.crateQuery(queryBuilder.getValues(this.schemaSegment.value, this.tableSegment.value, column, limit)).then(function (rows) {
              var uniqRows = _.uniq(_.flatten(rows));
              return self.transformToSegments(uniqRows);
            });
          }
        }, {
          key: 'getColumnsOrValues',
          value: function getColumnsOrValues(segment, index) {
            var _this2 = this;

            if (segment.type === 'condition') {
              return this.$q.when([this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')]);
            }
            if (segment.type === 'operator') {
              return this.$q.when(this.uiSegmentSrv.newOperators(this.operators.compare));
            }

            if (segment.type === 'key' || segment.type === 'plus-button') {
              return this.getColumns().then(function (columns) {
                columns.splice(0, 0, angular.copy(_this2.removeWhereSegment));
                return columns;
              });
            } else if (segment.type === 'value') {
              return this.getValues(this.whereSegments[index - 2].value).then(function (columns) {
                columns.splice(0, 0, angular.copy(_this2.removeWhereSegment));
                return columns;
              });
            }
          }
        }, {
          key: 'whereSegmentUpdated',
          value: function whereSegmentUpdated(segment, index) {
            this.whereSegments[index] = segment;

            if (segment.value === this.removeWhereSegment.value) {
              this.whereSegments.splice(index, 3);
              if (this.whereSegments.length === 0) {
                this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
              } else if (this.whereSegments.length > 2) {
                this.whereSegments.splice(Math.max(index - 1, 0), 1);
                if (this.whereSegments[this.whereSegments.length - 1].type !== 'plus-button') {
                  this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
                }
              }
            } else {
              if (segment.type === 'plus-button') {
                if (index > 2) {
                  this.whereSegments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
                }
                this.whereSegments.push(this.uiSegmentSrv.newOperator('='));
                this.whereSegments.push(this.uiSegmentSrv.newFake('select tag value', 'value', 'query-segment-value'));
                segment.type = 'key';
                segment.cssClass = 'query-segment-key';
              }
              if (index + 1 === this.whereSegments.length) {
                this.whereSegments.push(this.uiSegmentSrv.newPlusButton());
              }
            }

            this.buildWhereClauses();

            // Refresh only if all fields setted
            if (_.every(this.whereSegments, function (segment) {
              return (segment.value || segment.type === 'plus-button') && !(segment.fake && segment.type !== 'plus-button');
            })) {
              this.panelCtrl.refresh();
            }
          }
        }, {
          key: 'buildWhereClauses',
          value: function buildWhereClauses() {
            var i = 0;
            var whereIndex = 0;
            var segments = this.whereSegments;
            var whereClauses = this.target.whereClauses;
            while (segments.length > i && segments[i].type !== 'plus-button') {
              if (whereClauses.length < whereIndex + 1) {
                whereClauses.push({ condition: '', left: '', operator: '', right: '' });
              }
              if (segments[i].type === 'condition') {
                whereClauses[whereIndex].condition = segments[i].value;
              } else if (segments[i].type === 'key') {
                whereClauses[whereIndex].left = segments[i].value;
              } else if (segments[i].type === 'operator') {
                whereClauses[whereIndex].operator = segments[i].value;
              } else if (segments[i].type === 'value') {
                whereClauses[whereIndex].right = segments[i].value;
                whereIndex++;
              }
              i++;
            }
          }
        }, {
          key: 'getOrderByColumns',
          value: function getOrderByColumns() {
            return this.$q.when(this.selectColumnSegments);
          }
        }, {
          key: 'getOrderTypes',
          value: function getOrderTypes() {
            var orderTypes = ["ASC", "DESC"];
            return this.$q.when(this.transformToSegments(orderTypes));
          }
        }, {
          key: 'fixSelectColumnSegments',
          value: function fixSelectColumnSegments() {
            var count = this.selectColumnSegments.length;
            var lastSegment = this.selectColumnSegments[Math.max(count - 1, 0)];

            if (!lastSegment || lastSegment.type !== 'plus-button') {
              this.selectColumnSegments.push(this.uiSegmentSrv.newPlusButton());
            }
          }
        }, {
          key: 'fixSegments',
          value: function fixSegments(segments) {
            var count = segments.length;
            var lastSegment = segments[Math.max(count - 1, 0)];

            if (!lastSegment || lastSegment.type !== 'plus-button') {
              segments.push(this.uiSegmentSrv.newPlusButton());
            }
          }
        }, {
          key: 'transformToSegments',
          value: function transformToSegments(results) {
            var _this3 = this;

            var segments = _.map(_.flatten(results), function (value) {
              return _this3.uiSegmentSrv.newSegment({
                value: value.toString(),
                expandable: false
              });
            });
            return segments;
          }
        }]);

        return CrateDatasourceQueryCtrl;
      }(QueryCtrl));

      _export('CrateDatasourceQueryCtrl', CrateDatasourceQueryCtrl);

      CrateDatasourceQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
