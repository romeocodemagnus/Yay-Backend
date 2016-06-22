/**
 * Created by root on 6/22/16.
 */
var azure = require('azure-sb');

module.exports = azure.createNotificationHubService(
    process.env.PUSH_HUBNAME,
    process.env.PUSH_CONNECTION_STRING
);