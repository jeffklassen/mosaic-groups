process.env.NODE_ENV = 'test';

var mockgoose = require('mockgoose');
var mongoose = require('mongoose');
mockgoose(mongoose);
var app = require('../../server');

exports.app = app;