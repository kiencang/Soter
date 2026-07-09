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
    if (!this.soundEnabled() || this.audioCtx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      
      this.engineOsc = this.audioCtx.createOscillator();
      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.audioCtx.currentTime);

      this.engineGain = this.audioCtx.createGain();
      this.engineGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

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

  toggleSound(inSimulation: boolean) {
    this.soundEnabled.update(s => !s);
    if (!this.soundEnabled()) {
      this.stopSound();
    } else if (inSimulation) {
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
      this.hornGain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);

      this.hornOsc.connect(this.hornGain);
      this.hornGain.connect(this.audioCtx.destination);
      this.hornOsc.start();
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
