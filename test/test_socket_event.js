/**
 * Created by root on 6/23/16.
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

describe('Test event chat', function (){
    var client1Url1 = socketUrl + '?id=' + user_1.id + '&tag=' + user_1.tag;
    var client1Url2 = socketUrl + '?id=' + user_2.id + '&tag=' + user_2.tag;
    var client1 = io.connect(client1Url1, options);
    var client2 = io.connect(client1Url2, options);
    var eventId = '8uyhgnx0fgxx-hg56';
    var eventChat_id;

    it('Register event in socket', function (done) {
        client1.emit('registerEvent', {event_id: eventId, user_id: user_1.id}, function (resp){
            resp.should.have.property('error').eql(false);
            resp.should.have.property('eventChat');
            eventChat_id = resp.eventChat;
            done();
        })
    });

    it('Adding user to event chat', function (done){
        client2.emit('addUserToEvent', {
            user_id: user_2.id,
            eventChat: eventChat_id
        }, function (resp){
            resp.should.have.property('error').eql(false);
            resp.should.have.property('message').eql("success");
            done();
        });
    });
    it('Sending message to an event', function (done){
        done();
    })
});