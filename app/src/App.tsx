
import FileUploader from "./components/FileUploader.tsx";

function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Screen Reader Announcements - Hidden from visual users */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcements">
        {/* Dynamic announcements will be inserted here */}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" id="urgent-announcements">
        {/* Urgent announcements will be inserted here */}
      </div>


      {/* Main Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <header className="pt-8 sm:pt-12 pb-6 sm:pb-8 px-4" role="banner">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Brand Area */}
            <div className="mb-4 sm:mb-6">

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold bg-gradient-to-r from-winter-blue-900 via-winter-blue-600 to-winter-blue-500 bg-clip-text text-transparent mb-2">
                SnowBooks
              </h1>

              <div className="w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-winter-blue-500 to-warm-amber-500 mx-auto rounded-full mb-3 sm:mb-4" aria-hidden="true" />
            </div>

            {/* Subtitle */}
            <div className="max-w-2xl mx-auto px-2 sm:px-0">
              <h2 className="text-base sm:text-lg lg:text-xl text-ice-gray-600 font-medium leading-relaxed mb-2">
                Professional Audio Processing Studio
              </h2>
              <p className="text-sm sm:text-base text-ice-gray-500 leading-relaxed">
                Upload ZIP files containing MP3 chapters to add white noise and create the perfect ambient listening experience
              </p>
            </div>

          </div>
        </header>

        {/* Main Application */}
        <main className="px-2 sm:px-4 pb-8 sm:pb-12" id="main-content" role="main">
          <div className="max-w-5xl mx-auto">
            <h2 className="sr-only">Audio Processing Workflow</h2>
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
