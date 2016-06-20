/**
 * Created by root on 6/19/16.
 */

var should  = require('should');
var io      = require('socket.io-client');

var user_1 = {
    id: '1yht0_i35gHo',
    name: 'Bernard Glen Gumayao',
    tag: 'sample_tag_1yht0_i35gHo'
};

var user_2 = {
    id: '89fmng0Tyx-hj45x',
    name: 'Rubberdont Codemagnus',
    tag: 'sample_tag_89fmng0Tyx-hj45x'
};

var socketUrl = 'http://localhost:3000';

var options = {
    transport : ['websocket'],
    'force new connection': true
};

describe('Test Server', function (){
    var client1Url1 = socketUrl + '?id=' + user_1.id + '&tag=' + user_1.tag;
    var client1Url2 = socketUrl + '?id=' + user_2.id + '&tag=' + user_2.tag;
    var client1 = io.connect(client1Url1, options);
    var client2 = io.connect(client1Url2, options);
    var chatHead_id = '10';

    it('Starting Chat', function (done){
        client1.emit('startChat', {
            users:[user_1.id, user_2.id]
        }, function (resp){
            should.exist(resp);
            resp.should.have.property('chatHead');

            client2.emit('startChat', {
                users:[user_2.id, user_1.id]
            }, function (resp){
                console.log(resp);
                should.exist(resp);
                resp.should.have.property('chatHead');
                chatHead_id = resp.chatHead;
            });
        });

        done();
    });

    it('Sending message', function (done){
        var user1MsgData = {
            name: user_1.name,
            chatHead: chatHead_id,
            message: 'test message from user_1 to user_2',
            to: user_2.id,
            from: user_1.id
        };
        var user2MsgData = {
            chatHead: chatHead_id,
            name: user_2.name,
            message: 'test message from user_2 to user_1',
            to: user_1.id,
            from: user_2.id
        };
        var checkMessages = function (){
            client1.on('newMessage', function (msg){
                msg.chatHead.should.eql(chatHead_id);
                msg.from.should.eql(user_2.id);
            });
            client2.on('newMessage', function (msg){
                msg.chatHead.should.eql(chatHead_id);
                msg.from.should.eql(user_1.id);
            });

        };

        checkMessages();
        client1.emit('sendMessage', user1MsgData, function (resp){
        });
        client2.emit('sendMessage', user2MsgData, function (resp){
        });

        done();
    });

    it('Retrieving inbox', function (done){
        client1.emit('getUserInbox', {id: user_1.id}, function (resp){
            console.log(resp);
            done();
        });
    });

    it('Retrieving messages', function (done){
        var finishTest = function (){
            client1.emit('leave_chat', {chatHead: chatHead_id});
            client2.emit('leave_chat', {chatHead: chatHead_id});
            client1.disconnect();
            client2.disconnect();
            done();
        };
        client1.emit('getMessages', {chatHead: chatHead_id}, function (resp){
            if(resp.hasNext === true){
                client1.emit('getMessages',
                    {
                        chatHead: chatHead_id,
                        last_message_id: resp.messages[resp.messages.length - 1].id
                    }, function (resp){
                    });
            }
            setTimeout(finishTest, 3000);
        });
    });
});
