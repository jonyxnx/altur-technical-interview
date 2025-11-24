import { uploadAudioFile, getCalls, getCallById, ApiError } from '../lib/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('uploadAudioFile', () => {
    it('should successfully upload a valid WAV file', async () => {
      const mockFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });
      const mockResponse = { id: '123', message: 'File uploaded successfully' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await uploadAudioFile(mockFile);
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calls/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should successfully upload a valid MP3 file', async () => {
      const mockFile = new File(['audio content'], 'test.mp3', { type: 'audio/mpeg' });
      const mockResponse = { id: '456', message: 'File uploaded successfully' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await uploadAudioFile(mockFile);
      expect(result).toEqual(mockResponse);
    });

    it('should reject invalid file types', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      await expect(uploadAudioFile(mockFile)).rejects.toThrow(ApiError);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockFile = new File(['audio content'], 'test.wav', { type: 'audio/wav' });

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid file format',
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      await expect(uploadAudioFile(mockFile)).rejects.toThrow(ApiError);
    });
  });

  describe('getCalls', () => {
    it('should fetch calls without filters', async () => {
      const mockResponse = {
        calls: [
          {
            id: '1',
            filename: 'test.wav',
            upload_timestamp: '2024-01-01T00:00:00Z',
            transcript: 'Test transcript',
            summary: 'Test summary',
            tags: ['test'],
          },
        ],
        total: 1,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await getCalls();
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calls'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should fetch calls with tag filter and sort', async () => {
      const mockResponse = { calls: [], total: 0 };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await getCalls({ tag: 'voicemail', sort: 'newest' });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('tag=voicemail'),
        expect.any(Object)
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sort=newest'),
        expect.any(Object)
      );
    });
  });

  describe('getCallById', () => {
    it('should fetch a specific call by ID', async () => {
      const mockCall = {
        id: '123',
        filename: 'test.wav',
        upload_timestamp: '2024-01-01T00:00:00Z',
        transcript: 'Test transcript',
        summary: 'Test summary',
        tags: ['test'],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCall,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await getCallById('123');
      expect(result).toEqual(mockCall);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calls/123'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle 404 errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Call not found',
        headers: new Headers({ 'content-type': 'text/plain' }),
      });

      await expect(getCallById('nonexistent')).rejects.toThrow(ApiError);
    });
  });
});

