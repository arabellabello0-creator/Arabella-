
import React, { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import AudioGenerator from './components/AudioGenerator';
import { EditIcon, GenerateIcon, VideoIcon, AudioIcon } from './components/icons/Icons';
import TabButton from './components/TabButton';

type Tab = 'edit-image' | 'generate-image' | 'generate-video' | 'generate-audio';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('edit-image');

  const renderContent = () => {
    switch (activeTab) {
      case 'edit-image':
        return <ImageEditor />;
      case 'generate-image':
        return <ImageGenerator />;
      case 'generate-video':
        return <VideoGenerator />;
      case 'generate-audio':
        return <AudioGenerator />;
      default:
        return <ImageEditor />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Gemini Creative Studio
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 flex flex-col">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-6">
            <TabButton 
              label="Edit Image" 
              icon={<EditIcon />}
              isActive={activeTab === 'edit-image'} 
              onClick={() => setActiveTab('edit-image')} 
            />
            <TabButton 
              label="Generate Image" 
              icon={<GenerateIcon />}
              isActive={activeTab === 'generate-image'} 
              onClick={() => setActiveTab('generate-image')} 
            />
            <TabButton 
              label="Generate Video" 
              icon={<VideoIcon />}
              isActive={activeTab === 'generate-video'} 
              onClick={() => setActiveTab('generate-video')} 
            />
            <TabButton 
              label="Generate Audio" 
              icon={<AudioIcon />}
              isActive={activeTab === 'generate-audio'} 
              onClick={() => setActiveTab('generate-audio')} 
            />
          </div>
          
          <div className="bg-gray-800 rounded-xl shadow-2xl p-4 md:p-8">
            {renderContent()}
          </div>
        </div>
      </main>
       <footer className="text-center py-4 text-gray-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
    </div>
  );
};

export default App;
