export class Soundscape {
  context?: AudioContext; master?: GainNode; muted = false;
  private reverb?: ConvolverNode;
  async start(volume: number) {
    try {
      if (!this.context) {
        this.context = new AudioContext(); this.master = this.context.createGain();
        const compressor = this.context.createDynamicsCompressor(); compressor.threshold.value = -12;
        this.master.connect(compressor).connect(this.context.destination);
        this.reverb = this.context.createConvolver();
        const impulse = this.context.createBuffer(2, this.context.sampleRate * 2.8, this.context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = impulse.getChannelData(channel);
          for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * (channel ? 127.13 : 311.79)) * Math.pow(1 - i / data.length, 3) * .3;
        }
        this.reverb.buffer = impulse;
        const wet = this.context.createGain(); wet.gain.value = .2; this.reverb.connect(wet).connect(this.master);
        for (const [frequency, gain] of [[48, .035], [72.08, .017], [144.12, .006]]) {
          const tone = this.context.createOscillator(); const level = this.context.createGain(); tone.frequency.value = frequency; level.gain.value = gain;
          tone.connect(level).connect(this.master); tone.start();
        }
      }
      await this.context.resume(); this.volume(volume);
    } catch { this.muted = true; }
  }
  volume(value: number) { if (this.context && this.master) this.master.gain.setTargetAtTime(value, this.context.currentTime, .1); }
  suspend() { void this.context?.suspend(); }
  tone(kind: 'scale' | 'gravity' | 'echo' | 'step' | 'complete' | 'deny') {
    if (!this.context || !this.master || this.context.state !== 'running') return;
    const ctx = this.context, t = ctx.currentTime;
    const tones = { scale: [220, 440], gravity: [85, 42], echo: [660, 330], step: [75, 42], complete: [330, 660], deny: [140, 110] };
    const duration = kind === 'step' ? .09 : kind === 'gravity' ? 1.8 : .8;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = kind === 'step' ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(tones[kind][0], t); oscillator.frequency.exponentialRampToValueAtTime(tones[kind][1], t + duration);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(kind === 'step' ? .065 : .12, t + .015); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    oscillator.connect(gain).connect(this.master); oscillator.start(t); oscillator.stop(t + duration + .05);
    if (this.reverb && kind !== 'step') gain.connect(this.reverb);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
