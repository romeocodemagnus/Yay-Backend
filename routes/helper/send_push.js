/**
 * Created by root on 6/20/16.
 */
var azure = require('./azure');
var db = require('./db');
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

exports.testPush = function (req, res){
    var query = "SELECT `tag` FROM `push_tag`";
    var data = {
        message: "TEST PUSH",
        chatHead: 10,
        name: "Bernard"
    };
    db.query(query, function(err, tags){
        if(err){
            return res.json({error: true, message: err});
        }
        if(tags && tags.length){
            tags.forEach(function (tag){
                exports.sendPush(tag.tag, data, function (resp){
                    console.log("PUSH", resp);
                })
            });
            res.json({message: "empty"});
        }else{
            res.json({message: "empty"});
        }
    });
};