# Change Log


## [Unreleased]


## [0.5.1] - 2017-04-05
### Changed
- Use date_trunk() when interval set to second, minute, etc
- Override limit only for Raw agg queries.


## [0.5.0] - 2017-03-22
### Added
- Checks schema and table (prevent queries to different source).


## [0.4.0] - 2017-03-19
### Added
- 'Auto' (uses date_trunk()) and 'Auto (Grafana)' (uses floor()) time intervals.

### Fixed
- 10K issue

### Changed
- Use explicit aggregation by time interval based on floor() instead date_trunk()

## [0.3.0] - 2017-03-02
### Added
- Table mode support
- Ad-hoc filters support
- $timeFilter variable support
- Quote column names with capital letters [#28](https://github.com/raintank/crate-datasource/issues/28)
- Support GROUP BY in raw queries, issue [#30](https://github.com/raintank/crate-datasource/issues/30)

### Fixed
- Schema queries (changed in Crate 1.0)


## [0.2.0] - 2016-11-29
### Added
- Special "Raw" aggregation type [#9](https://github.com/raintank/crate-datasource/issues/9)
- Alias for each field in SELECT


## [0.1.0] - 2016-07-10
- Initial release
- Implementation by [raintank](http://raintank.io)
- Documentation contributions from [Crate.io](https://crate.io)
