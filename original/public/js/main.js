$(

  function() {
  
  var start = null;

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize varibles
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var $currentInput = $usernameInput.focus();

  var socket = io('http://localhost:3000');

  // OTR Messaging
  var buddy = new OTR();
  
  var $encryptButton = $('#eButton');
  var $encryptionState = $('#eState');
  var $verifyButton = $('#vButton');
  var $verifyState = $('#vState');

  // Sets the client's username
  function setUsername () {
    username = $usernameInput.val().trim();

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }
  
  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
  
    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }


  // Sends a chat message
  function sendMessage () {
    
    var message = $inputMessage.val();

    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      buddy.sendMsg(message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
      } else {
        setUsername();
      }
    }
  });


  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });


  // Socket events
var them = ''

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = " OTR Instant Messager – ";
    log(message, {
      prepend: true
    });
   // addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
      console.log('incoming', data);
      them = data.username;
      buddy.receiveMsg(data.message);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
  });


  // Buddy Events
  buddy.on('ui', function (msg, encrypted) {
    console.log("Msg is ",msg);
    data = {};
    data.username = them;
    data.message = msg;
    addChatMessage(data);

  });

  buddy.on('io', function (msg) {
    console.log("outgoing: " + msg);
    socket.emit('new message', msg);
  });

  buddy.on('status', function (state) {
    
    if (state === OTR.CONST.STATUS_AKE_SUCCESS) {
    
    time = (new Date()).getTime() - start;
    
    $('#eButton').hide();
    $('#ueButton').show();
    
    if(time < 10000)
      log('ake took ' + (time) + ' ms ');
    
    log('message state is ' + (buddy.msgstate ? 'encrypted' : 'plaintext' ));
    $('#eState').text(buddy.msgstate);
    }

    if(state  == OTR.CONST.STATUS_END_OTR){
      $('#eState').text(buddy.msgstate);
      $('#ueButton').hide();
      $('#eButton').show();
    }

  });

  buddy.on('smp', function (type, data) {
      
      switch (type) {
      case 'question':
      {
        var secret = prompt(" Bob wants to verify you using the socialist millionaire protocol. The question is '"+data+"'");
        buddy.smpSecret(secret);
        break
      }

      case 'trust':
      {
        console.log(data);
        $('#vState').text(buddy.trust);
        if (buddy.trust) {
        alert('trust established');
        }
        break;
      }

      default:
      throw new Error('Unknown type.')

    }

  });

  // Encrypt Button On Click
  $('#eButton').click(function (e) {
    start = new Date().getTime();
    e.preventDefault();
    buddy.sendQueryMsg();

  });

  $('#ueButton').click(function (e) {
    start = new Date().getTime();
    e.preventDefault();
    buddy.endOtr(function() {log('otr has ended');});

  });

  $('#vButton').click(function (e) {
    e.preventDefault();
    var smpSecret = prompt('Enter your shared secret');
    var smpQuestion = prompt('Enter your shared question, leave blank if not needed');
    buddy.smpSecret(smpSecret, smpQuestion);
  });


});
