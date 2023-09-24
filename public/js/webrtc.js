'use strict';

//Defining some global utility variables
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
let audioTrack = null;
let inboundStream = null;

//Initialize turn/stun server here
var pcConfig = turnConfig;

const localStreamConstraints = {
  audio: true,
  video: true
};


//Not prompting for room name
//var room = 'foo';

// Prompting for room name:
const room = prompt('Enter room name:');

//Initializing socket.io
const socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
}

// Эта новая команта
socket.on('created', function (room) {
  console.log('Created room ' + room);
  isInitiator = true;
  getMedia();
});

socket.on('full', function (room) {
  console.log('Room ' + room + ' is full');
});

socket.on('join', function (room) {
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  // кто-то еще сейчас присоединится!
  isChannelReady = true;
});

socket.on('joined', function (room) {
  console.log('joined: ' + room);
  // я присоединился к существующему каналу
  isChannelReady = true;
  getMedia();
});

socket.on('log', function (array) {
  console.log.apply(console, array);
});


//Driver code
socket.on('message', function (message, room) {
  console.log('Client received message:', message, room);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});


//Function to send message in a room
function sendMessage(message, room) {
  console.log('Client sending message: ', message, room);
  socket.emit('message', message, room);
}


//Displaying Local Stream and Remote Stream on webpage
const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');

//If found local stream
function gotStream(stream) {
  console.log({isInitiator})
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media', room);
  if (isInitiator) {
    maybeStart();
  }
}


console.log('Getting user media with constraints', localStreamConstraints);

//If initiator, create the peer connection
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady, isInitiator);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    localStream.getTracks().forEach(track => {

      // if (track.kind === 'video') return;
      // console.log('tracks \n\n')
      // console.log(track);
      console.log('adding a track', track);
      pc.addTrack(track, localStream)
    })
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

//Sending bye if user closes the window
window.onbeforeunload = function () {
  sendMessage('bye', room);
};


//Creating peer connection
function createPeerConnection() {
  console.log('createPeerConnection', pcConfig);
  try {

    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.ontrack = handleTrackAdded;
    pc.onstream = () => alert('stream!!!');
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

//Function to handle Ice candidates
function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }, room);
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription, room);
}

// function onCreateSessionDescriptionError(error) {
//   trace('Failed to create session description: ' + error.toString());
// }


function handleTrackAdded(ev) {
console.log('\n\n handleTrackAdded \n\n', ev);


  if (ev.streams && ev.streams[0]) {
    remoteVideo.srcObject = ev.streams[0];

    console.log(remoteVideo.srcObject.getTracks());
  } else {
    if (!inboundStream) {
      inboundStream = new MediaStream();
      remoteVideo.srcObject = inboundStream;
    }
    inboundStream.addTrack(ev.track);
  }
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye', room);
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}



function getMedia () {
  if (isInitiator) {
    return initDeepAr();
  }

  navigator.mediaDevices.getUserMedia(localStreamConstraints)
    .then(gotStream)
    .catch(function (e) {
      alert('getUserMedia() error: ' + e.name);
    });
}
