/**
 * Sound FX Manager - Web Audio API Sound Synthesizer
 * Generates clean, modern UI audio feedback with ZERO external audio files.
 */

export class SoundFX {
    static ctx = null;

    static getContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    /**
     * Mic Start Listening Tone (Soft dual ascending frequencies)
     */
    static playMicStart() {
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }

    /**
     * Item Add Success Chime (Major triad arpeggio)
     */
    static playItemAdd() {
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            notes.forEach((freq, idx) => {
                const now = ctx.currentTime + (idx * 0.06);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.15);
            });
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }

    /**
     * Item Complete Check Pop
     */
    static playCheckPop() {
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }

    /**
     * Delete Item Soft Swoosh
     */
    static playDelete() {
        try {
            const ctx = this.getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }
}
