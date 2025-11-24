# Audio Transcription & Analysis

A full-stack web application for uploading audio files, transcribing them using AI, and analyzing the transcripts to generate summaries and tags.

## Features

- **Audio Upload**: Upload WAV or MP3 files (up to 50MB) and compression to MP3 for wav files.
- **Speech-to-Text**: Automatic transcription using OpenAI Whisper
- **AI Analysis**: Generate summaries and extract tags using GPT-3.5
- **Call Management**: View, filter, and search processed calls
- **RESTful API**: Complete backend API with filtering and sorting

## Tech Stack

### Frontend
- Next.js 16 with TypeScript
- Tailwind CSS
- React 19

### Backend
- FastAPI (Python)
- SQLAlchemy (ORM)
- SQLite (default) / PostgreSQL
- OpenAI API (Whisper + GPT-3.5)

## Quick Start

### Prerequisites

- Node.js 22+
- Python 3.13+
- OpenAI API key
- ffmpeg
- `uv` package manager 
- Docker (optional)

### Local Development

#### 1. Backend Setup

```bash
cd backend

uv sync

echo "OPENAI_API_KEY=your_key_here" > .env

uv run uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

You can see docs in `http://localhost:8000/docs` or `http://localhost:8000/redoc`
#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Docker (Optional)

```bash
# Create .env file in root
echo "OPENAI_API_KEY=your_key_here" > .env

# Start services
docker compose up --build
```

Note: to avoid confussions between your local env and linux docker env you will need to remove .venv (backend )folder and node_modules (frontend)

## Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI application
│   ├── database.py           # Database models
│   ├── models.py             # Pydantic models
│   ├── routes/
│   │   └── calls.py         # API routes
│   ├── services/
│   │   ├── stt_service.py   # Speech-to-Text
│   │   └── llm_service.py   # LLM analysis
│   └── tests/               # Test suite
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   └── lib/                 # API client
└── docker-compose.yml       # Docker setup
```

## API Endpoints

- `POST /api/calls/upload` - Upload audio file
- `GET /api/calls` - List all calls (with tag filter and sort)
- `GET /api/calls/{id}` - Get call details
- `GET /api/calls/tags` - Get all available tags

See [backend/README.md](backend/README.md) for detailed API documentation.

## Testing

### Backend Tests
```bash
cd backend
uv run pytest tests/
```
Note: To avoid conflicts between your local environment and the Linux Docker environment, make sure to delete the .venv folder in the backend and the node_modules folder in the frontend before building the containers.

## Environment Variables

### Backend
- `OPENAI_API_KEY` (required): OpenAI API key


### Frontend
- `NEXT_PUBLIC_API_URL` (optional): Backend API URL (default: http://localhost:8000)

## Architecture Decisions

1. **SQLite by default**: Simple setup, no external dependencies
2. **Synchronous processing**: Files processed immediately (can be async in production)
3. **OpenAI API**: High-quality STT and LLM analysis
4. **RESTful API**: Standard REST endpoints for frontend integration
5. **Type safety**: TypeScript frontend + Pydantic backend

## Assumptions

1. OpenAI API key is available
2. Single-user application (no auth)
3. Local file storage 
4. English language optimized (Whisper supports multiple languages)
5. It will only support 

## Improvements for Production

- Background job processing (Celery)
- Cloud file storage (S3)
- User authentication
- Rate limiting
- Database migrations (Alembic)
- Monitoring and logging
- WebSocket for real-time updates
- Pagination for large datasets
