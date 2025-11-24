'use client';

export default function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex items-center justify-between h-12 sm:h-14">
          <h1 
            className="text-base sm:text-lg font-medium tracking-tight text-gray-900 truncate"
          >
            Audio Transcription & Analysis
          </h1>
        </div>
      </div>
    </header>
  );
}

