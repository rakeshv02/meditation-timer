import React, { useState, useEffect, useRef } from 'react';

const MeditationTimer = () => {
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedSound, setSelectedSound] = useState('rain');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [volume, setVolume] = useState(0.5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const sounds = {
    rain: { name: 'Rain' },
    forest: { name: 'Forest' },
    ocean: { name: 'Ocean Waves' },
    wind: { name: 'Wind' },
    bells: { name: 'Tibetan Bells' },
    silence: { name: 'Silence' }
  };

  const playAmbientSound = (soundType) => {
    if (soundType === 'silence') return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = volume * 0.1;
    const frequencies = { rain: 40, forest: 60, ocean: 50, wind: 35, bells: 432 };
    oscillator.frequency.value = frequencies[soundType] || 50;
    oscillator.type = soundType === 'bells' ? 'sine' : 'triangle';
    oscillator.start();
    audioRef.current = { oscillator, gainNode, audioContext };
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setSessionsCompleted(sessionsCompleted + 1);
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timeLeft, selectedDuration, sessionsCompleted]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      if (selectedSound !== 'silence') playAmbientSound(selectedSound);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration * 60);
  };

  const handleDurationChange = (duration) => {
    if (!isRunning) {
      setSelectedDuration(duration);
      setTimeLeft(duration * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSeconds = selectedDuration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f7f2] to-[#f5f1e8] p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Meditation Timer</h1>
          <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Find peace in just minutes • 100% free • No sign-up</p>
        </div>
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray={`${(progress / 100) * 565.48} 565.48`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>{formatTime(timeLeft)}</div>
                <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {isRunning ? 'Breathing...' : 'Ready to meditate'}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Sessions: <span className="font-bold text-blue-600">{sessionsCompleted}</span>
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Duration</label>
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 15, 20, 30].map((duration) => (
                <button key={duration} onClick={() => handleDurationChange(duration)} disabled={isRunning} className={`py-2 px-2 rounded-lg font-semibold text-sm ${selectedDuration === duration ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{duration}m</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Sound</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sounds).map(([key, { name }]) => (
                <button key={key} onClick={() => setSelectedSound(key)} disabled={isRunning} className={`py-2 px-3 rounded-lg text-sm ${selectedSound === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{name}</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>Volume</span>
              <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{Math.round(volume * 100)}%</span>
            </div>
          </div>
          <div className="flex gap-3">
            {!isRunning ? <button onClick={handleStart} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg">▶ Start</button> : <button onClick={handlePause} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg">⏸ Pause</button>}
            <button onClick={handleReset} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-4 rounded-lg">Reset</button>
          </div>
        </div>
        <div className="text-center text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          <p>✓ 100% private • No sign-ups • Runs on your device</p>
        </div>
      </div>
    </div>
  );
};

export default MeditationTimer;
