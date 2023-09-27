const initDeepAr = async () => {

  console.log({isInitiator});
  const canvas = document.querySelector('canvas');


  const deepAR = await deepar.initialize({
    canvas,
    licenseKey: 'f46f49ed78f2a4bfe2d6775a29be434a354fcbb433c8df4d785ef7cb99f092624d56cf84b58c8b9a',
    // previewElement: document.querySelector('#deepar-div'),
    effect: 'https://cdn.jsdelivr.net/npm/deepar/effects/aviators',
  }).catch(error => {
    console.log(error);
  });

  await deepAR.backgroundReplacement(true, 'images/bg.jpeg');


  const remoteVideo = document.querySelector('#localVideo');
  console.log('my strem is ready')
  const arStream = canvas.captureStream();

  const inboundStream = new MediaStream();
  remoteVideo.srcObject = inboundStream;
  inboundStream.addTrack(arStream.getTracks()[0]);

  navigator.mediaDevices.getUserMedia({audio: true, video: true})
    .then((stream) => {
      const audioStream = stream.getAudioTracks();
      console.log(audioStream);
      inboundStream.addTrack(audioStream[0]);
      maybeStart()
      remoteVideo.play();
    })
    .catch(function (e) {
      console.error('getUserMedia() error: ' + e);
    });

  localStream = inboundStream;



}
