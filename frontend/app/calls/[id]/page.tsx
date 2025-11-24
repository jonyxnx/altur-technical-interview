'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCallById, CallRecord, ApiError } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;
  
  const [call, setCall] = useState<CallRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (callId) {
      loadCall();
    }
  }, [callId]);

  const loadCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const callData = await getCallById(callId);
      setCall(callData);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to load call details. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8 sm:py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex justify-center items-center py-10 sm:py-12">
            <div className="text-gray-500">Loading call details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-8 sm:py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(90deg, #237bff, #9ec5ff)' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-white py-8 sm:py-12 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center py-10 sm:py-12 text-gray-500">
            Call not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
     
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Calls
        </button>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200" style={{ background: 'linear-gradient(90deg, rgba(35, 123, 255, 0.05), rgba(158, 197, 255, 0.05))' }}>
            <h1 className="text-lg font-semibold mb-1.5 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #237bff, #9ec5ff)' }}>
              {call.filename}
            </h1>
            <p className="text-xs text-gray-500">
              Uploaded: {formatDate(call.upload_timestamp)}
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Audio Player */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Audio
              </h2>
              <AudioPlayer callId={call.id} filename={call.filename} />
            </div>

            {/* Tags */}
            {call.tags && call.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {call.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {call.summary && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Summary
                </h2>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">
                    {call.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Transcript */}
            {call.transcript ? (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Transcript
                </h2>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">
                    {call.transcript}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Transcript
                </h2>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-500 text-xs">
                    Transcript not available
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Metadata
              </h2>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <dl className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row">
                    <dt className="font-medium text-gray-700 sm:w-32 text-xs">
                      File Name:
                    </dt>
                    <dd className="text-gray-600 text-xs">{call.filename}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row">
                    <dt className="font-medium text-gray-700 sm:w-32 text-xs">
                      Upload Timestamp:
                    </dt>
                    <dd className="text-gray-600 text-xs">
                      {formatDate(call.upload_timestamp)}
                    </dd>
                  </div>
                  <div className="flex flex-col sm:flex-row">
                    <dt className="font-medium text-gray-700 sm:w-32 text-xs">
                      Call ID:
                    </dt>
                    <dd className="text-gray-600 font-mono text-xs">
                      {call.id}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

