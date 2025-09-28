import './App.css'
import FileUploader from "./components/FileUploader.tsx";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-bold">SnowBooks</h1>
            <p className="text-muted-foreground">
              Upload ZIP files containing MP3 chapters to add white noise and process audio
            </p>
          </header>

          <FileUploader />
        </div>
      </div>
    </div>
  )
}

export default App
