// tilt_timer.js

class TiltTimer {
  constructor(team) {
    this.timerRunning = false;
    this.startTime = 0;
    this.totalTime = 0;
    this.records = [];
    this.team = team;
  }

  startStopTimer() {
    if (!this.timerRunning) {
      this.timerRunning = true;
      this.startTime = Date.now();
      this.records.push({ time: this.startTime, status: 'start' });
    } else {
      this.timerRunning = false;
      this.totalTime += Date.now() - this.startTime;
      this.records.push({ time: Date.now(), status: 'stop', duration: Date.now() - this.startTime });
    }
  }

  stopTimer() {
    if (this.timerRunning) {
      this.timerRunning = false;
      this.totalTime += Date.now() - this.startTime;
      this.records.push({ time: Date.now(), status: 'stop', duration: Date.now() - this.startTime });
    }
  }

  getTotalTime() {
    if (this.timerRunning) {
      return this.totalTime + (Date.now() - this.startTime);
    }
    return this.totalTime;
  }

  resetTimer() {
    this.timerRunning = false;
    this.startTime = 0;
    this.totalTime = 0;
    this.records = [];
  }

  getRecords() {
    return this.records;
  }
}

const timer1 = new TiltTimer('自');
const timer2 = new TiltTimer('相手');

const timer1Label = document.getElementById('timer1');
const timer2Label = document.getElementById('timer2');
const percentageLabel = document.getElementById('percentage');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const enableButton = document.getElementById('enable');
const generateReportButton = document.getElementById('generateReport');
const chartContainer = document.getElementById('chartContainer');
const dial1 = document.getElementById('dial1');
const dial2 = document.getElementById('dial2');
let tiltDetectionEnabled = false;

function updateDateTime() {
  const currentDatetime = new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  datetimeLabel.textContent = currentDatetime;
  setTimeout(updateDateTime, 60000);
}

function updateTimerLabels() {
  const totalTime1 = timer1.getTotalTime() / 1000;
  const minutes1 = Math.floor(totalTime1 / 60);
  const seconds1 = Math.floor(totalTime1 % 60);
  const tenths1 = Math.floor((totalTime1 * 10) % 10);
  timer1Label.textContent = `${minutes1}:${seconds1.toString().padStart(2, '0')}.${tenths1}`;

  const totalTime2 = timer2.getTotalTime() / 1000;
  const minutes2 = Math.floor(totalTime2 / 60);
  const seconds2 = Math.floor(totalTime2 % 60);
  const tenths2 = Math.floor((totalTime2 * 10) % 10);
  timer2Label.textContent = `${minutes2}:${seconds2.toString().padStart(2, '0')}.${tenths2}`;

  const totalTime = totalTime1 + totalTime2;
  const percentage = totalTime > 0 ? (totalTime1 / totalTime) * 100 : 0;
  percentageLabel.textContent = `${percentage.toFixed(0)}%`;
}

function checkTilt(event) {
  if (!tiltDetectionEnabled) return;

  const { beta, gamma } = event;
  const rightTiltThreshold = 45;

  if (gamma < -rightTiltThreshold || gamma > rightTiltThreshold) {
    if (timer1.timerRunning) timer1.stopTimer();
    if (timer2.timerRunning) timer2.stopTimer();
    document.body.style.backgroundColor = 'white';
  } else if (beta > 45 && beta < 135) {
    if (!timer2.timerRunning) {
      timer1.stopTimer();
      timer2.startStopTimer();
    }
    document.body.style.backgroundColor = '#ffcccc';
  } else if (beta >= -45 && beta <= 45) {
    if (!timer1.timerRunning) {
      timer2.stopTimer();
      timer1.startStopTimer();
    }
    document.body.style.backgroundColor = '#ccffcc';
  } else {
    timer1.stopTimer();
    timer2.stopTimer();
    document.body.style.backgroundColor = 'white';
  }

  updateTimerLabels();
}

function adjustValue(inputElement, adjustment) {
  const currentValue = parseInt(inputElement.value) || 0;
  inputElement.value = currentValue + adjustment;
}

document.getElementById('decreaseDial1').addEventListener('click', () => adjustValue(dial1, -1));
document.getElementById('increaseDial1').addEventListener('click', () => adjustValue(dial1, 1));
document.getElementById('decreaseDial2').addEventListener('click', () => adjustValue(dial2, -1));
document.getElementById('increaseDial2').addEventListener('click', () => adjustValue(dial2, 1));

startButton.addEventListener('click', () => {
  tiltDetectionEnabled = true;
  window.addEventListener('deviceorientation', checkTilt);
  startButton.disabled = true;
  resetButton.disabled = false;
});

resetButton.addEventListener('click', () => {
  if (resetButton.textContent === '終了') {
    tiltDetectionEnabled = false;
    window.removeEventListener('deviceorientation', checkTilt);
    timer1.stopTimer();
    timer2.stopTimer();
    startButton.disabled = true;
    resetButton.textContent = 'リセット';
    dial1.value = 11;
    dial2.value = 11;
    document.body.style.backgroundColor = 'white';
    generateReportButton.classList.remove('hidden');
  } else {
    timer1.resetTimer();
    timer2.resetTimer();
    startButton.disabled = false;
    resetButton.disabled = true;
    resetButton.textContent = '終了';
    timer1Label.textContent = '0:00.0';
    timer2Label.textContent = '0:00.0';
    percentageLabel.textContent = '00%';
    dial1.value = 11;
    dial2.value = 11;
    document.body.style.backgroundColor = 'white';
  }
});

enableButton.addEventListener('click', () => {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(permissionState => {
      if (permissionState === 'granted') {
        enableButton.style.display = 'none';
        startButton.disabled = false;
      }
    }).catch(console.error);
  } else {
    enableButton.style.display = 'none';
    startButton.disabled = false;
  }
});

generateReportButton.addEventListener('click', () => {
  generateReport();
});

function generateReport() {
  const timer1Records = timer1.getRecords();
  const timer2Records = timer2.getRecords();

  const reportData = [];
  let currentTeam = null;
  let currentStartTime = null;

  const allRecords = [...timer1Records.map(r => ({ ...r, team: '自' })), ...timer2Records.map(r => ({ ...r, team: '相手' }))];
  allRecords.sort((a, b) => a.time - b.time);

  allRecords.forEach(record => {
    if (record.status === 'start') {
      currentTeam = record.team;
      currentStartTime = record.time;
    } else if (record.status === 'stop' && currentTeam === record.team) {
      reportData.push({ team: currentTeam, duration: (record.time - currentStartTime) / 1000 });
      currentTeam = null;
      currentStartTime = null;
    }
  });

  chartContainer.classList.remove('hidden');
  drawRectangles(reportData);
}

function drawRectangles(reportData) {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  const height = 20;
  const totalDuration = 360;
  const canvasWidth = 720;
  const scale = canvasWidth / totalDuration;
  let x = 0;

  canvas.width = canvasWidth;
  canvas.height = height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  reportData.forEach(data => {
    const width = data.duration * scale;
    ctx.fillStyle = data.team === '自' ? 'green' : 'red';
    ctx.fillRect(x, 0, width, height);
    x += width;
  });
}

updateDateTime();

let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
    console.log('Wake Lock is active');
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

setInterval(() => {
  if (!wakeLock) {
    requestWakeLock();
  }
}, 120000);
