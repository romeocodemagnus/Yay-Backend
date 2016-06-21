/**
 * Created by root on 6/20/16.
 */
var azure = require('azure-sb');

var notificationHubService = azure.createNotificationHubService(
    process.env.PUSH_HUBNAME,
    process.env.PUSH_CONNECTION_STRING
);

//var notificationHubService = azure.createNotificationHubService(
//    "frendzi_notification",
//    "Endpoint=sb://frendzi.servicebus.windows.net/;SharedAccessKeyName=DefaultFullSharedAccessSignature;SharedAccessKey=ecuJyZTEE9aYi5tHp6enDcy3IDQr6ug7GmWVhxJuhpg="
//);

exports.sendPush = function (tag, data, cb){
    var payLoad = {
        aps: {
            alert: data.message
        },
        chatHead: data.chatHead,
        name: data.name
    };
    notificationHubService.apns.send(tag, payLoad, function (err){
        if(!err){
            cb({error: false});
        }else{
            cb({error: true, error_log: err});
        }
    })
};