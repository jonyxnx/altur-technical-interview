'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCalls, getAvailableTags, CallRecord, ApiError, getAudioUrl } from '@/lib/api';
import CustomSelect from '@/components/CustomSelect';
import FileUploadButton from '@/components/FileUpload';
import UploadModal from '@/components/UploadModal';

interface CallsListProps {
  refreshTrigger?: number;
  onUploadSuccess?: (callId: string) => void;
  onUploadError?: (error: string) => void;
}

export default function CallsList({ refreshTrigger, onUploadSuccess, onUploadError }: CallsListProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCalls();
    loadTags();
  }, [selectedTag, sortOrder, refreshTrigger]);

  const loadCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCalls({
        tag: selectedTag || undefined,
        sort: sortOrder,
      });
      setCalls(response.calls || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : 'Failed to load calls. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await getAvailableTags();
      setAvailableTags(tags || []);
    } catch (err) {
      // Silently fail for tags, not critical
      console.error('Failed to load tags:', err);
    }
  };

  const handleCallClick = (callId: string) => {
    router.push(`/calls/${callId}`);
  };

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 space-y-4">
        {/* Top bar with title and upload button */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Processed Calls
              <span className="text-gray-500 font-normal ml-2">({calls.length})</span>
            </h2>
          </div>
          <div className="w-full sm:w-auto">
            <FileUploadButton 
              onClick={() => setIsUploadModalOpen(true)}
            />
          </div>
        </div>
        
        {/* Upload Modal */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={(callId) => {
            onUploadSuccess?.(callId);
            loadCalls();
          }}
          onUploadError={onUploadError}
        />
        
        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:max-w-xl">
          {/* Tag Filter */}
          <div className="relative w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Filter by Tag
            </label>
            <CustomSelect
              value={selectedTag}
              onChange={(value) => setSelectedTag(value)}
              options={[
                { value: '', label: 'All Tags' },
                ...availableTags.map((tag) => ({ value: tag, label: tag })),
              ]}
              placeholder="All Tags"
              className="w-full"
            />
          </div>

          {/* Sort Order */}
          <div className="relative w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Sort Order
            </label>
            <CustomSelect
              value={sortOrder}
              onChange={(value) => setSortOrder(value as 'newest' | 'oldest')}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
              ]}
              placeholder="Sort by..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading calls...
        </div>
      ) : calls.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {selectedTag
            ? `No calls found with tag "${selectedTag}"`
            : 'No calls processed yet. Upload an audio file to get started.'}
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <CallListItem 
              key={call.id} 
              call={call} 
              onCallClick={handleCallClick}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CallListItemProps {
  call: CallRecord;
  onCallClick: (callId: string) => void;
  formatDate: (timestamp: string) => string;
}

function CallListItem({ call, onCallClick, formatDate }: CallListItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(getAudioUrl(call.id));
    audioRef.current = audio;
    
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setAudioError(true);
      setIsPlaying(false);
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [call.id]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setAudioError(true);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  return (
    <div
      onClick={() => onCallClick(call.id)}
      className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer hover:bg-gradient-to-r hover:from-[rgba(35,123,255,0.03)] hover:to-[rgba(158,197,255,0.03)] active:scale-[0.99]"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 w-full">
          {/* Play Button */}
          <button
            onClick={handlePlayClick}
            disabled={audioError}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{ background: audioError ? '#9ca3af' : 'linear-gradient(90deg, #237bff, #9ec5ff)' }}
            title={audioError ? 'Audio unavailable' : isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {call.filename}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(call.upload_timestamp)}
              </p>
            </div>
            {call.summary && (
              <p className="text-gray-700 text-sm sm:text-xs line-clamp-2">
                {call.summary}
              </p>
            )}
            {call.tags && call.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {call.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5 group-hover:text-gray-700 transition-colors self-end sm:self-auto">
          <span className="font-medium">View</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
