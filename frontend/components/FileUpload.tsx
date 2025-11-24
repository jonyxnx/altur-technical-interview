'use client';

interface FileUploadButtonProps {
  onClick: () => void;
  isUploading?: boolean;
}

export default function FileUploadButton({ onClick, isUploading = false }: FileUploadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isUploading}
      className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #237bff, #9ec5ff)' }}
      title={isUploading ? 'Uploading...' : 'Upload audio file'}
    >
      {/* Shine effect on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      
      {isUploading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="relative z-10">Uploading...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span className="relative z-10">Upload</span>
        </>
      )}
    </button>
  );
}

