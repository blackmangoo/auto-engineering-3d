/**
 * Web Audio API procedural automotive sound synthesizer
 * Zero external audio assets required. Generates realistic engine harmonics,
 * turbo spool, brake friction hiss, and transmission whine directly via Web Audio oscillators.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;

  // Engine sound nodes
  private engineMasterGain: GainNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private oscFund: OscillatorNode | null = null;
  private oscHarmonic: OscillatorNode | null = null;
  private oscCylinderPulse: OscillatorNode | null = null;
  private pulseGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Turbo whistle nodes
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;

  // Brake hiss nodes
  private brakeNoiseNode: AudioBufferSourceNode | null = null;
  private brakeNoiseGain: GainNode | null = null;
  private brakeNoiseFilter: BiquadFilterNode | null = null;

  // Transmission whine nodes
  private transOsc: OscillatorNode | null = null;
  private transGain: GainNode | null = null;

  constructor() {
    // Lazy initialize on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
      this.startSynthesizer();
    } else {
      this.stopSynthesizer();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  private startSynthesizer() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Master Engine Gain
    this.engineMasterGain = this.ctx.createGain();
    this.engineMasterGain.gain.setValueAtTime(0.08, now);

    // Lowpass filter for deep engine throat
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, now);
    this.engineFilter.Q.setValueAtTime(3.5, now);

    // 1. Sub-bass rumble (Crankshaft rotation)
    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = 'triangle';
    this.oscSub.frequency.setValueAtTime(25, now);

    // 2. Fundamental combustion pitch
    this.oscFund = this.ctx.createOscillator();
    this.oscFund.type = 'sawtooth';
    this.oscFund.frequency.setValueAtTime(50, now);

    // 3. High harmonic exhaust rasp
    this.oscHarmonic = this.ctx.createOscillator();
    this.oscHarmonic.type = 'sawtooth';
    this.oscHarmonic.frequency.setValueAtTime(100, now);

    // 4. Cylinder firing pulses (LFO modulation)
    this.oscCylinderPulse = this.ctx.createOscillator();
    this.oscCylinderPulse.type = 'sine';
    this.oscCylinderPulse.frequency.setValueAtTime(30, now);

    this.pulseGain = this.ctx.createGain();
    this.pulseGain.gain.setValueAtTime(0.3, now);

    // Connect Engine
    this.oscSub.connect(this.engineFilter);
    this.oscFund.connect(this.engineFilter);
    this.oscHarmonic.connect(this.engineFilter);
    this.engineFilter.connect(this.engineMasterGain);
    this.engineMasterGain.connect(this.ctx.destination);

    // Start oscillators
    this.oscSub.start(now);
    this.oscFund.start(now);
    this.oscHarmonic.start(now);
    this.oscCylinderPulse.start(now);

    // 5. Turbo Spool Whistle
    this.turboOsc = this.ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.setValueAtTime(1200, now);

    this.turboGain = this.ctx.createGain();
    this.turboGain.gain.setValueAtTime(0.001, now);
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(this.ctx.destination);
    this.turboOsc.start(now);

    // 6. Transmission Whine
    this.transOsc = this.ctx.createOscillator();
    this.transOsc.type = 'triangle';
    this.transOsc.frequency.setValueAtTime(320, now);

    this.transGain = this.ctx.createGain();
    this.transGain.gain.setValueAtTime(0.001, now);
    this.transOsc.connect(this.transGain);
    this.transGain.connect(this.ctx.destination);
    this.transOsc.start(now);

    // 7. Brake Friction Noise (White noise generator)
    this.initBrakeNoise();
  }

  private initBrakeNoise() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.brakeNoiseNode = this.ctx.createBufferSource();
    this.brakeNoiseNode.buffer = buffer;
    this.brakeNoiseNode.loop = true;

    this.brakeNoiseFilter = this.ctx.createBiquadFilter();
    this.brakeNoiseFilter.type = 'bandpass';
    this.brakeNoiseFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    this.brakeNoiseFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.brakeNoiseGain = this.ctx.createGain();
    this.brakeNoiseGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.brakeNoiseNode.connect(this.brakeNoiseFilter);
    this.brakeNoiseFilter.connect(this.brakeNoiseGain);
    this.brakeNoiseGain.connect(this.ctx.destination);

    this.brakeNoiseNode.start(this.ctx.currentTime);
  }

  public updateTelemetry(
    rpm: number,
    throttle: number,
    brakePedal: number,
    speedKmh: number
  ) {
    if (!this.isEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // V6 Engine firing frequency: (RPM / 60) * 3 combustion events/rev
    const baseFreq = Math.max(18, (rpm / 60) * 1.5);
    const fundamental = baseFreq * 2;
    const harmonic = baseFreq * 4;

    this.oscSub?.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.oscFund?.frequency.setTargetAtTime(fundamental, now, 0.05);
    this.oscHarmonic?.frequency.setTargetAtTime(harmonic, now, 0.05);

    // Filter frequency opens up with throttle (simulates throttle body valve opening)
    const filterFreq = 300 + throttle * 2400 + (rpm / 9000) * 1800;
    this.engineFilter?.frequency.setTargetAtTime(filterFreq, now, 0.05);

    // Master volume scales with load
    const engineVol = 0.04 + throttle * 0.08 + (rpm / 9000) * 0.05;
    this.engineMasterGain?.gain.setTargetAtTime(engineVol, now, 0.05);

    // Turbo spool responds to throttle and high RPM
    if (this.turboOsc && this.turboGain) {
      const turboFreq = 800 + (rpm / 9000) * 3800;
      const turboVol = Math.max(0.0001, throttle * 0.025 * (rpm / 4000));
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.08);
      this.turboGain.gain.setTargetAtTime(turboVol, now, 0.08);
    }

    // Transmission straight/helical gear whine proportional to vehicle speed
    if (this.transOsc && this.transGain) {
      const transFreq = 180 + speedKmh * 9.5;
      const transVol = Math.min(0.02, (speedKmh / 200) * 0.015);
      this.transOsc.frequency.setTargetAtTime(transFreq, now, 0.05);
      this.transGain.gain.setTargetAtTime(transVol, now, 0.05);
    }

    // Brake friction hiss proportional to brake pedal application and speed
    if (this.brakeNoiseGain) {
      const brakeVol = brakePedal * (speedKmh > 5 ? 0.04 : 0.001);
      this.brakeNoiseGain.gain.setTargetAtTime(brakeVol, now, 0.04);
    }
  }

  public playShiftClick() {
    if (!this.isEnabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  private stopSynthesizer() {
    try {
      this.oscSub?.stop();
      this.oscFund?.stop();
      this.oscHarmonic?.stop();
      this.oscCylinderPulse?.stop();
      this.turboOsc?.stop();
      this.transOsc?.stop();
      this.brakeNoiseNode?.stop();
    } catch {
      // Ignore if already stopped
    }
  }
}

export const soundEngine = new SoundEngine();
