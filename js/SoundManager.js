// --- SOUND ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class SoundManager {
    constructor() {
        this.masterGain = audioCtx.createGain();
        this.masterGain.gain.value = 0.4;
        this.masterGain.connect(audioCtx.destination);
        this.geigerNextTime = 0; this.isCarrying = false;

        // Arpeggiator State
        this.arpNextTime = 0;
        this.arpNoteIdx = 0;
        this.scale = [130.81, 155.56, 196.00, 233.08, 261.63, 311.13, 392.00, 466.16, 523.25, 622.25, 783.99]; // Cm7 extended

        // Music
        this.bgm = new Audio('https://fi.zophar.net/soundfiles/commodore-64/armalyte/02_Title%20Screen.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.1; // Start at 10%
    }

    playMusic() {
        this.bgm.play().catch(e => console.log("Audio play failed:", e));
    }

    stopMusic() {
        this.bgm.pause();
        this.bgm.currentTime = 0;
    }

    toggleMusic() {
        if (this.bgm.paused) {
            this.playMusic();
            return true;
        } else {
            this.bgm.pause();
            return false;
        }
    }

    setMusicVolume(v) {
        this.bgm.volume = Math.max(0, Math.min(1, v));
    }

    startAmbience() {
        // Drone removed as requested
    }

    updateAmbience(radiationLevel, carryingCount = 0) {
        const now = audioCtx.currentTime;

        // Geiger Counter
        if (this.isCarrying) {
            if (now >= this.geigerNextTime) {
                this.playGeigerClick();
                const intensity = Math.min(radiationLevel, 90) / 100;
                const interval = 1.0 - (intensity * 0.95);
                this.geigerNextTime = now + Math.max(0.05, interval * (0.5 + Math.random() * 0.5));
            }
        }

        // Dramatic Arpeggiator (Tension while carrying)
        if (this.isCarrying && carryingCount > 0) {
            // Speed increases with count
            const speedFactor = Math.min(carryingCount, 8) / 8;
            const interval = 0.3 - (speedFactor * 0.2); // 0.3s down to 0.1s

            if (now >= this.arpNextTime) {
                this.playArpNote(carryingCount);
                this.arpNextTime = now + interval;
            }
        }
    }

    playArpNote(intensity) {
        const now = audioCtx.currentTime;
        // Use a subset of the scale based on intensity
        const range = Math.min(3 + intensity, this.scale.length);
        const noteIdx = this.arpNoteIdx % range;
        const freq = this.scale[noteIdx];

        // Randomize order slightly for chaos at high intensity
        if (intensity > 5 && Math.random() > 0.7) {
            this.arpNoteIdx += Math.floor(Math.random() * 3);
        } else {
            this.arpNoteIdx++;
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = intensity > 5 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playGeigerClick() {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(1200 + Math.random() * 500, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.05);
    }

    playLevelStart() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 1.0);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 1.0);

        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(now); osc.stop(now + 1.0);
    }

    playNextLevel() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        // Major Chord Fanfare: C, E, G, C
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.5);
            osc.connect(gain); gain.connect(this.masterGain);
            osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 1.5);
        });
    }

    playSFX(type, param = 0) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(this.masterGain);

        switch (type) {
            case 'pickup_plutonium':
                // Play note from scale based on param (carryingCount)
                // We want a distinct pickup sound that harmonizes with the arp
                const noteIdx = (param > 0 ? param - 1 : 0) % this.scale.length;
                const freq = this.scale[noteIdx] * 2; // One octave higher than arp

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.01, now + 0.1); // Slight pitch bend

                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                osc.start(now); osc.stop(now + 0.3);
                break;

            case 'deposit':
                // Success sound
                [440, 554, 659, 880].forEach((f, i) => {
                    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
                    o.type = 'triangle'; o.frequency.value = f;
                    o.connect(g); g.connect(this.masterGain);
                    g.gain.setValueAtTime(0.1, now + i * 0.05); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.05);
                    o.start(now + i * 0.05); o.stop(now + 0.5 + i * 0.05);
                });
                break;

            case 'key':
                osc.type = 'sine'; osc.frequency.setValueAtTime(1500, now); osc.frequency.linearRampToValueAtTime(2500, now + 0.1);
                gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
                break;

            case 'door':
                osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(50, now + 0.3);
                gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
                break;

            case 'die':
                // Improved Death Sound: Low boom + Noise
                const bufferSize = audioCtx.sampleRate * 1.5;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
                const noiseGain = audioCtx.createGain();

                noiseGain.gain.setValueAtTime(0.8, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                noise.connect(noiseGain); noiseGain.connect(this.masterGain);
                noise.start(now);

                // Low Boom
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 1.0);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                osc.start(now); osc.stop(now + 1.0);
                break;

            case 'grass':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(300 + Math.random() * 100, now);
                gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
                break;

            case 'block_pickup':
                osc.type = 'square'; osc.frequency.setValueAtTime(440, now); osc.frequency.linearRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
                break;

            case 'block_place':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now); osc.stop(now + 0.2);
                break;

            case 'block_recover':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(880, now); osc.frequency.linearRampToValueAtTime(1760, now + 0.1);
                gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.start(now); osc.stop(now + 0.1);
                break;

            case 'step':
                const stepBuffSize = audioCtx.sampleRate * 0.05;
                const stepBuff = audioCtx.createBuffer(1, stepBuffSize, audioCtx.sampleRate);
                const stepData = stepBuff.getChannelData(0);
                for (let i = 0; i < stepBuffSize; i++) stepData[i] = Math.random() * 2 - 1;
                const stepNoise = audioCtx.createBufferSource();
                stepNoise.buffer = stepBuff;
                const stepFilter = audioCtx.createBiquadFilter();
                stepFilter.type = 'highpass'; stepFilter.frequency.value = 1000;
                const stepGain = audioCtx.createGain();
                stepGain.gain.setValueAtTime(0.05, now);
                stepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                stepNoise.connect(stepFilter); stepFilter.connect(stepGain); stepGain.connect(this.masterGain);
                stepNoise.start(now);
                break;
        }
    }
}
const soundManager = new SoundManager();

class MoveSynth {
    constructor() { this.osc = null; this.gain = null; this.playing = false; }
    start() {
        if (this.playing) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        this.osc = audioCtx.createOscillator(); this.gain = audioCtx.createGain();
        this.osc.type = 'triangle'; this.osc.connect(this.gain);
        this.gain.connect(audioCtx.destination);
        this.gain.gain.value = 0; this.gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.05);
        this.osc.start(); this.playing = true;
    }
    update(x, y) {
        if (!this.playing) return;
        try { this.osc.frequency.setValueAtTime(100 + ((x + y) % 100), audioCtx.currentTime); } catch (e) { }
    }
    stop() {
        if (!this.playing) return;
        this.playing = false;
        const o = this.osc; const g = this.gain;
        if (g) try { g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05); } catch (e) { }
        setTimeout(() => { try { o.stop(); o.disconnect(); g.disconnect(); } catch (e) { } }, 100);
        this.osc = null; this.gain = null;
    }
}
const moveSynth = new MoveSynth();
