import prunk from 'prunk';
import {jsdom} from 'jsdom';
import chai from 'chai';
import _ from 'lodash';

// Mock angular module
var angularMocks = {
  module: function() {
    return {
      directive: function() { }
    };
  }
};

var datemathMock = {
  parse: function() { }
};

var configMock = {
  bootData: {
    user: {
      lightTheme: false
    }
  }
};

// Mock lodash for using with CommonJS in tests.
// Because typescript compiler generates code like this:
// lodash["default"].map() - it uses default export.
var lodashMock = {
  default: _
};

// Mock Grafana modules that are not available outside of the core project
// Required for loading module.js
prunk.mock('./css/query-editor.css!', 'no css, dude.');
prunk.mock('app/plugins/sdk', {
  QueryCtrl: null
});
prunk.mock('app/core/utils/datemath', datemathMock);
prunk.mock('app/core/config', configMock);
prunk.mock('angular', angularMocks);
prunk.mock('jquery', 'module not found');
prunk.mock('lodash', lodashMock);

// Setup jsdom
// Required for loading angularjs
global.document = jsdom('<html><head><script></script></head><body></body></html>');
global.window = global.document.parentWindow;
global.navigator = window.navigator = {};
global.Node = window.Node;

// Setup Chai
chai.should();
global.assert = chai.assert;
global.expect = chai.expect;
