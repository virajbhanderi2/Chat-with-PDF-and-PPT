# 📚 Chat with PDF - Enterprise AI Document Assistant

A professional, production-ready RAG (Retrieval-Augmented Generation) system that enables intelligent question-answering over PDF documents using advanced AI technology.

## 🎯 Features

- **📄 PDF Document Processing**: Upload and extract text from PDF documents
- **🧠 AI-Powered Q&A**: Ask questions and get accurate answers based on document content
- **🔍 Semantic Search**: Advanced vector embeddings for intelligent document retrieval
- **🏢 Enterprise-Grade**: Professional architecture with logging, error handling, and configuration management
- **🔒 Secure**: Input validation, file sanitization, and security best practices
- **📊 Monitoring**: Health check endpoints and comprehensive logging
- **🎨 Modern UI**: Professional, responsive web interface

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │  HTML/CSS/JavaScript
│  (Browser)  │
└──────┬──────┘
       │ HTTP/REST API
       ▼
┌─────────────┐
│ Flask API   │  REST Endpoints
│  (app.py)   │
└──────┬──────┘
       │
       ├─► PDF Extraction (PyPDF2)
       ├─► Text Chunking (LangChain)
       ├─► Embeddings (HuggingFace)
       ├─► Vector DB (FAISS)
       └─► LLM (Ollama)
```

## 📋 Prerequisites

- **Python 3.11+**
- **Ollama** installed and running
- **Ollama Model**: `gpt-oss:20b-cloud` (or your preferred model)

### Installing Ollama

1. Download from [ollama.com](https://ollama.com)
2. Install and start Ollama
3. Pull the model:
   ```bash
   ollama pull gpt-oss:20b-cloud
   ```

## 🚀 Quick Start

### 1. Clone/Download Project

```bash
cd Chat-With-Pdf-main
```

### 2. Create Virtual Environment (Recommended)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment (Optional)

Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

### 5. Start Backend Server

```bash
python app.py
```

Server will start on `http://127.0.0.1:5000`

### 6. Open Frontend

Open `Frontend/index.html` in your web browser, or serve it via a local server.

## 📖 API Documentation

### Base URL
```
http://127.0.0.1:5000
```

### Endpoints

#### `GET /`
Health check and API information.

**Response:**
```json
{
  "service": "Chat with PDF API",
  "version": "v1",
  "status": "operational",
  "endpoints": {...}
}
```

#### `GET /health`
Detailed health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "Chat with PDF API",
  "version": "v1",
  "document_loaded": true,
  "current_document": "example.pdf"
}
```

#### `POST /api/v1/load`
Upload and process a PDF document.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: PDF file in `file` field

**Response (Success):**
```json
{
  "success": true,
  "message": "PDF loaded and processed successfully",
  "data": {
    "chunks": 517,
    "filename": "document.pdf",
    "status": "ready"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "status_code": 400
  }
}
```

#### `POST /api/v1/ask`
Ask a question about the uploaded document.

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Body:
```json
{
  "question": "What is machine learning?"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Answer generated successfully",
  "data": {
    "answer": "Based on the document...",
    "question": "What is machine learning?",
    "document": "document.pdf"
  }
}
```

## ⚙️ Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

### Key Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | Flask environment |
| `FLASK_DEBUG` | `True` | Enable debug mode |
| `HOST` | `127.0.0.1` | Server host |
| `PORT` | `5000` | Server port |
| `MAX_FILE_SIZE` | `10485760` | Max PDF size (bytes) |
| `CHUNK_SIZE` | `400` | Text chunk size |
| `CHUNK_OVERLAP` | `150` | Chunk overlap |
| `RETRIEVAL_K` | `10` | Number of chunks to retrieve |
| `OLLAMA_MODEL` | `gpt-oss:20b-cloud` | Ollama model name |
| `LOG_LEVEL` | `INFO` | Logging level |

## 📁 Project Structure

```
Chat-With-Pdf-main/
├── Frontend/
│   ├── index.html          # Main UI
│   ├── style.css           # Styling
│   └── script.js           # Frontend logic
├── app.py                  # Flask backend
├── rag.py                  # RAG pipeline
├── config.py               # Configuration
├── utils.py                # Utility functions
├── requirements.txt        # Dependencies
├── .env.example            # Environment template
├── README.md               # This file
└── PROJECT_EXPLANATION.md  # Detailed explanation
```

## 🔧 Development

### Running in Development Mode

```bash
python app.py
```

### Running in Production

Use a production WSGI server:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Logging

Logs are output to console by default. To enable file logging, set `LOG_FILE` in `.env`:

```
LOG_FILE=logs/app.log
```

## 🧪 Testing

### Test PDF Upload

```bash
curl -X POST http://127.0.0.1:5000/api/v1/load \
  -F "file=@example.pdf"
```

### Test Question

```bash
curl -X POST http://127.0.0.1:5000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

## 🛡️ Security Features

- ✅ Input validation and sanitization
- ✅ File type and size validation
- ✅ XSS protection in responses
- ✅ CORS configuration
- ✅ Secure filename handling
- ✅ Error message sanitization

## 📊 Performance

- **Embedding Model**: `all-MiniLM-L6-v2` (384 dimensions, fast inference)
- **Vector Search**: FAISS (millisecond-level similarity search)
- **Chunking**: Overlapping chunks preserve context
- **Retrieval**: Top-K similarity search (configurable)

## 🐛 Troubleshooting

### Ollama Connection Error

**Problem**: `ConnectError: No connection could be made`

**Solution**:
1. Ensure Ollama is running: `ollama list`
2. Check model exists: `ollama pull gpt-oss:20b-cloud`
3. Verify `OLLAMA_BASE_URL` in config

### FAISS Installation Error

**Problem**: `ModuleNotFoundError: No module named 'faiss'`

**Solution**:
```bash
pip install faiss-cpu
# Or for GPU support:
pip install faiss-gpu
```

### PDF Extraction Fails

**Problem**: "Could not extract text from PDF"

**Solution**:
- PDF may be image-based (scanned). Consider OCR.
- PDF may be corrupted. Try a different file.
- Check PDF is not password-protected.

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows PEP 8 style guide
- Functions have docstrings
- Error handling is comprehensive
- Logging is appropriate

## 📧 Support

For issues or questions, please check:
1. `PROJECT_EXPLANATION.md` for detailed technical documentation
2. API documentation above
3. Troubleshooting section

## 🎓 Learning Resources

- **RAG**: [LangChain RAG Documentation](https://python.langchain.com/docs/use_cases/question_answering/)
- **Embeddings**: [HuggingFace Sentence Transformers](https://www.sbert.net/)
- **FAISS**: [Facebook AI Similarity Search](https://github.com/facebookresearch/faiss)
- **Ollama**: [Ollama Documentation](https://ollama.ai/docs)

---

**Built with ❤️ using Flask, LangChain, FAISS, and Ollama**
