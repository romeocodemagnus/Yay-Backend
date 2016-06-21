var chatController = require("./chatController");
module.exports = function (io){
    /**
     * @api {ON} connect Connecting to socket
     * @apiVersion 0.1.0
     * @apiName Socket connect
     * @apiGroup Chat
     * @apiDescription Connecting to socket will require some data that will be appended in the url as query (e.g. http://socket_url:3000?id=(user_id)&tag=(device tag))
     *
     * @apiParam {String} id User id
     * @apiParam {String} tag device tag
     */

  io.on('connect', function (socket){
      var handshake = socket.handshake.query;
      if(handshake.id && handshake.tag){
          chatController.connect({
              id: handshake.id ? handshake.id : "",
              tag: handshake.tag ? handshake.tag : "",
              socketId: socket.id ? socket.id : ""
          });
      }else{
          socket.disconnect();
          console.log("DISCONNETED");
          return;
      }
      /**
       * @api {emit} startChat Starting chat with another user
       * @apiVersion 0.1.0
       * @apiName Socket start
       * @apiGroup Chat
       *
       * @apiParam {Array} users Array of users id
       * @apiSuccess {Boolean} error=false Value will be true/false
       * @apiSuccess {String} chatHead Conversation Id
       * @apiSuccessExample Acknowledgement:
       *    {
       *        error: false,
       *        chatHead: 10
       *    }
       *
       * @apiError error=true
       */
      socket.on('startChat', function (data, ack){
          chatController.startChat(data, function (resp){
              if(resp.chatHead)
                  socket.join(resp.chatHead);

              console.log(resp);
              ack(resp);
          })
      });

      /**
       * @api {emit} sendMessage Send message to chatmate
       * @apiVersion 0.1.0
       * @apiName Socket send
       * @apiGroup Chat
       *
       * @apiDescription  This will send messages to user chatmate
       *
       * @apiParam {JSON} -JsonObject/NSDictionary- data type
       * @apiParam {String} JsonObject.chatHead id(chatHead) you got from EMIT 'startChat' or in INBOX
       * @apiParam {String} JsonObject.name Sender name
       * @apiParam {String} JsonObject.message Sender message
       * @apiParam {String} JsonObject.to Receiver id
       * @apiParam {String} JsonObject.from Sender id
       *
       *
       * @apiSuccess {JSON} -JsonObject/NSDictionary- data type
       * @apiSuccess {String} JsonObject.chatHead id(chatHead) you got from EMIT 'startChat' or in INBOX
       * @apiSuccess {String} JsonObject.name Sender name
       * @apiSuccess {String} JsonObject.message Sender message
       * @apiSuccess {String} JsonObject.to Receiver id
       * @apiSuccess {String} JsonObject.from Sender id
       *
       * @apiSuccessExample Acknowledgement:
       *    {
       *        chatHead: 10,
       *        name: 'sample name'
       *        message: 'sample message'
       *        to: 2
       *        from: 1
       *    }
       *
       *  @apiErrorExample Acknowledgement:
       *    {
       *        error: true,
       *        message: 'Sending failed'
       *    }
       *
       */
      socket.on('sendMessage', function (data, ack){
          chatController.saveMessage(socket, data, function (resp){
              console.log("SEND MESSAGE");
              console.log(resp);
              ack(resp);
          })
      });


      /**
       * @api {on} newMessage Receive message
       * @apiVersion 0.1.0
       * @apiName Socket receive
       * @apiGroup Chat
       *
       * @apiDescription  This will listen and receive messages from user chatmate
       *
       * @apiSuccess {JSON} -JsonObject/NSDictionary- data type
       * @apiSuccess {String} JsonObject.chatHead id(chatHead) you got from EMIT 'startChat' or in INBOX
       * @apiSuccess {String} JsonObject.name Sender name
       * @apiSuccess {String} JsonObject.message Sender message
       * @apiSuccess {String} JsonObject.to Receiver id
       * @apiSuccess {String} JsonObject.from Sender id
       *
       * @apiSuccessExample Acknowledgement:
       *    {
       *        chatHead: 10,
       *        name: 'sample name'
       *        message: 'sample message'
       *        to: 2
       *        from: 1
       *    }
       *
       */


      /**
       * @api {emit} getMessages Get messages
       * @apiVersion 0.1.0
       * @apiName Socket get
       * @apiGroup Chat
       *
       * @apiDescription  This will return the messages for specific chatHead ID
       *
       * @apiParam {JSON} -JsonObject/NSDictionary- data type
       * @apiParam {String} a.chatHead chatHead id
       * @apiParam {String} [a.last_message_id] required if fetching another set of messages in a specific chatHead id
       *
       * @apiSuccess {JSON} messages Container of messages
       * @apiSuccess {Array} messages.-JsonArray- data type -- array of messages
       * @apiSuccess {JSON} messages.JsonArray.-JsonObject- data type per array
       * @apiSuccess {String} messages.JsonArray.JsonObject.chatHead id(chatHead) you got from EMIT 'startChat' or in INBOX
       * @apiSuccess {String} messages.JsonArray.JsonObject.name Sender name
       * @apiSuccess {String} messages.JsonArray.JsonObject.message Sender message
       * @apiSuccess {String} messages.JsonArray.JsonObject.to Receiver id
       * @apiSuccess {String} messages.JsonArray.JsonObject.from Sender id
       * @apiSuccess {Date} messages.JsonArray.JsonObject.created date
       *
       * @apiSuccess {Boolean} hasNext indicator if there's more messages to fetch
       *
       * @apiSuccessExample Acknowledgement:
       * {
       *    messages: [
       *        {
       *            chatHead: 10,
       *            name: 'sample name'
       *            message: 'sample message'
       *            to: 1,
       *            from: 2
       *        },
       *        {
       *            chatHead: 10,
       *            name: 'sample name'
       *            message: 'sample message'
       *            to: 1,
       *            from: 2
       *        }
       *    ]
       *    hasNext: true/false
       *}
       *
       *  @apiErrorExample Acknowledgement:
       *    {
       *        error: true,
       *        message: 'Sending failed'
       *    }
       *
       */
      socket.on('getMessages', function (data, ack){
          chatController.getMessages(data, function (resp){
              ack(resp);
          })
      });

      /**
       * @api {emit} markAsRead Mark as read
       * @apiVersion 0.1.0
       * @apiName Socket mark
       * @apiGroup Chat
       *
       * @apiDescription  Marking messages as read to appear read/seen
       *
       * @apiParam {String} id last message id of chatmate message
       * @apiParam {String} chatMateId chatmate ID
       * @apiSuccess {Boolean} error=false Value will be true/false
       * @apiSuccessExample Acknowledgement:
       *    {
       *        error: false
       *    }
       *
       */
      socket.on('markAsRead', function (data, ack){
          chatController.markAsRead(data, function(resp){
              ack(resp);
          })
      });


      /**
       * @api {emit} getUserInbox Get user inbox
       * @apiVersion 0.1.0
       * @apiName Socket get inbox
       * @apiGroup Chat
       *
       * @apiDescription This return user converstions
       *
       * @apiParam {JSON} -JsonObject/NSDictionary- data type
       * @apiParam {String} a.id user id
       *
       * @apiSuccess {Array} -JsonArray- data type -- array of conversation
       * @apiSuccess {JSON} JsonArray.-JsonObject- data type per array
       * @apiSuccess {String} JsonArray.JsonObject.chatHead id(chatHead) you got from EMIT 'startChat' or in INBOX
       * @apiSuccess {String} JsonArray.JsonObject.name Sender name
       * @apiSuccess {String} JsonArray.JsonObject.message Sender message
       * @apiSuccess {String} JsonArray.JsonObject.to Receiver id
       * @apiSuccess {String} JsonArray.JsonObject.from Sender id
       * @apiSuccess {Date} JsonArray.JsonObject.created date
       *
       * @apiSuccess {Boolean} hasNext indicator if there's more messages to fetch
       *
       * @apiSuccessExample Acknowledgement:
       * [
       *    {
       *        id: 10,
       *        user_1: 1
       *        user_2: 2
       *        created: '2016-06-19T02:13:52.000Z',
       *        last_message: {
       *            id: 60,
       *            chatHead: 10,
       *            name: 'sample name'
       *            message: 'sample message',
       *            to: 1,
       *            from: 2,
       *            created: '2016-06-20T08:55:00.000Z',
       *            status: 'unread'
       *        }
       *     }
       * ]
       *
       * @apiError {Array} Empty It will return empry array
       * @apiErrorExample Acknowledgement:
       *  []
       */
      socket.on('getUserInbox', function (data, ack){
          chatController.getUserInbox(data, function(resp){
              console.log(resp);
              ack(resp);
          })
      });

      /**
       * @api {emit} leave_chat Leaving chat page
       * @apiVersion 0.1.0
       * @apiName Socket leave
       * @apiGroup Chat
       *
       * @apiDescription This will stop socket from listening in newMessages from a specific chatroom/page
       *
       * @apiParam {JsonObject} -JsonObject- data type
       * @apiParam {String} JsonObject.chatHead chatHead id
       */
      socket.on('leave_chat', function (data){
          socket.leave(data.chatHead);
          console.log(socket.id + " leaving room " + data.chatHead);
      });

      /**
       * @api {emit} Typing Typing status
       * @apiVersion 0.1.0
       * @apiName Socket typing
       * @apiGroup Chat
       *
       * @apiDescription This will inform other user that their chatmate is typing
       *
       * @apiParam {JsonObject} -JsonObject- data type
       * @apiParam {String} JsonObject.chatHead chatHead id
       * @apiParam {Boolean}  JsonObject.isTyping true/false
       */
      socket.on('typing', function (data){
          socket.broadcats.to(data.chatHead).emit('isTyping', { isTyping: data.isTyping });
      });

      /**
       * @api {emit} Logout Logout user
       * @apiVersion 0.1.0
       * @apiName Socket logout
       * @apiGroup Chat
       *
       * @apiDescription This will logout and remove user socket session
       *
       * @apiParam {JsonObject} -JsonObject- Just pass an empty jsonObject/NSDictionary
       */
      socket.on("logout", function (data, ack){
          chatController.deleteTag({
              id: handshake.id ? handshake.id : "",
              tag : handshake.tag ? handshake.tag : ""
          }, function (resp){
              ack(resp);
          })
      });
      socket.on('disconnect', function (){
          console.log(socket.id + " disconnect");
          chatController.logout({
              id: handshake.id ? handshake.id : "",
              socketId: socket.id ? socket.id : ""
          })
      });
  });
};