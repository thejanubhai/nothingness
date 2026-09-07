/**
 * Web Audio API Sultry Noir DSP Voice Filter
 * Transforms vocal recordings with an intimate, pitch-shifted noir timbre
 * for biometric voice anonymization.
 */

// Encodes an AudioBuffer to standard 16-bit PCM WAV format
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + length, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, length, true);

  // Interleave and write 16-bit samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Clamp between -1.0 and 1.0
      const clamped = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer (-32768 to 32767)
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Applies the Sultry Noir voice filter to an audio Blob.
 * Lowers pitch, applies low-pass noir acoustic filtering, and adds warm broadcast compression.
 */
export async function processSultryNoirVoice(audioBlob: Blob): Promise<Blob> {
  if (typeof window === 'undefined') return audioBlob;

  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return audioBlob;

    const audioCtx = new AudioContextClass();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Playback rate ratio for subtle deep pitch drop (0.86x pitch shift)
    const pitchRate = 0.86;
    const outputDuration = decodedBuffer.duration / pitchRate;
    const outputLength = Math.ceil(outputDuration * decodedBuffer.sampleRate);

    // Create OfflineAudioContext to render the DSP graph
    const OfflineCtxClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    if (!OfflineCtxClass) {
      audioCtx.close();
      return audioBlob;
    }

    const offlineCtx = new OfflineCtxClass(
      decodedBuffer.numberOfChannels,
      outputLength,
      decodedBuffer.sampleRate
    );

    // 1. Source Node with pitch-down playbackRate
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = decodedBuffer;
    sourceNode.playbackRate.value = pitchRate;

    // 2. Lowpass Noir Filter (softens harsh sibilants and adds sultry warmth)
    const lowpassFilter = offlineCtx.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = 2400; // 2.4 kHz cutoff
    lowpassFilter.Q.value = 1.2;

    // 3. Peaking Warmth Filter (boosts chest resonance ~180Hz)
    const warmthFilter = offlineCtx.createBiquadFilter();
    warmthFilter.type = 'peaking';
    warmthFilter.frequency.value = 180;
    warmthFilter.gain.value = 3.5;
    warmthFilter.Q.value = 1.0;

    // 4. Dynamics Compressor (intimate velvety whisper leveling)
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 4.5;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.15;

    // Connect DSP chain: Source -> Warmth -> Lowpass -> Compressor -> Destination
    sourceNode.connect(warmthFilter);
    warmthFilter.connect(lowpassFilter);
    lowpassFilter.connect(compressor);
    compressor.connect(offlineCtx.destination);

    sourceNode.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    audioCtx.close();

    return audioBufferToWavBlob(renderedBuffer);
  } catch (err) {
    console.warn('Sultry Noir DSP filter failed, falling back to original audio:', err);
    return audioBlob;
  }
}
