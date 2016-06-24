/**
 * Created by root on 6/20/16.
 */
var azure = require('./azure');
exports.sendPush = function (tag, data, cb){
    var payLoad = {
        aps: {
            alert: data.message
        },
        chatHead: data.chatHead || data.eventChat_id,
        name: data.name
    };
    azure.apns.send(tag, payLoad, function (err){
        if(!err){
            cb({error: false});
        }else{
            cb({error: true, error_log: err});
        }
    })
};