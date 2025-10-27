
import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import Loader from './Loader';
import { AspectRatio } from '../types';

const aspectRatios: { label: string; value: AspectRatio }[] = [
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Landscape (16:9)', value: '16:9' },
    { label: 'Portrait (9:16)', value: '9:16' },
    { label: 'Wide (4:3)', value: '4:3' },
    { label: 'Tall (3:4)', value: '3:4' },
];

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a prompt to generate an image.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const generatedImageData = await generateImage(prompt, aspectRatio);
            setResultImage(`data:image/jpeg;base64,${generatedImageData}`);
        } catch (err: any) {
            setError(`An error occurred: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aspectRatio]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">AI Image Generator</h2>
                <p className="text-gray-400">Describe the image you want to create, from realistic photos to artistic styles.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <label htmlFor="gen-prompt" className="block text-sm font-medium text-gray-300 mb-2">1. Enter Your Prompt</label>
                        <textarea id="gen-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A cinematic photo of a robot reading a book in a lush forest" className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={4}></textarea>
                    </div>

                    <div className="bg-gray-700 p-4 rounded-lg">
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">2. Select Aspect Ratio</label>
                        <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            {aspectRatios.map((ar) => (
                                <option key={ar.value} value={ar.value}>{ar.label}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handleSubmit} disabled={isLoading || !prompt} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                </div>

                <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-4 min-h-[300px]">
                    {isLoading && <Loader message="Generating your image..." />}
                    {error && <p className="text-red-400">{error}</p>}
                    {resultImage && (
                        <div className="text-center space-y-4">
                            <h3 className="text-lg font-semibold">Result</h3>
                            <img src={resultImage} alt="Generated result" className="w-full h-auto rounded-lg object-contain max-h-96" />
                            <a href={resultImage} download="generated-image.jpg" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Download Image</a>
                        </div>
                    )}
                    {!isLoading && !resultImage && !error && (
                         <div className="text-center text-gray-400">
                             <p>Your generated image will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;
