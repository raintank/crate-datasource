# Grafana Data Source Plugin for CrateDB

[![Crate.io logo](https://raw.githubusercontent.com/raintank/crate-datasource/master/crate-logo.png)](https://crate.io)


## What Is CrateDB?
CrateDB is a SQL database that makes it simple to store and analyze
massive amounts of machine data in real-time. CrateDB customers have
reported improving predictive analytic query performance of machine
data by 20x more than MySQL, while reducing database hardware costs by
75%.

Here’s how CrateDB makes this possible:

- **Combining SQL & Search** into a single DBMS - allowing you to process any data structure...time series, geospatial, JSON, full-text, etc.
- **Distributed query innovations** - that deliver real-time SQL performance
- **An auto-scaling architecture** - grow CrateDB with less DBA expertise
- **Dynamic schemas, adhoc queries** - quickly adapt to data structure changes

For these reasons and more, CrateDB is your perfect datasource for Grafana.

## The CrateDB Datasource Plugin for Grafana

### Features
Enables CrateDB clusters to act as data sources for your Grafana deployment, providing real-time analytical and time-series data with SQL.

### Requirements
- **Grafana** > 3.x.x
- **CrateDB** - All stable versions are supported by this plugin

### Setup
![](https://raw.githubusercontent.com/raintank/crate-datasource/master/src/img/crate-datasource-add-src.png)

  > The screenshot shows a connection to http://localhost:44200 which is a test database for the purpose of this tutorial. CrateDB's default binding is to http://localhost:4200.

1. Click on the Grafana icon on the top left.
2. After the menu opened, you should see a link `Data Sources` below `Dashboards`.
3. Click `+ Add data source`.
4. Select `CrateDB` from the 'Type' dropdown.

#### Cross-origin Resource Sharing (CORS)

CrateDB supports [cross-origin resource sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) and if Grafana is running on a different origin (e.g. another domain), it is required to configure CrateDB accordingly. For example by this is the minimum required configuration in your `crate.yml`:
```
http.cors.enabled: true
http.cors.allow-origin: "http://mydomain.com"
```
> Replace http://mydomain.com with the domain Grafana is running on, or use a "*" if it's OK to allow any domain to access CrateDB

For further options look in [CrateDB's documentation](https://crate.io/docs/reference/en/latest/configuration.html#cross-origin-resource-sharing-cors)

#### The CrateDB Data Source

Name | Description
------------ | -------------
Name | The data source name.
Default | Set this data source as default for new panels.

##### HTTP Settings

Name | Description
------------ | -------------
Url | The URI to any node in your CrateDB cluster.
Access | Via Grafana backend (proxy) or directly from the browser (direct).
Basic Auth | Enable basic authentication (only available via NGINX proxy in CrateDB).
User | Not available in CrateDB.
Password | Not available in CrateDB.

##### CrateDB Details

These are specific settings for the CrateDB data source and it's required to set a fixed `schema`,  `table`, and time series column per data source.

Name | Description
------------ | -------------
Schema | CrateDB schema to query from (defaults to `doc`).
Table | Table to retrieve the data from. Has to be available in the previously defined schema.
Time Column | Time series column, has to be of type `timestamp` in CrateDB.
Default grouping interval | The grouping resolution (can be changed by query).

![](https://raw.githubusercontent.com/raintank/crate-datasource/master/src/img/crate-datasource-nonvalidation.png)

> Grafana will not check (yet) if the `time column`, the `schema`, or the `table` exists. Be sure to double check these values to avoid running into problems later.

### Querying CrateDB

After adding a new dashboard and having the query editor open, define and run the queries you like - it's just like other SQL databases. For example we have added the [NYC yellow cab data set](http://www.nyc.gov/html/tlc/html/about/trip_record_data.shtml) in our cluster to show you something interesting!

![](https://raw.githubusercontent.com/raintank/crate-datasource/master/src/img/crate-datasource-graph.png)

> This graph shows the number of yellow cab pick ups between on a weekend in August 2013.

### Debugging Queries

Grafana runs queries almost immediately after change and it will also auto-complete columns or previous values. However, sometimes queries might still be invalid and Grafana will then show a small exclamation mark in the top corner of the graph. Clicking on it will give you the error message.

![](https://raw.githubusercontent.com/raintank/crate-datasource/master/src/img/crate-datasource-error.png)

The CrateDB data source for Grafana supports a great range of scalar functions and operators. To read more about them, install or scale a cluster, or even to contribute to Crate, please have a look at the [official Crate documentation](https://crate.io/docs)

### License
- This plugins is made available under the terms of the [Apache License, Version 2.0](https://github.com/crate/crate-datasource/blob/master/LICENSE).

## Getting Help

- Read the CrateDB documentation [here](https://crate.io/docs)
- Issues with the Grafana plugin can be reported or discussed [here](https://github.com/raintank/crate-datasource/issues)
- Issues with CrateDB can be reported or discussed [here](https://github.com/crate/crate/issues)
- Join the CrateDB Community Slack channel [here](https://crate.io/docs/support/slackin/)
