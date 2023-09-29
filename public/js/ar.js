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

      const audioContext = new AudioContext();
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const oscillator = audioContext.createOscillator();

      oscillator.type = "square";
      oscillator.start()
      mediaStreamSource.connect(oscillator);
      oscillator.connect(mediaStreamDestination);

      const destinationTracks = mediaStreamDestination.stream.getAudioTracks();
      inboundStream.addTrack(destinationTracks[0]);
      maybeStart()
      remoteVideo.play();
    })
    .catch(console.log);

  localStream = inboundStream;



}
