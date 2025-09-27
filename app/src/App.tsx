import './App.css'
import FileUploader from "./components/FileUploader.tsx";
import PerformanceReport from "./components/PerformanceReport.tsx";
import { useState } from 'react';

function App() {
  const [showPerformanceReport, setShowPerformanceReport] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-bold">SnowBooks</h1>
            <p className="text-muted-foreground">
              Upload ZIP files containing MP3 chapters to add white noise and process audio
            </p>

            {/* Performance Report Toggle */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => setShowPerformanceReport(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !showPerformanceReport
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📱 Audio Processor
              </button>
              <button
                onClick={() => setShowPerformanceReport(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showPerformanceReport
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Performance Report
              </button>
            </div>
          </header>

          {showPerformanceReport ? <PerformanceReport /> : <FileUploader />}
        </div>
      </div>
    </div>
  )
}

export default App
