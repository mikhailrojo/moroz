const initDeepAr = async () => {

  console.log({isInitiator});


  const deepAR = await deepar.initialize({
    licenseKey: 'f46f49ed78f2a4bfe2d6775a29be434a354fcbb433c8df4d785ef7cb99f092624d56cf84b58c8b9a',
    previewElement: document.querySelector('#deepar-div'),
    effect: 'https://cdn.jsdelivr.net/npm/deepar/effects/aviators',
  }).catch(error => {
    console.log(error);
  });

  deepAR.callbacks.onFaceVisibilityChanged = (args) => {
    // console.log(args); // true / false
  };

  const canvas = document.querySelector('canvas');
  const video = document.querySelector('#localVideo');
  console.log('my strem is ready')
  const arStream = canvas.captureStream();
  video.srcObject = arStream;
  localStream = arStream;
  maybeStart()

  video.play();
}
