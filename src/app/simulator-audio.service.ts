import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SimulatorAudioService {
  soundEnabled = signal<boolean>(true);
  
  private audioCtx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private hornOsc: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  initAudio() {
    if (!this.soundEnabled()) return;
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        try { this.audioCtx.resume(); } catch(e) {}
      }
      return;
    }
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      this.engineOsc = this.audioCtx.createOscillator();
      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.setValueAtTime(75, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.audioCtx.currentTime);

      this.engineGain = this.audioCtx.createGain();
      this.engineGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.audioCtx.destination);
      this.engineOsc.start();
    } catch (e) {
      console.warn('Audio synthesis failed to initialize', e);
    }
  }

  stopSound() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); this.engineOsc.disconnect(); } catch(e) {}
      this.engineOsc = null;
    }
    if (this.engineGain) {
      try { this.engineGain.disconnect(); } catch(e) {}
      this.engineGain = null;
    }
    this.stopHorn();
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch(e) {}
      this.audioCtx = null;
    }
  }

  toggleSound(inActiveScenario: boolean) {
    this.soundEnabled.update(s => !s);
    if (!this.soundEnabled()) {
      this.stopSound();
    } else if (inActiveScenario) {
      this.initAudio();
    }
  }

  playHorn() {
    if (!this.soundEnabled() || !this.audioCtx || this.hornOsc) return;
    try {
      this.hornOsc = this.audioCtx.createOscillator();
      this.hornOsc.type = 'sawtooth';
      this.hornOsc.frequency.setValueAtTime(320, this.audioCtx.currentTime);

      this.hornGain = this.audioCtx.createGain();
      this.hornGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);

      this.hornOsc.connect(this.hornGain);
      this.hornGain.connect(this.audioCtx.destination);
      this.hornOsc.start();
    } catch(e) {}
  }

  playCrashSound() {
    if (!this.soundEnabled() || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      
      // 1. Impact thud (low frequency drop)
      const thudOsc = this.audioCtx.createOscillator();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(150, now);
      thudOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.4);

      const thudGain = this.audioCtx.createGain();
      thudGain.gain.setValueAtTime(1.5, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      thudOsc.connect(thudGain);
      thudGain.connect(this.audioCtx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.4);

      // 2. Noise burst (crunch/shatter)
      const duration = 0.35;
      const bufferSize = this.audioCtx.sampleRate * duration;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; // White noise
      }
      
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.audioCtx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(1.0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      // Ensure it goes to absolute 0 at the end to prevent echoing pop
      noiseGain.gain.linearRampToValueAtTime(0, now + duration + 0.05);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noise.start(now);
      noise.stop(now + duration + 0.05);
    } catch(e) {}
  }

  playBrakeSound() {
    if (!this.soundEnabled() || !this.audioCtx) return;
    try {
      // Brake screech using bandpass filtered white noise
      const bufferSize = this.audioCtx.sampleRate * 0.8; // 0.8 seconds
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.audioCtx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1500, this.audioCtx.currentTime);
      noiseFilter.frequency.linearRampToValueAtTime(800, this.audioCtx.currentTime + 0.8);
      noiseFilter.Q.value = 1.5; // Resonance

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.4, this.audioCtx.currentTime + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.8);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noise.start();
    } catch(e) {}
  }

  stopHorn() {
    if (this.hornOsc) {
      try { this.hornOsc.stop(); this.hornOsc.disconnect(); } catch(e) {}
      this.hornOsc = null;
    }
    if (this.hornGain) {
      try { this.hornGain.disconnect(); } catch(e) {}
      this.hornGain = null;
    }
  }
}
