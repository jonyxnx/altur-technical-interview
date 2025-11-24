const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CallRecord {
  id: string;
  filename: string;
  upload_timestamp: string;
  transcript: string;
  summary: string;
  tags: string[];
}

export interface UploadResponse {
  id: string;
  message: string;
}

export interface CallsListResponse {
  calls: CallRecord[];
  total: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorText = response.statusText;
    try {
      const errorData = await response.json();
      errorText = errorData.detail || errorData.message || errorText;
    } catch {
      errorText = await response.text().catch(() => response.statusText);
    }
    throw new ApiError(
      errorText || `HTTP error! status: ${response.status}`,
      response.status,
      response.statusText
    );
  }
  

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }
  
  return response.json();
}

export async function uploadAudioFile(file: File): Promise<UploadResponse> {
 
  const validTypes = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3'];
  const fileType = file.type || '';
  const fileName = file.name.toLowerCase();
  
  const isValidType = validTypes.includes(fileType) || 
                      fileName.endsWith('.wav') || 
                      fileName.endsWith('.mp3');
  
  if (!isValidType) {
    throw new ApiError('Invalid file type. Please upload a WAV or MP3 file.', 400);
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/calls/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

export async function getCalls(params?: {
  tag?: string;
  sort?: 'newest' | 'oldest';
}): Promise<CallsListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.tag) {
    queryParams.append('tag', params.tag);
  }
  if (params?.sort) {
    queryParams.append('sort', params.sort);
  }

  const url = `${API_BASE_URL}/api/calls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<CallsListResponse>(response);
}

export async function getCallById(id: string): Promise<CallRecord> {
  const response = await fetch(`${API_BASE_URL}/api/calls/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<CallRecord>(response);
}

export async function getAvailableTags(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/calls/tags`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<string[]>(response);
}

export function getAudioUrl(callId: string): string {
  return `${API_BASE_URL}/api/calls/${callId}/audio`;
}
