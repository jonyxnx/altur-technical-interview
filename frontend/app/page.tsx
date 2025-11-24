'use client';

import { useState } from 'react';
import CallsList from '@/components/CallsList';
import Header from '@/components/Header';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleUploadSuccess = (callId: string) => {
    setUploadSuccess(`File uploaded successfully! Processing call ${callId}...`);
    setRefreshTrigger((prev) => prev + 1);

    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl relative z-10">

        {uploadSuccess && (
          <div 
            className="mb-6 mx-auto max-w-2xl p-3 border border-blue-200 rounded-lg"
            style={{ background: 'linear-gradient(90deg, rgba(35, 123, 255, 0.1), rgba(158, 197, 255, 0.1))' }}
          >
            <p className="text-sm text-gray-900 font-medium">{uploadSuccess}</p>
          </div>
        )}

        {/* Calls List Section */}
        <section>
          <CallsList 
            refreshTrigger={refreshTrigger}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </section>
      </main>
    </div>
  );
}
