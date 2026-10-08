const startBtn = document.getElementById('startBtn');
const markBtn = document.getElementById('markBtn');
const finishBtn = document.getElementById('finishBtn');
const transcriptEl = document.getElementById('transcript');
const statusEl = document.getElementById('status');
const stateText = document.getElementById('stateText');
const timerEl = document.getElementById('timer');
const dotEl = document.getElementById('dot');
const courseEl = document.getElementById('course');

const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 12;
const OVERLAP_SECONDS = 1.5;
const MIN_SEGMENT_SECONDS = 1.2;

const STORAGE_KEY = 'class-transcribe-draft-v1';

let recognizer = null;

let audioCtx = null;
let micSource = null;
let processor = null;
let micStream = null;

let recording = false;
let started = false;

let nativeSampleRate = SAMPLE_RATE;

let chunks = [];
let bufferedSamples = 0;

let queue = [];
let processing = false;

let segments = [];
let previousRawText = '';

let accumulatedMs = 0;
let recordingStartedAt = 0;

let wakeLock = null;

Module = {};

Module.locateFile = function(path, scriptDirectory = '') {
  return scriptDirectory + path;
};

Module.setStatus = function(status) {
  if (status === 'Running...') {
    status = '模型已下载，正在初始化…';
  }

  const match =
    status.match(/Downloading data... \((\d+)\/(\d+)\)/);

  if (match) {
    const done = BigInt(match[1]);
    const total = BigInt(match[2]);

    const pct =
      total === 0n
        ? 0
        : Number((done * 10000n) / total) / 100;

    status = `首次下载模型 ${pct.toFixed(1)}%`;
  }

  if (status) statusEl.textContent = status;
};

function initRecognizer() {
  recognizer = new OfflineRecognizer({
    modelConfig: {
      debug: 0,
      tokens: './tokens.txt',
      paraformer: {
        model: './paraformer.onnx'
      }
    }
  }, Module);
}

Module.onRuntimeInitialized = function() {
  initRecognizer();

  statusEl.textContent = '模型已就绪';
  stateText.textContent = '等待开始';
  startBtn.disabled = false;

  restoreDraft();
};

function downsample(input, targetRate) {
  if (nativeSampleRate === targetRate) {
    return new Float32Array(input);
  }

  const ratio = nativeSampleRate / targetRate;
  const len = Math.round(input.length / ratio);
  const out = new Float32Array(len);

  let outIndex = 0;
  let inIndex = 0;

  while (outIndex < len) {
    const next = Math.round((outIndex + 1) * ratio);

    let total = 0;
    let count = 0;

    for (
      let i = inIndex;
      i < next && i < input.length;
      i++
    ) {
      total += input[i];
      count++;
    }

    out[outIndex] = count ? total / count : 0;

    outIndex++;
    inIndex = next;
  }

  return out;
}

function flatten(parts) {
  let len = 0;
  for (const p of parts) len += p.length;

  const out = new Float32Array(len);

  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }

  return out;
}

function clockTime() {
  const d = new Date();

  return [
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0')
  ].join(':');
}

function elapsedMs() {
  return accumulatedMs +
    (recording ? Date.now() - recordingStartedAt : 0);
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0')
  ].join(':');
}

setInterval(() => {
  timerEl.textContent = formatDuration(elapsedMs());
}, 1000);

function removeOverlap(previous, current) {
  if (!previous || !current) return current;

  const max = Math.min(45, previous.length, current.length);

  for (let n = max; n >= 2; n--) {
    const suffix = previous.slice(-n);
    const prefix = current.slice(0, n);

    if (suffix === prefix) {
      return current.slice(n).trim();
    }
  }

  return current;
}

function saveDraft() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      course: courseEl.value,
      segments,
      accumulatedMs: elapsedMs(),
      savedAt: new Date().toISOString()
    })
  );
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const draft = JSON.parse(raw);

    if (Array.isArray(draft.segments)) {
      segments = draft.segments;
    }

    if (draft.course) {
      courseEl.value = draft.course;
    }

    if (Number.isFinite(draft.accumulatedMs)) {
      accumulatedMs = draft.accumulatedMs;
    }

    renderTranscript();
  } catch (e) {
    console.warn('恢复课堂草稿失败', e);
  }
}

function renderTranscript() {
  if (!segments.length) {
    transcriptEl.innerHTML =
      '<div class="empty">课堂文字会出现在这里</div>';
    return;
  }

  transcriptEl.innerHTML = '';

  for (const item of segments) {
    const row = document.createElement('div');

    row.className =
      'line' + (item.important ? ' important' : '');

    const time = document.createElement('div');
    time.className = 'time';
    time.textContent = item.time;

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = item.text;

    row.appendChild(time);
    row.appendChild(text);

    transcriptEl.appendChild(row);
  }

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
}

function addResult(rawText, time) {
  const raw = String(rawText || '').trim();
  if (!raw) return;

  const cleaned = removeOverlap(previousRawText, raw);

  previousRawText = raw;

  if (!cleaned) return;

  segments.push({
    time,
    text: cleaned,
    important: false
  });

  saveDraft();
  renderTranscript();
}

async function processQueue() {
  if (processing) return;

  processing = true;

  while (queue.length) {
    const item = queue.shift();

    statusEl.textContent =
      `正在识别 ${item.seconds.toFixed(0)} 秒语音…`;

    try {
      const stream = recognizer.createStream();

      stream.acceptWaveform(
        SAMPLE_RATE,
        item.samples
      );

      recognizer.decode(stream);

      const result = recognizer.getResult(stream);

      stream.free();

      addResult(result.text, item.time);
    } catch (e) {
      console.error('识别失败', e);
      statusEl.textContent = '某一段识别失败，已继续记录';
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  processing = false;

  if (recording) {
    statusEl.textContent = '持续转写中';
  } else if (started) {
    statusEl.textContent = '已暂停';
  }
}

function cutSegment(flush = false) {
  if (!bufferedSamples) return;

  const all = flatten(chunks);

  if (
    all.length <
    SAMPLE_RATE * MIN_SEGMENT_SECONDS
  ) {
    if (flush) {
      chunks = [];
      bufferedSamples = 0;
    }
    return;
  }

  queue.push({
    samples: all,
    time: clockTime(),
    seconds: all.length / SAMPLE_RATE
  });

  if (flush) {
    chunks = [];
    bufferedSamples = 0;
  } else {
    const overlap =
      Math.floor(SAMPLE_RATE * OVERLAP_SECONDS);

    const start =
      Math.max(0, all.length - overlap);

    const tail = all.slice(start);

    chunks = [tail];
    bufferedSamples = tail.length;
  }

  processQueue();
}

async function initMicrophone() {
  if (micStream) return;

  micStream =
    await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

  audioCtx = new AudioContext();

  nativeSampleRate = audioCtx.sampleRate;

  micSource =
    audioCtx.createMediaStreamSource(micStream);

  processor =
    audioCtx.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (event) => {
    if (!recording) return;

    const input =
      event.inputBuffer.getChannelData(0);

    const samples =
      downsample(input, SAMPLE_RATE);

    chunks.push(samples);
    bufferedSamples += samples.length;

    if (
      bufferedSamples >=
      SAMPLE_RATE * CHUNK_SECONDS
    ) {
      cutSegment(false);
    }
  };

  micSource.connect(processor);
  processor.connect(audioCtx.destination);
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock =
        await navigator.wakeLock.request('screen');
    }
  } catch (e) {
    console.warn('无法保持常亮', e);
  }
}

async function beginRecording() {
  await initMicrophone();
  await audioCtx.resume();

  if (!started) {
    started = true;
    accumulatedMs = 0;
    segments = [];
    previousRawText = '';
    chunks = [];
    bufferedSamples = 0;
  }

  recordingStartedAt = Date.now();
  recording = true;

  dotEl.classList.add('active');
  stateText.textContent = '正在记录';
  statusEl.textContent = '持续转写中';

  startBtn.textContent = '暂停';
  markBtn.disabled = false;
  finishBtn.disabled = false;

  await requestWakeLock();
}

function pauseRecording() {
  if (!recording) return;

  accumulatedMs +=
    Date.now() - recordingStartedAt;

  recording = false;

  cutSegment(true);

  dotEl.classList.remove('active');
  stateText.textContent = '已暂停';
  statusEl.textContent = '正在处理最后一段…';

  startBtn.textContent = '继续';

  saveDraft();
}

startBtn.onclick = async function() {
  try {
    if (recording) {
      pauseRecording();
    } else {
      await beginRecording();
    }
  } catch (e) {
    console.error(e);
    statusEl.textContent =
      '无法打开麦克风，请检查浏览器权限';
  }
};

markBtn.onclick = function() {
  if (!segments.length) {
    statusEl.textContent =
      '还没有识别出的文字可以标记';
    return;
  }

  segments[segments.length - 1].important = true;

  saveDraft();
  renderTranscript();

  statusEl.textContent = '已标记最近一段为重点';
};

function buildExport() {
  const title =
    courseEl.value.trim() || '课堂记录';

  const date =
    new Date().toLocaleDateString('zh-CN');

  const body = segments.map(item => {
    return `${item.important ? '★ ' : ''}[${item.time}] ${item.text}`;
  }).join('\n\n');

  const important = segments
    .filter(item => item.important)
    .map(item => `- [${item.time}] ${item.text}`)
    .join('\n');

  return `# ${title}

日期：${date}
记录时长：${formatDuration(elapsedMs())}

## 课堂原文

${body}

## 标记重点

${important || '暂无'}

## AI 整理建议

请根据以上课堂记录整理：
1. 今天老师主要讲了什么
2. 核心概念与定义
3. 老师举出的案例
4. 重点与可能的考试内容
5. 课后需要进一步查证或复习的内容`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    const box = document.createElement('textarea');

    box.value = text;
    box.style.position = 'fixed';
    box.style.opacity = '0';

    document.body.appendChild(box);

    box.select();

    const ok = document.execCommand('copy');

    box.remove();

    return ok;
  }
}

finishBtn.onclick = async function() {
  if (recording) {
    accumulatedMs +=
      Date.now() - recordingStartedAt;

    recording = false;
  }

  cutSegment(true);

  dotEl.classList.remove('active');
  stateText.textContent = '正在结束';

  if (micStream) {
    micStream.getTracks().forEach(track =>
      track.stop()
    );
  }

  if (audioCtx) {
    try {
      await audioCtx.close();
    } catch (_) {}
  }

  while (processing || queue.length) {
    await new Promise(resolve =>
      setTimeout(resolve, 150)
    );
  }

  saveDraft();

  const ok =
    await copyText(buildExport());

  stateText.textContent = '课堂记录完成';
  statusEl.textContent =
    ok
      ? '全文已复制，可以直接粘贴给 AI'
      : '课堂已保存，但自动复制失败';

  startBtn.disabled = true;
  markBtn.disabled = true;
  finishBtn.disabled = true;

  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch (_) {}
  }
};

courseEl.addEventListener('input', saveDraft);

document.addEventListener(
  'visibilitychange',
  async () => {
    if (
      document.visibilityState === 'visible' &&
      recording &&
      !wakeLock
    ) {
      await requestWakeLock();
    }
  }
);