import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine
import os

# Set test environment variables
os.environ["OPENAI_API_KEY"] = "test-key"  # Mock key for testing

# Create test database
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "App is running fine :)"


def test_get_calls_empty():
    """Test getting calls when database is empty"""
    response = client.get("/api/calls")
    assert response.status_code == 200
    data = response.json()
    assert "calls" in data
    assert "total" in data
    assert data["total"] == 0


def test_get_tags_empty():
    """Test getting tags when database is empty"""
    response = client.get("/api/calls/tags")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_call():
    """Test getting a call that doesn't exist"""
    response = client.get("/api/calls/nonexistent-id")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_upload_invalid_file_type():
    """Test uploading an invalid file type"""
    files = {"file": ("test.txt", b"test content", "text/plain")}
    response = client.post("/api/calls/upload", files=files)
    assert response.status_code == 400
    assert "invalid file type" in response.json()["detail"].lower()


def test_upload_empty_file():
    """Test uploading an empty file"""
    files = {"file": ("test.wav", b"", "audio/wav")}
    response = client.post("/api/calls/upload", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

