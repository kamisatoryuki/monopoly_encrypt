class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    durationMs: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.06,
    delayMs = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const start = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainLevel, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + durationMs / 1000);
  }

  public dice() {
    this.tone(240, 50, 'triangle', 0.05, 0);
    this.tone(320, 50, 'triangle', 0.05, 60);
    this.tone(420, 70, 'triangle', 0.05, 120);
  }

  public step() {
    this.tone(520, 35, 'sine', 0.03, 0);
  }

  public success() {
    this.tone(523.25, 110, 'sine', 0.07, 0);
    this.tone(659.25, 130, 'sine', 0.07, 90);
    this.tone(783.99, 180, 'sine', 0.07, 180);
  }

  public error() {
    this.tone(220, 140, 'sawtooth', 0.04, 0);
    this.tone(185, 180, 'sawtooth', 0.04, 120);
  }

  public finish() {
    this.tone(440, 120, 'sine', 0.07, 0);
    this.tone(554.37, 120, 'sine', 0.07, 110);
    this.tone(659.25, 140, 'sine', 0.07, 220);
    this.tone(880, 240, 'sine', 0.08, 330);
  }
}

export const soundFx = new SoundEffects();
