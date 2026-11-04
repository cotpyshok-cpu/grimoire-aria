// ===== Аудио-движок: фоновая музыка + спецэффекты Web Audio API и вибро-отклик =====
// Если файл music/theme.mp3 отсутствует — автоматически звучит встроенный 8-битный саундтрек лютни!

const AudioEngine = (() => {
  let isMuted = false;
  let audioCtx = null;
  let synthInterval = null;
  let isSynthPlaying = false;
  let isFinaleMode = false;
  let isGodfatherPlaying = false;
  let godfatherTimers = [];
  const bgAudioEl = document.getElementById('bgMusic');

  const NOTES = {
    'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'C6': 1046.50
  };

  const TAVERN_SEQUENCE = [
    'A3', 'C4', 'E4', 'A4', 'E4', 'C4',
    'F3', 'A3', 'C4', 'F4', 'C4', 'A3',
    'D3', 'F3', 'A3', 'D4', 'A3', 'F3',
    'E3', 'G#4', 'B4', 'E4', 'B4', 'G#4'
  ];

  const FINALE_SEQUENCE = [
    'C4', 'E4', 'G4', 'C5', 'G4', 'C5',
    'F4', 'A4', 'C5', 'F5', 'C5', 'A4',
    'G4', 'B4', 'D5', 'G5', 'D5', 'B4',
    'C4', 'G4', 'C5', 'E5', 'G5', 'C6'
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(freq, type = 'triangle', duration = 0.25, volume = 0.12) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function startSynthMusic() {
    if (isSynthPlaying) return;
    isSynthPlaying = true;
    let step = 0;

    clearInterval(synthInterval);
    synthInterval = setInterval(() => {
      if (isMuted || isGodfatherPlaying) return;
      const seq = isFinaleMode ? FINALE_SEQUENCE : TAVERN_SEQUENCE;
      const noteName = seq[step % seq.length];
      const freq = NOTES[noteName] || 440;
      playTone(freq, 'triangle', 0.28, 0.06);
      step++;
    }, 280);
  }

  function playMusic(srcPath, finale = false) {
    isFinaleMode = finale;
    if (bgAudioEl) {
      bgAudioEl.volume = isMuted ? 0 : 0.35;
      if (srcPath && bgAudioEl.src !== srcPath) {
        bgAudioEl.src = srcPath;
      }
      if (bgAudioEl.src) {
        bgAudioEl.play().catch(() => {
          startSynthMusic();
        });
      } else {
        startSynthMusic();
      }
    } else {
      startSynthMusic();
    }
  }

  function setMuted(muted) {
    isMuted = !!muted;
    if (bgAudioEl) {
      bgAudioEl.muted = isMuted;
      bgAudioEl.volume = isMuted ? 0 : 0.35;
    }
    try {
      localStorage.setItem('grimoire_aria_muted', isMuted ? '1' : '0');
    } catch (e) {}

    const btn = document.getElementById('muteBtn');
    if (btn) {
      btn.textContent = isMuted ? '🔇' : '🔊';
      btn.title = isMuted ? 'Включить звук' : 'Выключить звук';
    }
  }

  function toggleMute() {
    setMuted(!isMuted);
    return isMuted;
  }

  function playTextBlip() {
    if (isMuted) return;
    playTone(680 + Math.random() * 160, 'square', 0.025, 0.018);
  }

  function playSuccess() {
    if (isMuted) return;
    const notes = [NOTES['C5'], NOTES['E5'], NOTES['G5'], NOTES['C6']];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 'triangle', 0.25, 0.16), idx * 85);
    });
  }

  function playError() {
    if (isMuted) return;
    playTone(170, 'sawtooth', 0.25, 0.12);
    setTimeout(() => playTone(135, 'sawtooth', 0.3, 0.12), 120);
  }

  function playClick() {
    if (isMuted) return;
    playTone(540, 'square', 0.04, 0.04);
  }

  // Звон золотых монет казны
  function playCoin() {
    if (isMuted) return;
    playTone(987.77, 'sine', 0.12, 0.15);
    setTimeout(() => playTone(1318.51, 'sine', 0.35, 0.18), 90);
  }

  // Свисток Защиты от Птиц («ФИ-И-И-ИТЬ!»)
  function playWhistle() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(2600, ctx.currentTime + 0.18);
      osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.22);
      osc.frequency.linearRampToValueAtTime(2900, ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  }

  // Заклинание «Огонь Фей» (Faerie Fire)
  function playFaerieFire() {
    if (isMuted) return;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    freqs.forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.22, 0.16), i * 60);
    });
  }

  // Заклинание «Дребезги» / «Психическая Плеть Таши» (гром и раскол)
  function playShatter() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Низкий громовой удар
      playTone(90, 'sawtooth', 0.65, 0.28);
      setTimeout(() => playTone(65, 'square', 0.75, 0.25), 70);
      // Высокий звон осколков
      [1100, 880, 1420, 640, 1680].forEach((f, idx) => {
        setTimeout(() => playTone(f, 'triangle', 0.14, 0.14), 100 + idx * 55);
      });
    } catch (e) {}
  }

  // Звук сердечного обморока / тревоги при 0 HP
  function playHeartbeatWarning() {
    if (isMuted) return;
    try {
      [0, 180, 700, 880].forEach(delay => {
        setTimeout(() => {
          playTone(60, 'sine', 0.15, 0.35);
          setTimeout(() => playTone(45, 'sine', 0.22, 0.30), 40);
        }, delay);
      });
    } catch (e) {}
  }

  // Финальный ритуал «Абсолютное Изгнание» + переход в Коронацию
  function playBanish() {
    if (isMuted) return;
    playShatter();
    setTimeout(() => playFaerieFire(), 400);
    setTimeout(() => {
      const fanfares = [NOTES['C4'], NOTES['E4'], NOTES['G4'], NOTES['C5'], NOTES['E5'], NOTES['G5'], NOTES['C6']];
      fanfares.forEach((f, idx) => {
        setTimeout(() => playTone(f, 'triangle', 0.4, 0.22), idx * 110);
      });
    }, 900);
  }

  // Полная расширенная мелодия «Крёстного Отца» (похороны Дона Тони мышиной мафией в подвале церкви)
  function playGodfatherTheme() {
    if (isMuted) return;
    godfatherTimers.forEach(t => clearTimeout(t));
    godfatherTimers = [];
    isGodfatherPlaying = true;

    const melody = [
      // Фраза 1: Тема Дона Пармезано (До-минор -> Фа-минор)
      { n: 'G4', b: 'C3', d: 0.42 }, { n: 'C5', d: 0.42 }, { n: 'Eb5', b: 'G3', d: 0.42 },
      { n: 'D5', d: 0.42 }, { n: 'C5', b: 'C3', d: 0.42 }, { n: 'Eb5', d: 0.42 },
      { n: 'C5', b: 'G3', d: 0.42 }, { n: 'D5', d: 0.42 }, { n: 'C5', b: 'C3', d: 0.42 },
      { n: 'Ab4', b: 'F3', d: 0.45 }, { n: 'Bb4', d: 0.45 }, { n: 'G4', b: 'C3', d: 1.15 },

      // Фраза 2: Ответ мандолины (До-минор -> Соль-септ)
      { n: 'G4', b: 'C3', d: 0.42 }, { n: 'C5', d: 0.42 }, { n: 'Eb5', b: 'G3', d: 0.42 },
      { n: 'D5', d: 0.42 }, { n: 'C5', b: 'C3', d: 0.42 }, { n: 'Eb5', d: 0.42 },
      { n: 'C5', b: 'G3', d: 0.42 }, { n: 'D5', d: 0.42 }, { n: 'C5', b: 'C3', d: 0.42 },
      { n: 'G4', b: 'Eb3', d: 0.45 }, { n: 'Gb4', d: 0.45 }, { n: 'F4', b: 'D3', d: 1.15 },

      // Фраза 3: Подъём скорбной трубы в подвале церкви
      { n: 'F4', b: 'D3', d: 0.42 }, { n: 'Ab4', d: 0.42 }, { n: 'B4', b: 'G3', d: 0.42 },
      { n: 'D5', b: 'G3', d: 1.10 },
      { n: 'F4', b: 'D3', d: 0.42 }, { n: 'Ab4', d: 0.42 }, { n: 'B4', b: 'G3', d: 0.42 },
      { n: 'C5', b: 'C3', d: 1.15 },

      // Фраза 4: Финальный поклон Мышиной Мафии со шляпами у груди
      { n: 'C4', b: 'C3', d: 0.42 }, { n: 'Eb4', d: 0.42 }, { n: 'Bb4', b: 'Bb3', d: 0.42 },
      { n: 'Ab4', b: 'F3', d: 0.45 }, { n: 'G4', b: 'Eb3', d: 0.45 }, { n: 'Bb4', d: 0.45 },
      { n: 'Ab4', b: 'D3', d: 0.42 }, { n: 'Ab4', d: 0.42 }, { n: 'G4', b: 'G3', d: 0.42 },
      { n: 'G4', d: 0.42 }, { n: 'B3', b: 'G3', d: 0.48 }, { n: 'C4', b: 'C3', d: 1.50 }
    ];

    let delay = 0;
    melody.forEach(item => {
      const tid = setTimeout(() => {
        const freq = NOTES[item.n] || 392;
        // Основной голос трубы/мандолины (громкий и выразительный)
        playTone(freq, 'triangle', item.d * 0.96, 0.36);
        // Мягкий обертон для объёмного звучания
        playTone(freq * 0.5, 'sine', item.d * 0.9, 0.16);
        if (item.b && NOTES[item.b]) {
          playTone(NOTES[item.b], 'sine', item.d * 1.15, 0.22);
        }
      }, delay * 1000);
      godfatherTimers.push(tid);
      delay += item.d;
    });

    const endTid = setTimeout(() => {
      isGodfatherPlaying = false;
      godfatherTimers = [];
    }, (delay + 0.3) * 1000);
    godfatherTimers.push(endTid);
  }

  // Вибро-сигнал Тоника (для слепого обоняния трав и боев)
  function vibrate(pattern) {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }

  function init() {
    try {
      const savedMute = localStorage.getItem('grimoire_aria_muted');
      if (savedMute === '1') {
        setMuted(true);
      }
    } catch (e) {}
  }

  return {
    init,
    playMusic,
    setMuted,
    toggleMute,
    isMuted: () => isMuted,
    playTextBlip,
    playSuccess,
    playError,
    playClick,
    playCoin,
    playWhistle,
    playFaerieFire,
    playShatter,
    playBanish,
    playGodfatherTheme,
    playHeartbeatWarning,
    vibrate,
    setFinaleMode: (val) => { isFinaleMode = !!val; }
  };
})();

if (typeof window !== 'undefined') {
  window.AudioEngine = AudioEngine;
}
