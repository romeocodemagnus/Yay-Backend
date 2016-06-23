/**
 * Created by root on 6/22/16.
 */
var azure = require('azure-sb');
var config = require('../config/config');
module.exports = azure.createNotificationHubService(
    config.azure.hubname,
    config.azure.connection_string
);