const initDeepAr = async () => {

  const canvas = document.querySelector('canvas');
  const deepAR = await deepar.initialize({
    canvas,
    licenseKey: 'f46f49ed78f2a4bfe2d6775a29be434a354fcbb433c8df4d785ef7cb99f092624d56cf84b58c8b9a',
    // effect: 'https://cdn.jsdelivr.net/npm/deepar/effects/Shoe',
    effect: 'model/santa.deepar',
  }).catch(error => {
    console.log(error);
  });

  deepAR.callbacks.onFaceVisibilityChanged = (isVisible) => {
    console.log({isVisible, localStream});
    localStream && localStream.getTracks().forEach(track => {
      track.enabled = isVisible;
    })
  }
  await deepAR.backgroundReplacement(true, 'images/bg.jpeg');

  const remoteVideo = document.querySelector('#localVideo');
  const arStream = canvas.captureStream();

  const inboundStream = new MediaStream();
  remoteVideo.srcObject = inboundStream;
  inboundStream.addTrack(arStream.getTracks()[0]);

  navigator.mediaDevices.getUserMedia({audio: true, video: true})
    .then((stream) => {

      const audioCtx = new AudioContext();
      const mediaStreamSource = audioCtx.createMediaStreamSource(stream);
      const mediaStreamDestination = audioCtx.createMediaStreamDestination();

      const filter = getFilter(audioCtx);
      mediaStreamSource.connect(filter);
      filter.connect(mediaStreamDestination);
      const destinationTracks = mediaStreamDestination.stream.getAudioTracks();




      // const destinationTracks = stream.getAudioTracks();


      inboundStream.addTrack(destinationTracks[0]);
      maybeStart()
      remoteVideo.play();
    })
    .catch(console.log);

  localStream = inboundStream;
}

const hannWindow = function (length) {

  var window = new Float32Array(length);
  for (var i = 0; i < length; i++) {
    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
  }
  return window;
};

const getFilter = (audioContext) => {
  const grainSize = 256;
  const pitchRatio = 0.8;
  const overlapRatio = 0;

  const pitchShifterProcessor = audioContext.createScriptProcessor(grainSize, 1, 1);
  pitchShifterProcessor.buffer = new Float32Array(grainSize * 2);
  pitchShifterProcessor.grainWindow = hannWindow(grainSize);

  pitchShifterProcessor.onaudioprocess = function (event) {

    var inputData = event.inputBuffer.getChannelData(0);
    var outputData = event.outputBuffer.getChannelData(0);

    for (i = 0; i < inputData.length; i++) {

      // Apply the window to the input buffer
      inputData[i] *= this.grainWindow[i];

      // Shift half of the buffer
      this.buffer[i] = this.buffer[i + grainSize];

      // Empty the buffer tail
      this.buffer[i + grainSize] = 0.0;
    }

    // Calculate the pitch shifted grain re-sampling and looping the input
    var grainData = new Float32Array(grainSize * 2);
    for (var i = 0, j = 0.0;
         i < grainSize;
         i++, j += pitchRatio) {

      var index = Math.floor(j) % grainSize;
      var a = inputData[index];
      var b = inputData[(index + 1) % grainSize];
      grainData[i] += linearInterpolation(a, b, j % 1.0) * this.grainWindow[i];
    }

    // Copy the grain multiple times overlapping it
    for (i = 0; i < grainSize; i += Math.round(grainSize * (1 - overlapRatio))) {
      for (j = 0; j <= grainSize; j++) {
        this.buffer[i + j] += grainData[j];
      }
    }

    // Output the first half of the buffer
    for (i = 0; i < grainSize; i++) {
      outputData[i] = this.buffer[i];
    }
  };

  return pitchShifterProcessor;
}


const linearInterpolation = function (a, b, t) {
  return a + (b - a) * t;
};

