import './App.css'
import FileUploader from "./components/FileUploader.tsx";

function App() {
  return (
    <div className="min-h-screen gradient-winter-bg">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgb(59 130 246) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgb(245 158 11) 0%, transparent 50%)`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <header className="pt-8 sm:pt-12 pb-6 sm:pb-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Brand Area */}
            <div className="mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                {/* Audio Wave Icon */}
                <div className="flex items-end gap-0.5 sm:gap-1 h-6 sm:h-8">
                  <div className="w-0.5 sm:w-1 bg-winter-blue-500 animate-waveform" style={{ height: '6px', animationDelay: '0ms' }} />
                  <div className="w-0.5 sm:w-1 bg-winter-blue-600 animate-waveform" style={{ height: '12px', animationDelay: '100ms' }} />
                  <div className="w-0.5 sm:w-1 bg-winter-blue-500 animate-waveform" style={{ height: '8px', animationDelay: '200ms' }} />
                  <div className="w-0.5 sm:w-1 bg-winter-blue-700 animate-waveform" style={{ height: '16px', animationDelay: '300ms' }} />
                  <div className="w-0.5 sm:w-1 bg-winter-blue-500 animate-waveform" style={{ height: '4px', animationDelay: '400ms' }} />
                </div>

                {/* Snowflake Icon */}
                <div className="text-warm-amber-500 text-xl sm:text-2xl">❄️</div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-winter-blue-900 via-winter-blue-600 to-winter-blue-500 bg-clip-text text-transparent mb-2">
                SnowBooks
              </h1>

              <div className="w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-winter-blue-500 to-warm-amber-500 mx-auto rounded-full mb-3 sm:mb-4" />
            </div>

            {/* Subtitle */}
            <div className="max-w-2xl mx-auto px-2 sm:px-0">
              <p className="text-base sm:text-lg lg:text-xl text-ice-gray-600 font-medium leading-relaxed mb-2">
                Professional Audio Processing Studio
              </p>
              <p className="text-sm sm:text-base text-ice-gray-500 leading-relaxed">
                Upload ZIP files containing MP3 chapters to add white noise and create the perfect ambient listening experience
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm text-ice-gray-600">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-success rounded-full flex-shrink-0" />
                <span>High-Quality Processing</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-winter-blue-500 rounded-full flex-shrink-0" />
                <span>Real-time Progress</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-warm-amber-500 rounded-full flex-shrink-0" />
                <span>Batch Processing</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Application */}
        <main className="px-2 sm:px-4 pb-8 sm:pb-12">
          <div className="max-w-5xl mx-auto">
            <FileUploader />
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-ice-gray-200">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-ice-gray-500">
              Built with ❤️ for audiobook enthusiasts • Powered by FFmpeg
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
