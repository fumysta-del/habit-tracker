const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const soundClips = document.getElementById('sound-clips');
const textArea = document.getElementById('results');

Module = {};

let audioCtx = null;
let mediaStream = null;
let recorder = null;
let recognizer = null;

const expectedSampleRate = 16000;
let recordSampleRate = 16000;

let recording = false;
let recordedChunks = [];

Module.locateFile = function(path, scriptDirectory = '') {
  return scriptDirectory + path;
};

Module.setStatus = function(status) {
  const statusElement = document.getElementById('status');

  if (status === 'Running...') {
    status = 'Model downloaded. Initializing recognizer...';
  }

  const downloadMatch = status.match(/Downloading data... \((\d+)\/(\d+)\)/);

  if (downloadMatch) {
    const downloaded = BigInt(downloadMatch[1]);
    const total = BigInt(downloadMatch[2]);
    const percent =
        total === 0 ? 0 : Number((downloaded * 10000n) / total) / 100;

    status = `Downloading model... ${percent.toFixed(2)}%`;
  }

  statusElement.textContent = status;
  statusElement.style.display = status ? 'block' : 'none';

  document.querySelectorAll('.tab-content').forEach((el) => {
    if (status) el.classList.add('loading');
    else el.classList.remove('loading');
  });

  document.querySelectorAll('.tab-content').forEach((el) => {
    if (status) el.classList.add('loading');
    else el.classList.remove('loading');
  });
};

function initOfflineRecognizer() {
  const config = {
    modelConfig: {
      debug: 1,
      tokens: './tokens.txt',
      paraformer: {
        model: './paraformer.onnx',
      },
    },
  };

  recognizer = new OfflineRecognizer(config, Module);
}

Module.onRuntimeInitialized = function() {
  console.log('WASM initialized');

  initOfflineRecognizer();

  startBtn.disabled = false;
  stopBtn.disabled = true;

  Module.setStatus('');

  if (window.parent !== window) {
    window.parent.postMessage({ type: 'voice-asr-ready' }, window.location.origin);
  }
};

clearBtn.onclick = function() {
  textArea.value = '';
};

function flattenFloat32(chunks) {
  let total = 0;

  for (const chunk of chunks) {
    total += chunk.length;
  }

  const result = new Float32Array(total);

  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function downsampleBuffer(buffer, exportSampleRate) {
  if (exportSampleRate === recordSampleRate) {
    return new Float32Array(buffer);
  }

  const sampleRateRatio = recordSampleRate / exportSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    const nextOffsetBuffer =
        Math.round((offsetResult + 1) * sampleRateRatio);

    let accum = 0;
    let count = 0;

    for (
      let i = offsetBuffer;
      i < nextOffsetBuffer && i < buffer.length;
      i++
    ) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;

    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function toWav(samples) {
  const int16 = new Int16Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    int16[i] = s < 0 ? s * 32768 : s * 32767;
  }

  const buf = new ArrayBuffer(44 + int16.length * 2);
  const view = new DataView(buf);

  view.setUint32(0, 0x46464952, true);
  view.setUint32(4, 36 + int16.length * 2, true);
  view.setUint32(8, 0x45564157, true);
  view.setUint32(12, 0x20746d66, true);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, expectedSampleRate, true);
  view.setUint32(28, expectedSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x61746164, true);
  view.setUint32(40, int16.length * 2, true);

  let offset = 44;

  for (let i = 0; i < int16.length; i++) {
    view.setInt16(offset, int16[i], true);
    offset += 2;
  }

  return new Blob([view], {type: 'audio/wav'});
}

async function initMicrophone() {
  if (mediaStream) {
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({audio: true});

  audioCtx = new AudioContext();

  recordSampleRate = audioCtx.sampleRate;

  mediaStream = audioCtx.createMediaStreamSource(stream);

  recorder = audioCtx.createScriptProcessor(4096, 1, 1);

  recorder.onaudioprocess = function(e) {
    if (!recording) {
      return;
    }

    let samples =
        new Float32Array(e.inputBuffer.getChannelData(0));

    samples = downsampleBuffer(samples, expectedSampleRate);

    recordedChunks.push(samples);
  };

  mediaStream.connect(recorder);
  recorder.connect(audioCtx.destination);
}

startBtn.onclick = async function() {
  await initMicrophone();

  recordedChunks = [];
  recording = true;

  textArea.value = 'Recording...';

  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = function() {
  recording = false;

  startBtn.disabled = false;
  stopBtn.disabled = true;

  const samples = flattenFloat32(recordedChunks);

  if (samples.length === 0) {
    textArea.value = 'No audio recorded.';
    return;
  }

  textArea.value = 'Recognizing...';

  const stream = recognizer.createStream();

  stream.acceptWaveform(expectedSampleRate, samples);

  recognizer.decode(stream);

  const result = recognizer.getResult(stream);

  stream.free();

  textArea.value = result.text || '(No speech recognized)';

  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'voice-asr-result',
      text: result.text || ''
    }, window.location.origin);
  }

  const clipContainer = document.createElement('article');
  const audio = document.createElement('audio');
  const label = document.createElement('p');
  const deleteButton = document.createElement('button');

  audio.controls = true;
  audio.src = URL.createObjectURL(toWav(samples));

  label.textContent =
      `${(samples.length / expectedSampleRate).toFixed(2)} s`;

  deleteButton.textContent = 'Delete';

  deleteButton.onclick = function() {
    clipContainer.remove();
  };

  clipContainer.appendChild(audio);
  clipContainer.appendChild(label);
  clipContainer.appendChild(deleteButton);

  soundClips.appendChild(clipContainer);

  recordedChunks = [];
};



window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === 'voice-asr-start') {
    if (!startBtn.disabled) startBtn.click();
  }

  if (event.data?.type === 'voice-asr-stop') {
    if (!stopBtn.disabled) stopBtn.click();
  }
});