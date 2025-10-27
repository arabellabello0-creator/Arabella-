
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateVideo, checkVideoStatus } from '../services/geminiService';
import { useVeoApiKey } from '../hooks/useVeoApiKey';
import Loader from './Loader';
import { AspectRatio, VideoResolution } from '../types';

const loadingMessages = [
    "Warming up the digital director...",
    "Rendering pixels into motion...",
    "Choreographing virtual actors...",
    "This can take a few minutes, please wait...",
    "Adding cinematic magic...",
    "Finalizing the high-definition cut...",
];

const aspectRatios: { label: string; value: AspectRatio }[] = [
    { label: 'Landscape (16:9)', value: '16:9' },
    { label: 'Portrait (9:16)', value: '9:16' },
];

const resolutions: { label: string; value: VideoResolution }[] = [
    { label: 'HD (720p)', value: '720p' },
    { label: 'Full HD (1080p)', value: '1080p' },
];

const VideoGenerator: React.FC = () => {
    const { isKeyAvailable, isChecking, selectKey, resetKeyState } = useVeoApiKey();
    
    const [prompt, setPrompt] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [resolution, setResolution] = useState<VideoResolution>('1080p');
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pollingRef = useRef<number | null>(null);
    const messageIntervalRef = useRef<number | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
            messageIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            setResultVideoUrl(null);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = (err) => reject(err);
        });
    };
    
    const handleSubmit = useCallback(async () => {
        if (!prompt && !imageFile) {
            setError('Please enter a prompt or upload an image to generate a video.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        messageIntervalRef.current = window.setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 5000);

        try {
            const imagePayload = imageFile ? { data: await fileToBase64(imageFile), mimeType: imageFile.type } : undefined;
            let operation = await generateVideo({ prompt, image: imagePayload, aspectRatio, resolution });

            pollingRef.current = window.setInterval(async () => {
                try {
                    operation = await checkVideoStatus(operation);
                    if (operation.done) {
                        stopPolling();
                        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                        if (downloadLink) {
                            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                            const videoBlob = await response.blob();
                            const videoUrl = URL.createObjectURL(videoBlob);
                            setResultVideoUrl(videoUrl);
                        } else {
                            throw new Error("Video generation completed but no download link was found.");
                        }
                        setIsLoading(false);
                    }
                } catch (pollError: any) {
                    if (pollError.message.includes("Requested entity was not found.")) {
                        setError("API Key error. Please re-select your API key.");
                        resetKeyState();
                    } else {
                        setError(`An error occurred while checking status: ${pollError.message}`);
                    }
                    stopPolling();
                    setIsLoading(false);
                }
            }, 10000);

        } catch (err: any) {
            if (err.message.includes("API key not valid")) {
                setError("Your API Key is not valid. Please select a valid key.");
                resetKeyState();
            } else {
                setError(`An error occurred: ${err.message}`);
            }
            stopPolling();
            setIsLoading(false);
        }
    }, [prompt, imageFile, aspectRatio, resolution, resetKeyState, stopPolling]);

    if (isChecking) {
        return <Loader message="Checking API key status..." />;
    }

    if (!isKeyAvailable) {
        return (
            <div className="text-center p-8 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-300 mb-4">API Key Required for Video Generation</h3>
                <p className="mb-6 text-yellow-200">The high-quality video generation feature requires you to select an API key. This will be used for billing purposes.</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline mb-6 block">Learn more about billing</a>
                <button onClick={selectKey} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    Select API Key
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">AI Video Generator</h2>
                <p className="text-gray-400">Generate 1080p videos from a text prompt or animate an uploaded image.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <div className="bg-gray-700 p-4 rounded-lg">
                        <label htmlFor="vid-prompt" className="block text-sm font-medium text-gray-300 mb-2">1. Describe Your Video</label>
                        <textarea id="vid-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A neon hologram of a cat driving a car at top speed" className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md" rows={3}></textarea>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg">
                        <label htmlFor="vid-image-upload" className="block text-sm font-medium text-gray-300 mb-2">2. (Optional) Animate an Image</label>
                        <input id="vid-image-upload" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"/>
                         {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-40 mt-4" />}
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="vid-aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                            <select id="vid-aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md">
                                {aspectRatios.map(ar => <option key={ar.value} value={ar.value}>{ar.label}</option>)}
                            </select>
                        </div>
                        <div>
                           <label htmlFor="vid-resolution" className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                            <select id="vid-resolution" value={resolution} onChange={(e) => setResolution(e.target.value as VideoResolution)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md">
                                {resolutions.map(res => <option key={res.value} value={res.value}>{res.label}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <button onClick={handleSubmit} disabled={isLoading || (!prompt && !imageFile)} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                        {isLoading ? 'Generating...' : 'Generate Video'}
                    </button>
                </div>
                
                <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-4 min-h-[300px]">
                    {isLoading && <Loader message={loadingMessage} />}
                    {error && <p className="text-red-400">{error}</p>}
                    {resultVideoUrl && (
                        <div className="text-center space-y-4 w-full">
                            <h3 className="text-lg font-semibold">Result</h3>
                            <video src={resultVideoUrl} controls autoPlay loop className="w-full h-auto rounded-lg max-h-96" />
                            <a href={resultVideoUrl} download="generated-video.mp4" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Download Video</a>
                        </div>
                    )}
                     {!isLoading && !resultVideoUrl && !error && (
                         <div className="text-center text-gray-400">
                             <p>Your generated video will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
