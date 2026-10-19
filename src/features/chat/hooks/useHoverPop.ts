'use client';
import { useEffect, useRef } from 'react';

export default function useHoverPop() {
  const audio = useRef<AudioContext | null>(null);
  const lastPop = useRef(0);
  useEffect(() => {
    const unlock = () => {
      try {
        const context = audio.current ?? (audio.current = new AudioContext());
        if (context.state === 'suspended') void context.resume().catch(() => {});
      } catch { /* Sound is optional when audio is unavailable. */ }
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
    return () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      if (audio.current) void audio.current.close().catch(() => {});
      audio.current = null;
    };
  }, []);
  return () => {
    try {
      const context = audio.current;
      if (!context || context.state !== 'running' || performance.now() - lastPop.current < 90) return;
      lastPop.current = performance.now();
      const source = context.createBufferSource();
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.035), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 0.6;
      const gain = context.createGain();
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      const body = context.createOscillator();
      const bodyGain = context.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(420, now);
      body.frequency.exponentialRampToValueAtTime(160, now + 0.055);
      bodyGain.gain.setValueAtTime(0, now);
      bodyGain.gain.linearRampToValueAtTime(0.18, now + 0.002);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      body.connect(bodyGain);
      bodyGain.connect(context.destination);
      body.onended = () => { body.disconnect(); bodyGain.disconnect(); };
      body.start(now);
      body.stop(now + 0.07);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start(now);
      source.stop(now + 0.035);
    } catch { /* Hover must keep working if audio is unavailable. */ }
  };
}
