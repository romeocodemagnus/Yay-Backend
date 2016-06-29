/**
 * Created by root on 6/17/16.
 */
var db = require('../routes/helper/db');
var async = require('async');
var validator = require('../routes/helper/validator');
var pushController = require('../routes/helper/send_push');

//We'll store the socket ids
//to check if user is connected or not
var connected = {};


//User connecting to socket
exports.connect = function (data){
    connected[data.tag] = data.socketId;
    console.log('SOCKET >>', data.id + " " + connected[data.tag]);
};

//User disconnecting to socket
exports.logout = function (data){
    delete connected[data.tag];
    console.log("DELETED TAG >> ", connected[data.tag]);
};

//will find device token (tag) via user_id
//for push notification
function findDeviceTag(data, cb){
    var query = "SELECT `tag`, `user_id` FROM `push_tag`";
    query += " " + "WHERE `user_id`=" + db.escape(data.user_id);
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

//will delete tag if user emit in logout
//to disable push notification
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
};

//=================================================================================
//*                                 GROUP CHAT                                    *
//=================================================================================

//Register event to generate event chat id
exports.registerEventForChat = function (data, cb){
    var eventId = data.event_id;
    var user_id = data.user_id;
    async.waterfall([
        getEventChatIdByEventId,
        function (doNext, done){
            var query = "INSERT INTO `eventChat` SET ?";
            db.query(query, {event_id: eventId}, function (err, result){
                if(err){
                    //TODO: change message on production
                    return done({error: true, message: err});
                }
                if(result.insertId > 0){
                    exports.addUserToEvent({
                        eventChat_id: result.insertId,
                        user_id: user_id
                    }, function (err){
                        if(err.error === true)return done(err);
                        done({error: false, eventChat: result.insertId});
                    });
                }else{
                    done({error: true, message: "failed"});
                }
            });
        }
    ], function (resp){
        cb(resp);
    });
    //search for existing record of event chat
    //this will return the eventChat_id to the client
    //to be use for getting messages
    function getEventChatIdByEventId(cb){
        var query = "SELECT `id` FROM `eventChat`";
        query += " " + "WHERE `event_id`=" + db.escape(eventId);
        db.query(query, function(err, result){
            if(err)return cb({error: false, err: err});
            if(result && result.length){
                cb({error: false, eventChat: result[0].id});
            }else{
                cb(null, false);
            }
        });
    }
};

//will be called if event owner/creator  accepts a request
//from other user to join the event
exports.addUserToEvent = function (data, cb){
    if(!data.user_id){
        return;
    }
    var query = "INSERT INTO `chat_users` SET ?";
    db.query(query, {
        eventChat_id: data.eventChat_id,
        user_id: data.user_id
    }, function (err, result){
        if(err){
            if(err.code === "ER_DUP_ENTRY"){
                return cb({error: false, message: "success"});
            }else{
                //TODO change message on production
                return cb({error: true, message: err});
            }
        }
        if(result.insertId > 0){
            cb({error: false, message: "success"});
        }else{
            cb({error: true, message: "failed"});
        }
    });
};

//Send message to an event
//this will broadcast the message to a specific event chat
//except the sender
exports.sendMessageToEvent = function (socket, data, cb){
    if(validator.isMissing(data.eventChat_id)){
        return cb({error: true, message: "Missing chatHead"});
    }
    var query = "INSERT INTO `eventMessages` SET ?";
    db.query(query, data, function (err, result){
        if(err) return cb({error: true, message: err});
        if(result.insertId > 0){
            //Send message to event chat
            socket.broadcast.to(data.eventChat_id).emit('newMessage', data);

            //will get the users in an event via eventChat_id
            //then check if they have an active socket
            //if not connected, we will send a push notification
            getEventUsers({
                eventChat_id: data.eventChat_id,
                user_id: data.from
            }, function (err, users){
                async.map(users, sendPush);
            });
            cb(data);
        }else{
            cb({error: true, message: "Sending failed."});
        }
    });

    function sendPush(sndData){
        var connectedSockets = connected[sndData.tag];
        if(!connectedSockets){
            pushController.sendPush(sndData.tag, data, function (resp){
                console.log("PUSH SEND EVENT", resp);
            })
        }
    }
};

function getEventUsers(data, cb){
    var query = "SELECT * FROM `chat_users`";
    query += " " + "LEFT JOIN `push_tag`";
    query += " " + "ON `push_tag`.`user_id` = `chat_users`.`user_id`";
    query += " " + "WHERE `chat_users`.`eventChat_id`=" + db.escape(data.eventChat_id);
    query += " " + "AND `chat_users`.`user_id` !=" + db.escape(data.user_id);
    db.query(query, cb);
}

//If eventChat_id is unobtainable
//client side will use the event id
//to get the eventChat_id
exports.getEventChatIdByEventId = function (data, cb){
    var query = "SELECT `id` FROM `eventChat`";
    query += " " + "WHERE `event_id`=" + db.escape(data.eventId);
    db.query(query, function(err, result){
        if(err) return cb({error: true, message: err});
        if(result && result.length){
            cb({error: false, eventChat: result[0].id})
        }else {
            //in case event is not yet registered for chatting
            exports.registerEventForChat({
                event_id: data.eventId
            }, function(resp){
                cb(resp);
            });
        }
    });
};

//will return 10 latest messages by eventChat_id
//providing last_message_id will return 10 messages
//prior to the last_message_id
exports.getEventMessages = function (data, cb){
    var query = "SELECT * FROM `eventMessages`";
    query += " " + "WHERE `eventChat_id`=" + db.escape(data.eventChat_id);

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


//Ignore this section .. this will be use later if personal messaging is available
//=================================================================================
//*                            ONE ON ONE CHAT                                    *
//=================================================================================


exports.startChat = function (data, cb){
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
    if(validator.isMissing(data.chatHead)){
        return cb({error: true, message: "Missing chatHead"});
    }
    var query = "INSERT INTO `chatMessages` SET ?";
    db.query(query, data, function (err, result){
        if(err) return cb({error: true, message: err});
        if(result.insertId > 0){
            socket.broadcast.to(data.chatHead).emit('newMessage', data);
            var connectedSockets = connected[data.to];
            console.log("CONNECTED SOCKET", connectedSockets);
            if(!connectedSockets || !connectedSockets.length){
                findDeviceTag({user_id: data.to}, function (err, tags){
                    if(tags && tags.length){
                        tags.forEach(function (tag){
                            pushController.sendPush(tag, data, function (resp){
                                console.log("PUSH", resp);
                            })
                        });
                    }
                })
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