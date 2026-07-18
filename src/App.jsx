import React, { useState, useEffect, useRef } from 'react';

// Each sound maps to a file in /public/sounds/
const SOUNDS = {
  rain:    { name: '🌧️ Rain',          file: '/rain.mp3' },
  forest:  { name: '🌲 Forest',         file: '/forest.mp3' },
  ocean:   { name: '🌊 Ocean Waves',    file: '/ocean.mp3' },
  wind:    { name: '💨 Wind',           file: '/wind.mp3' },
  bells:   { name: '🔔 Tibetan Bells',  file: '/bells.mp3' },
  silence: { name: '🤫 Silence',        file: null },
};

const MeditationTimer = () => {
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedSound, setSelectedSound]       = useState('rain');
  const [isRunning, setIsRunning]               = useState(false);
  const [timeLeft, setTimeLeft]                 = useState(10 * 60);
  const [volume, setVolume]                     = useState(0.5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // ── Audio helpers ──────────────────────────────────────────────────────────
  const startAudio = (soundKey, vol) => {
    stopAudio();
    const file = SOUNDS[soundKey]?.file;
    if (!file) return;
    const audio = new Audio(file);
    audio.loop   = true;
    audio.volume = vol;
    audio.play().catch(() => {
      // Browser blocked autoplay — shouldn't happen since we're in a click handler
      console.warn('Audio play blocked');
    });
    audioRef.current = audio;
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // ── Timer tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionsCompleted(s => s + 1);
      stopAudio();
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timeLeft]);

  // ── Real-time volume ───────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    startAudio(selectedSound, volume);
  };

  const handlePause = () => {
    setIsRunning(false);
    stopAudio();
  };

  const handleReset = () => {
    setIsRunning(false);
    stopAudio();
    setTimeLeft(selectedDuration * 60);
  };

  const handleDurationChange = (d) => {
    if (!isRunning) {
      setSelectedDuration(d);
      setTimeLeft(d * 60);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const progress      = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100;
  const circumference = 527; // 2π × 84

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f9f7f2 0%, #f5f1e8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    wrap:     { maxWidth: 420, width: '100%' },
    heading:  { textAlign: 'center', marginBottom: 32 },
    h1:       { fontSize: 32, fontWeight: 700, color: '#111827', margin: '0 0 8px' },
    subtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
    card: {
      background: 'white', borderRadius: 24,
      boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
      padding: 32, marginBottom: 16,
    },
    ringWrap: { position: 'relative', width: 192, height: 192, margin: '0 auto 24px' },
    timeLabel: {
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
    },
    time:        { fontSize: 44, fontWeight: 700, color: '#111827', lineHeight: 1 },
    status:      { fontSize: 13, color: '#9ca3af', marginTop: 6 },
    sessionBar:  { textAlign: 'center', marginBottom: 20, fontSize: 13, color: '#6b7280' },
    sectionLabel:{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10, display: 'block' },
    durationGrid:{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 },
    soundGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 },
    volRow:      { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
    btnRow:      { display: 'flex', gap: 12 },
    footer:      { textAlign: 'center', fontSize: 13, color: '#9ca3af' },
  };

  const dBtn = (d) => ({
    padding: '8px 4px', borderRadius: 10, border: 'none',
    cursor: isRunning ? 'not-allowed' : 'pointer',
    fontWeight: 600, fontSize: 13,
    background: selectedDuration === d ? '#2563eb' : '#f3f4f6',
    color:      selectedDuration === d ? 'white'    : '#374151',
    opacity: isRunning ? 0.6 : 1, transition: 'all 0.15s',
  });

  const sBtn = (key) => ({
    padding: '10px 12px', borderRadius: 10, border: 'none',
    cursor: isRunning ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: 500, textAlign: 'left',
    background: selectedSound === key ? '#2563eb' : '#f3f4f6',
    color:      selectedSound === key ? 'white'    : '#374151',
    opacity: isRunning ? 0.6 : 1, transition: 'all 0.15s',
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.wrap}>

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
                cx="96" cy="96" r="84" fill="none" stroke="#2563eb" strokeWidth="8"
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
              <button key={d} style={dBtn(d)} onClick={() => handleDurationChange(d)} disabled={isRunning}>{d}m</button>
            ))}
          </div>

          {/* Sound */}
          <label style={S.sectionLabel}>Ambient Sound</label>
          <div style={S.soundGrid}>
            {Object.entries(SOUNDS).map(([key, { name }]) => (
              <button key={key} style={sBtn(key)} onClick={() => setSelectedSound(key)} disabled={isRunning}>
                {name}
              </button>
            ))}
          </div>

          {/* Volume */}
          <div style={S.volRow}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>🔊 Volume</span>
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
              ? <button onClick={handleStart} style={{ flex: 1, background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>▶ Start</button>
              : <button onClick={handlePause} style={{ flex: 1, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>⏸ Pause</button>
            }
            <button onClick={handleReset} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>↺ Reset</button>
          </div>
        </div>

        <div style={S.footer}>✓ 100% private · No sign-ups · Runs on your device</div>
      </div>
    </div>
  );
};

export default MeditationTimer;
