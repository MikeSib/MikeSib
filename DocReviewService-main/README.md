# Document Review Service

A modern web application for uploading, storing, and managing PDF documents using React frontend, Python Flask backend, and MinIO object storage.

## 🌟 Features

- **Modern React Frontend**: Beautiful, responsive UI with drag-and-drop file upload
- **Python Flask Backend**: Robust REST API built with Flask and Python
- **PDF File Upload**: Secure upload of PDF documents with file validation
- **MinIO Storage**: Reliable object storage using MinIO Docker container
- **File Management**: View, download, and delete uploaded documents
- **Progress Tracking**: Real-time upload progress indication
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Python Flask   │    │  MinIO Storage  │
│   (Port 3000)    │◄──►│   Backend       │◄──►│   (Port 9000)   │
│                 │    │   (Port 3001)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Python](https://www.python.org/) (v3.11 or higher) - for local development
- [Node.js](https://nodejs.org/) (v18 or higher) - for frontend development

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DocReviewService
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - MinIO Console: http://localhost:9001 (admin/minio123456)

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Start MinIO using Docker**
   ```bash
   docker-compose up -d minio
   ```

3. **Start the backend**
   ```bash
   cd backend
   python app.py
   # or use the development runner
   python run.py
   ```

4. **Start the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm start
   ```

## 📁 Project Structure

```
DocReviewService/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── FileUpload.js
│   │   │   └── FileList.js
│   │   ├── App.js           # Main App component
│   │   ├── App.css          # App styles
│   │   ├── index.js         # React entry point
│   │   └── index.css        # Global styles
│   ├── Dockerfile           # Frontend Docker configuration
│   └── package.json         # Frontend dependencies
├── backend/                 # Python Flask backend API
│   ├── app.py               # Flask application
│   ├── run.py               # Development runner
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Production Docker configuration
│   └── Dockerfile.dev       # Development Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── package.json             # Root package.json with scripts
└── README.md               # This file
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload PDF file |
| GET | `/files` | List all uploaded files |
| GET | `/download/:fileName` | Download specific file |
| DELETE | `/files/:fileName` | Delete specific file |

## 🎯 Usage

### Uploading Files

1. **Drag and Drop**: Drag a PDF file onto the upload area
2. **Click to Select**: Click the upload area to browse for files
3. **Upload**: Click the "Upload File" button
4. **Progress**: Watch the upload progress bar

### Managing Files

- **View Files**: All uploaded files are listed in the right panel
- **Download**: Click the download button to save files locally
- **Delete**: Click the delete button to remove files (with confirmation)

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
FLASK_ENV=development
FLASK_DEBUG=1
PORT=3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=minio123456
MINIO_BUCKET_NAME=pdf-documents
MINIO_SECURE=false
```

#### Docker Environment
The Docker Compose file includes all necessary environment variables.

### MinIO Configuration

- **Access Key**: `admin`
- **Secret Key**: `minio123456`
- **Bucket Name**: `pdf-documents`
- **Console**: http://localhost:9001

## 🛡️ Security Features

- **File Type Validation**: Only PDF files are accepted
- **File Size Limits**: Maximum 10MB file size
- **CORS Configuration**: Properly configured for frontend-backend communication
- **Error Handling**: Comprehensive error handling throughout the application

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Frontend (3000), Backend (3001), MinIO (9000, 9001)
   - Change ports in docker-compose.yml if needed

2. **MinIO Connection Issues**
   - Ensure MinIO container is running
   - Check network connectivity between services

3. **Upload Failures**
   - Verify file is PDF format
   - Check file size (max 10MB)
   - Ensure backend is running

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

## 📊 Monitoring

### Health Checks

- **Backend**: GET http://localhost:3001/health
- **MinIO**: Access console at http://localhost:9001

### Logs

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# MinIO logs
docker-compose logs minio
```

## 🚀 Production Deployment

For production deployment:

1. **Update Environment Variables**
   - Change default MinIO credentials
   - Use production-grade secrets management
   - Configure proper CORS origins

2. **SSL/TLS Configuration**
   - Add reverse proxy (nginx)
   - Configure SSL certificates
   - Update MinIO for HTTPS

3. **Persistence**
   - Configure persistent volumes for MinIO
   - Set up backup strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs
3. Open an issue in the repository

---

**Happy Document Managing! 📄✨**

