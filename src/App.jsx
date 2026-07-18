import React, { useState, useEffect, useRef } from 'react';

// ─── Audio Engine ─────────────────────────────────────────────────────────────
function createAudioEngine(soundType, volume) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const nodes = [];

  if (soundType === 'bells') {
    // Bell: decaying sine wave burst every ~8 seconds
    const playBell = () => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(masterGain);
      osc.frequency.value = 432;
      osc.type = 'sine';
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 4.1);
    };
    playBell();
    const interval = setInterval(playBell, 8000);
    nodes.push({ interval });
  } else {
    // Noise-based sounds (rain, forest, ocean, wind)
    const bufferSize = ctx.sampleRate * 4; // 4 second buffer, looped
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink-ish noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362) / 7;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Shape the noise with a filter per sound type
    const filter = ctx.createBiquadFilter();

    if (soundType === 'rain') {
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
    } else if (soundType === 'forest') {
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.3;
    } else if (soundType === 'ocean') {
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      filter.Q.value = 1;
    } else if (soundType === 'wind') {
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
    }

    source.connect(filter);

    // For ocean: add a slow LFO to simulate wave rhythm
    if (soundType === 'ocean') {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.12; // one wave every ~8 seconds
      lfoGain.gain.value = 0.4;
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lfo.start();
      nodes.push(lfo);
    }

    filter.connect(masterGain);
    source.start();
    nodes.push(source);
  }

  return { ctx, masterGain, nodes };
}

function stopAudioEngine(engine) {
  if (!engine) return;
  try {
    engine.nodes.forEach(n => {
      if (n.interval) clearInterval(n.interval);
      else n.stop();
    });
    engine.ctx.close();
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────
const MeditationTimer = () => {
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedSound, setSelectedSound]       = useState('rain');
  const [isRunning, setIsRunning]               = useState(false);
  const [timeLeft, setTimeLeft]                 = useState(10 * 60);
  const [volume, setVolume]                     = useState(0.5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const engineRef  = useRef(null);
  const timerRef   = useRef(null);

  const sounds = {
    rain:    { name: '🌧️ Rain' },
    forest:  { name: '🌲 Forest' },
    ocean:   { name: '🌊 Ocean Waves' },
    wind:    { name: '💨 Wind' },
    bells:   { name: '🔔 Tibetan Bells' },
    silence: { name: '🤫 Silence' },
  };

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionsCompleted(s => s + 1);
      stopAudioEngine(engineRef.current);
      engineRef.current = null;
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timeLeft]);

  // Real-time volume control
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.masterGain.gain.setValueAtTime(
        volume,
        engineRef.current.ctx.currentTime
      );
    }
  }, [volume]);

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    if (selectedSound !== 'silence') {
      engineRef.current = createAudioEngine(selectedSound, volume);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    stopAudioEngine(engineRef.current);
    engineRef.current = null;
  };

  const handleReset = () => {
    setIsRunning(false);
    stopAudioEngine(engineRef.current);
    engineRef.current = null;
    setTimeLeft(selectedDuration * 60);
  };

  const handleDurationChange = (duration) => {
    if (!isRunning) {
      setSelectedDuration(duration);
      setTimeLeft(duration * 60);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const totalSeconds = selectedDuration * 60;
  const progress     = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 565.48;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9f7f2 0%, #f5f1e8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    wrap: { maxWidth: 420, width: '100%' },
    heading: { textAlign: 'center', marginBottom: 32 },
    h1: { fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
    subtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
    card: {
      background: 'white',
      borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      padding: 32,
      marginBottom: 16,
    },
    ringWrap: {
      position: 'relative',
      width: 192,
      height: 192,
      margin: '0 auto 24px',
    },
    timeLabel: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    },
    time: { fontSize: 44, fontWeight: 700, color: '#111827', lineHeight: 1 },
    status: { fontSize: 13, color: '#9ca3af', marginTop: 6 },
    sessionBar: { textAlign: 'center', marginBottom: 20, fontSize: 13, color: '#6b7280' },
    sectionLabel: {
      fontSize: 13,
      fontWeight: 600,
      color: '#374151',
      marginBottom: 10,
      display: 'block',
    },
    durationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 8,
      marginBottom: 20,
    },
    soundGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8,
      marginBottom: 20,
    },
    volRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    btnRow: { display: 'flex', gap: 12 },
    footer: { textAlign: 'center', fontSize: 13, color: '#9ca3af' },
  };

  const durationBtn = (d) => ({
    padding: '8px 4px',
    borderRadius: 10,
    border: 'none',
    cursor: isRunning ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: 13,
    background: selectedDuration === d ? '#2563eb' : '#f3f4f6',
    color:      selectedDuration === d ? 'white'    : '#374151',
    opacity:    isRunning ? 0.6 : 1,
    transition: 'all 0.15s',
  });

  const soundBtn = (key) => ({
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    cursor: isRunning ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 500,
    background: selectedSound === key ? '#2563eb' : '#f3f4f6',
    color:      selectedSound === key ? 'white'    : '#374151',
    opacity:    isRunning ? 0.6 : 1,
    transition: 'all 0.15s',
    textAlign: 'left',
  });

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Header */}
        <div style={S.heading}>
          <h1 style={S.h1}>🧘 Meditation Timer</h1>
          <p style={S.subtitle}>Find peace in just minutes · Free · No sign-up</p>
        </div>

        <div style={S.card}>

          {/* Progress ring */}
          <div style={S.ringWrap}>
            <svg width="192" height="192" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="96" cy="96" r="84" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="96" cy="96" r="84"
                fill="none"
                stroke="#2563eb"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * circumference} ${circumference}`}
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <div style={S.timeLabel}>
              <div style={S.time}>{formatTime(timeLeft)}</div>
              <div style={S.status}>{isRunning ? '✨ Breathing...' : 'Ready to meditate'}</div>
            </div>
          </div>

          {/* Sessions */}
          <div style={S.sessionBar}>
            Sessions completed: <strong style={{ color: '#2563eb' }}>{sessionsCompleted}</strong>
          </div>

          {/* Duration */}
          <label style={S.sectionLabel}>Duration</label>
          <div style={S.durationGrid}>
            {[5, 10, 15, 20, 30].map(d => (
              <button key={d} style={durationBtn(d)} onClick={() => handleDurationChange(d)} disabled={isRunning}>
                {d}m
              </button>
            ))}
          </div>

          {/* Sound */}
          <label style={S.sectionLabel}>Ambient Sound</label>
          <div style={S.soundGrid}>
            {Object.entries(sounds).map(([key, { name }]) => (
              <button key={key} style={soundBtn(key)} onClick={() => setSelectedSound(key)} disabled={isRunning}>
                {name}
              </button>
            ))}
          </div>

          {/* Volume */}
          <div style={S.volRow}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
              🔊 Volume
            </span>
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#2563eb' }}
            />
            <span style={{ fontSize: 13, color: '#6b7280', minWidth: 32, textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Controls */}
          <div style={S.btnRow}>
            {!isRunning
              ? <button onClick={handleStart} style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                  ▶ Start
                </button>
              : <button onClick={handlePause} style={{ flex: 1, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                  ⏸ Pause
                </button>
            }
            <button onClick={handleReset} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              ↺ Reset
            </button>
          </div>
        </div>

        <div style={S.footer}>
          ✓ 100% private · No sign-ups · Runs on your device
        </div>
      </div>
    </div>
  );
};

export default MeditationTimer;
