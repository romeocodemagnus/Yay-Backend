/**
 * Created by root on 6/17/16.
 */
var db = require('../routes/helper/db');
var async = require('async');
var validator = require('../routes/helper/validator');
var pushController = require('../routes/helper/send_push');

var connected = {};

//User connecting to socket
exports.connect = function (data){
    var isExists = connected[data.id];
    if(isExists){
        connected[data.id].push(data.socketId);
    }else{
        connected[data.id] = [data.socketId];
    }
    insertDeviceTag(data, function (err, result){
        if(err)return console.log(err);
        console.log(result);
    })
};

//User disconnecting to socket
exports.logout = function (data){
    var connectedSocket = connected[data.id];
    if(connectedSocket){
        var indexOfSocketId = connectedSocket.indexOf(data.socketId);
        connectedSocket.splice(indexOfSocketId, 1);
    }
};

function findDeviceTag(data, cb){
    var query = "SELECT `tag` FROM `push_tag`";
    query += " " + "WHERE `user_id`=" + db.escape(data.id);
    if(data.tag){
        query += " " + "AND `tag`=" + db.escape(data.tag);
    }
    db.query(query, function (err, tags){
        if(err) return cb(err, null);
        if(tags){
            cb(null, tags);
        }
    });
}

function insertDeviceTag(data, cb){
    var query = "INSERT INTO `push_tag` SET";
    query += " " + "`user_id`=" + db.escape(data.id);
    query += " " + ", `tag`=" + db.escape(data.tag);

    findDeviceTag(data, function (err, tags){
        if(tags){
            if(!tags.length){
                db.query(query, cb);
            }
        }
    })
}

exports.deleteTag = function(data, cb){
    var query = "DELETE FROM `push_tag`";
    query += " " + "WHERE `user_id`=" + db.escape(data.id);
    query += " " + "AND `tag`=" + db.escape(data.tag);
    db.query(query, function (err, result){
        if(err)return cb({error: true});
        if(result.affectedRows > 0){
            cb({error: false});
        }else{
            cb({error: true});
        }
    });
}
exports.startChat = function (data, cb){
    console.log("START CHAT");
    console.log(data);
    var users = data.users;
    if(!users.length){
        return cb({error: true, message: "users must be an array e.g [ user_1, user_2 ]"});
    }
    var insrtData = {
        user_1 : users[0],
        user_2 : users[1]
    };
    var query = "SELECT `id` FROM `chatHead`";
    query += " " + "WHERE (`user_1`=" + db.escape(users[0]);
    query += " " + "AND  `user_2`=" + db.escape(users[1]);
    query += " " + ")";
    query += " " + "OR (`user_2`=" + db.escape(users[0]);
    query += " " + "AND `user_1`=" + db.escape(users[1]);
    query += " " + ")";

    db.query(query, function (err, result){
        if(err) return cb({error: true, message: err});

        console.log(result);
        if(result.length){
            cb({error: false, chatHead: result[0].id});
        }else{
            db.query("INSERT INTO `chatHead` SET ?", insrtData, function (err, result){
                if(err) return cb({error: true, message: err});
                if (result.insertId > 0){
                    cb({error : false, chatHead: result.insertId});
                }else{
                    cb({error: true, message: "Failed to start chat"});
                }
            });
        }
    });
};

exports.getUserInbox = function (data, cb){
    if(validator.isMissing(data.id)){
        return cb({error: true, message: "Missing id"});
    }

    var query = "SELECT * FROM `chatHead`";
    query += " " + "WHERE user_1=" + db.escape(data.id);
    query += " " + "OR user_2=" + db.escape(data.id);

    db.query(query, function (err, result){
        if(err) return cb({error: true, message: err});
        async.map(result, getLastMessage, function (err, users){
            cb(users);
        });
    });
};

function getLastMessage(data, cb){
    var query = "SELECT * FROM `chatMessages`";
    query += " " + "WHERE `chatHead`=" + db.escape(data.id);
    query += " " + "ORDER BY `id` DESC";
    query += " " + "LIMIT 1";
    db.query(query, function (err, result){
        if(err){
            cb(null, data);
        }else{
            if(result.length){
                data.last_message = result[0];
            }
            cb(null, data);
        }
    });
}

exports.saveMessage = function (socket, data, cb){
    console.log(data);
    if(validator.isMissing(data.chatHead)){
        return cb({error: true, message: "Missing chatHead"});
    }
    var query = "INSERT INTO `chatMessages` SET ?";
    db.query(query, data, function (err, result){
        if(err) return cb({error: true, message: err});
        console.log(result);
        if(result.insertId > 0){
            console.log(data.chatHead);
            socket.broadcast.to(data.chatHead).emit('newMessage', data);
            var connectedSockets = connected[data.to];
            if(!connectedSockets){
                findDeviceTag({id: data.to}, function (err, tags){
                    if(tags && tags.length){
                        tags.forEach(function (tag){
                            pushController.sendPush(tag, data, function (resp){
                                console.log("PUSH");
                                console.log(resp);
                            })
                        });
                    }
                })
            }else{
                if(!connectedSockets.length){
                    findDeviceTag({id: data.to}, function (err, tags){
                        if(tags && tags.length){
                            tags.forEach(function (tag){
                                pushController.sendPush(tag, data, function (resp){
                                    console.log("PUSH");
                                    console.log(resp);
                                })
                            });
                        }
                    })
                }
            }
            exports.markAsRead({
                id: result.insertId,
                chatMateId: data.to
            }, function(){

            });
            cb({error: false, data: data});
        }else{
            cb({error: true, message: "Sending failed."});
        }
    });
};

exports.markAsRead = function (data, cb){
    var query = "UPDATE `chatMessages` SET `status`='read'";
    query += " " + "WHERE `id` <= " + db.escape(data.id);
    query += " " + "AND `from`=" + db.escape(data.chatMateId);

    db.query(query, function (err, result){
        if(err) return cb({error: true, message: err});
        if(result.affectedRows > 0){
            cb({error: false});
        }else{
            cb({error: true});
        }
    });
};

exports.getMessages = function (data, cb){
    var query = "SELECT * FROM `chatMessages`";
    query += " " + "WHERE `chatHead`=" + db.escape(data.chatHead);

    if(!validator.isMissing(data.last_message_id)){
        query += " " + "AND `id` <" + db.escape(data.last_message_id);
    }
    query += " " + "ORDER BY `id` DESC";
    query += " " + "LIMIT 10";

    db.query(query, function (err, results){
        if(err) return cb({error: true, message: err});
        var data = {
            messages: results,
            hasNext : results.length == 10
        };
        cb(data);
    })
};