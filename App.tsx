import React, { useState, useCallback } from 'react';
import { AppState } from './types';
import { generateFunnyImage } from './services/geminiService';
import Header from './components/Header';
import WebcamCapture from './components/WebcamCapture';
import ResultDisplay from './components/ResultDisplay';
import { CameraIcon, XCircleIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartCamera = () => {
    setAppState(AppState.CAMERA_LOADING);
    setCapturedImage(null);
    setGeneratedImage(null);
    setError(null);
  };
  
  const handleCameraReady = useCallback(() => {
    setAppState(AppState.CAMERA_ON);
  }, []);

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setAppState(AppState.CAPTURED);
  };

  const handleGenerateImage = async () => {
    if (!capturedImage) return;

    setAppState(AppState.GENERATING);
    setGeneratedImage(null);
    setError(null);

    try {
      const image = await generateFunnyImage(capturedImage);
      setGeneratedImage(image);
      setAppState(AppState.RESULT);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate image. ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setCapturedImage(null);
    setGeneratedImage(null);
    setError(null);
  };
  
  const handleRetake = () => {
    setAppState(AppState.CAMERA_LOADING);
    setCapturedImage(null);
    setGeneratedImage(null);
    setError(null);
  };

  const handleCameraError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setAppState(AppState.ERROR);
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.IDLE:
        return (
          <div className="text-center">
            <button
              onClick={handleStartCamera}
              className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold text-xl rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-opacity-75 transition-all transform hover:scale-105"
            >
              <CameraIcon className="w-8 h-8" />
              Start Camera
            </button>
          </div>
        );
      case AppState.CAMERA_LOADING:
      case AppState.CAMERA_ON:
        return (
          <WebcamCapture
            onCapture={handleCapture}
            onCameraReady={handleCameraReady}
            onCameraError={handleCameraError}
            isLoading={appState === AppState.CAMERA_LOADING}
          />
        );
      case AppState.CAPTURED:
      case AppState.GENERATING:
      case AppState.RESULT:
        return (
          <ResultDisplay
            originalImage={capturedImage!}
            generatedImage={generatedImage}
            isLoading={appState === AppState.GENERATING}
            onGenerateImage={handleGenerateImage}
            onRetake={handleRetake}
          />
        );
      case AppState.ERROR:
        return (
          <div className="text-center p-8 bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
            <XCircleIcon className="w-16 h-16 mx-auto text-red-400" />
            <h3 className="mt-4 text-2xl font-bold text-white">An Error Occurred</h3>
            <p className="mt-2 text-red-200">{error}</p>
            <button
              onClick={handleReset}
              className="mt-6 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              Start Over
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by React, Tailwind CSS, and the Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
