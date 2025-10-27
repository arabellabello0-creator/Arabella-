
import React, { useState, useCallback } from 'react';
import { editImage } from '../services/geminiService';
import Loader from './Loader';

const ImageEditor: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            setResultImage(null);
            setError(null);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = (reader.result as string).split(',')[1];
                resolve(result);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleSubmit = useCallback(async () => {
        if (!imageFile || !prompt) {
            setError('Please upload an image and provide an editing prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const imageData = await fileToBase64(imageFile);
            const editedImageData = await editImage(prompt, imageData, imageFile.type);
            setResultImage(`data:image/jpeg;base64,${editedImageData}`);
        } catch (err: any) {
            setError(`An error occurred: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [imageFile, prompt]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Smart Image Editor</h2>
                <p className="text-gray-400">Upload a photo and describe the changes you want to make.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Upload Image</label>
                        <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"/>
                    </div>

                    {previewUrl && (
                        <div className="mt-4">
                            <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg object-contain max-h-64" />
                        </div>
                    )}

                    <div className="bg-gray-700 p-4 rounded-lg">
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">2. Describe Your Edit</label>
                        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Change the background to a sunny beach" className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3}></textarea>
                    </div>

                    <button onClick={handleSubmit} disabled={isLoading || !imageFile || !prompt} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                        {isLoading ? 'Editing...' : 'Apply Edit'}
                    </button>
                </div>
                
                <div className="flex items-center justify-center bg-gray-700/50 rounded-lg p-4 min-h-[300px]">
                    {isLoading && <Loader message="Applying smart edits..." />}
                    {error && <p className="text-red-400">{error}</p>}
                    {resultImage && (
                        <div className="text-center space-y-4">
                            <h3 className="text-lg font-semibold">Result</h3>
                            <img src={resultImage} alt="Edited result" className="w-full h-auto rounded-lg object-contain max-h-80" />
                            <a href={resultImage} download="edited-image.jpg" className="inline-block bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Download Image</a>
                        </div>
                    )}
                    {!isLoading && !resultImage && !error && (
                        <div className="text-center text-gray-400">
                             <p>Your edited image will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageEditor;
