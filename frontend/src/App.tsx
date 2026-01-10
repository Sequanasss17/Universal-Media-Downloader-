import { useState } from 'react';
import Header from './components/Header';
import CategorySelector from './components/CategorySelector';
import DownloadForm from './components/DownloadForm';
import Toast from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
import DownloadProgress from './components/DownloadProgress';
import LandingPage from './components/LandingPage';
import { Platform, DownloadRequest } from './types';
import { downloadMedia, downloadFile } from './services/api';
import { useTheme } from './hooks/useTheme';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
}

interface ProgressState {
  isVisible: boolean;
  stage: 'processing' | 'downloading' | 'complete' | 'error';
  message: string;
  filename?: string;
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [showLanding, setShowLanding] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Platform | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false,
  });
  const [progress, setProgress] = useState<ProgressState>({
    isVisible: false,
    stage: 'processing',
    message: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const showProgress = (stage: ProgressState['stage'], message: string, filename?: string) => {
    setProgress({ isVisible: true, stage, message, filename });
  };

  const hideProgress = () => {
    setProgress(prev => ({ ...prev, isVisible: false }));
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const handleBackToHome = () => {
    setShowLanding(true);
    setSelectedCategory(null);
  };

  const handleDownload = async (request: DownloadRequest) => {
    setIsLoading(true);

    try {
      showProgress('processing', 'Analyzing media and preparing download...');

      // Step 1: Download media blob(s) from backend using the URL and optional media type
      const result = await downloadMedia(request.url, request.media_type);

      // If backend returned multiple files, download them sequentially
      if (Array.isArray(result)) {
        for (let i = 0; i < result.length; i++) {
          const entry = result[i];
          const fname = entry.filename || `file_${i}`;
          showProgress('downloading', `Downloading file ${i + 1} of ${result.length}...`, fname);
          downloadFile(entry.blob, fname);
        }
        showProgress('complete', 'All files downloaded', result[0]?.filename || request.filename?.trim());
      } else {
        const filenameFromServer = result.filename || request.filename?.trim() || request.url;
        showProgress('downloading', 'Downloading your media file...', filenameFromServer);
        downloadFile(result.blob, filenameFromServer);
        showProgress('complete', 'Your download is ready!', filenameFromServer);
      }

      const displayName = Array.isArray(result)
        ? (result[0]?.filename || request.filename?.trim() || request.url)
        : (result.filename || request.filename?.trim() || request.url);

      setTimeout(() => {
        hideProgress();
        showToast(`Successfully downloaded: ${displayName}`, 'success');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed - please try again';
      showProgress('error', errorMessage);

      setTimeout(() => {
        hideProgress();
        showToast(errorMessage, 'error');
      }, 3000);

      console.error('Download error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showLanding) {
    return (
      <>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <LandingPage onGetStarted={handleGetStarted} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 
                    dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-colors duration-500">

      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-96 h-96 bg-blue-200 dark:bg-blue-800 rounded-full 
                        mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 -right-4 w-96 h-96 bg-purple-200 dark:bg-purple-800 rounded-full 
                        mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-200 dark:bg-pink-800 rounded-full 
                        mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-grow p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Header showBackButton onBack={handleBackToHome} />
          
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
          
          <div className="max-w-md mx-auto">
            <DownloadForm
              selectedCategory={selectedCategory}
              onDownload={handleDownload}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Download Progress Modal */}
      <DownloadProgress
        isVisible={progress.isVisible}
        stage={progress.stage}
        message={progress.message}
        filename={progress.filename}
      />

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Footer */}
      <footer className="relative z-10 text-center py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 animate-in fade-in duration-1000 delay-2000">
          <p>• For universal media downloading</p>
          <p>• Supports Instagram, Spotify, YouTube & X/Twitter</p>
          <p>Built with ❤️</p>
        </div>

        <p className="mt-2 text-xs text-gray-400"></p>
      </footer>
    </div>
  );
}

export default App;
