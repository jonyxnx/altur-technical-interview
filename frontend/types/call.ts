export interface Call {
  id: string;
  filename: string;
  uploadTimestamp: string;
  transcript: string;
  summary: string;
  tags: string[];
}

export interface CallFilters {
  tag?: string;
  sortBy?: 'uploadTimestamp';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadResponse {
  id: string;
  message: string;
}

