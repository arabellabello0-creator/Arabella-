import React, { useState, useCallback } from 'react';
import { generateAudio } from '../services/geminiService';
import Loader from './Loader';
import { TtsVoice } from '../types';

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// FIX: Add function to decode raw PCM audio data into an AudioBuffer.
// The audio from Gemini TTS is raw PCM, not a standard audio file format.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// FIX: Add function to convert an AudioBuffer to a WAV file blob for playback and download.
function bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };
    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    while (offset < buffer.length) {
        for (i = 0; i < numOfChan; i++) { // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    return new Blob([view], { type: 'audio/wav' });
}

const voices: { name: string; value: TtsVoice }[] = [
    { name: 'Kore (Female)', value: 'Kore' },
    { name: 'Puck (Male)', value: 'Puck' },
    { name: 'Zephyr (Female)', value: 'Zephyr' },
    { name: 'Charon (Male)', value: 'Charon' },
    { name: 'Fenrir (Male)', value: 'Fenrir' },
];

const AudioGenerator: React.FC = () => {
    const [text, setText] = useState<string>('');
    const [voice, setVoice] = useState<TtsVoice>('Kore');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!text) {
            setError('Please enter text to generate audio.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAudioUrl(null);

        try {
            const base64Audio = await generateAudio(text, voice);
            const audioBytes = decode(base64Audio);
            
            // FIX: Correctly process raw PCM audio data.
            // The API returns raw PCM audio, which needs to be put into a container like WAV to be played in a browser.
            const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioCtor({ sampleRate: 24000 });
            const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
            const wavBlob = bufferToWav(audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);
        } catch (err: any) {
            setError(`An error occurred: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [text, voice]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">AI Audio Generator (Text-to-Speech)</h2>
                <p className="text-gray-400">Turn text into realistic speech. Perfect for voiceovers and audio content.</p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
                <div className="bg-gray-700 p-4 rounded-lg">
                    <label htmlFor="tts-text" className="block text-sm font-medium text-gray-300 mb-2">1. Enter Your Text</label>
                    <textarea id="tts-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., Hello, welcome to the future of creative AI." className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={5}></textarea>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                    <label htmlFor="tts-voice" className="block text-sm font-medium text-gray-300 mb-2">2. Choose a Voice</label>
                    <select id="tts-voice" value={voice} onChange={(e) => setVoice(e.target.value as TtsVoice)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        {voices.map((v) => (
                            <option key={v.value} value={v.value}>{v.name}</option>
                        ))}
                    </select>
                </div>

                <button onClick={handleSubmit} disabled={isLoading || !text} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                    {isLoading ? 'Generating...' : 'Generate Audio'}
                </button>

                <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-4 min-h-[100px] mt-6">
                    {isLoading && <Loader message="Generating audio..." />}
                    {error && <p className="text-red-400">{error}</p>}
                    {audioUrl && (
                        <div className="text-center space-y-4 w-full">
                            <h3 className="text-lg font-semibold">Result</h3>
                            <audio controls src={audioUrl} className="w-full" />
                            {/* FIX: Change download file extension to .wav */}
                            <a href={audioUrl} download="generated-audio.wav" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Download Audio</a>
                        </div>
                    )}
                    {!isLoading && !audioUrl && !error && (
                        <div className="text-center text-gray-400">
                            <p>Your generated audio will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioGenerator;