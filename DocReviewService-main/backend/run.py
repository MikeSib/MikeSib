#!/usr/bin/env python3
"""
Development runner for the Flask application.
Use this script for local development.
"""

import os
from app import app, initialize_bucket

if __name__ == '__main__':
    # Set development environment
    os.environ.setdefault('FLASK_ENV', 'development')
    os.environ.setdefault('FLASK_DEBUG', '1')
    
    # Initialize bucket on startup
    initialize_bucket()
    
    # Run the application
    port = int(os.getenv('PORT', 3001))
    
    print("🚀 Starting Flask development server...")
    print(f"📡 Server running on http://localhost:{port}")
    print(f"🗄️  MinIO endpoint: {os.getenv('MINIO_ENDPOINT', 'localhost')}:{os.getenv('MINIO_PORT', 9000)}")
    print(f"📁 MinIO bucket: {os.getenv('MINIO_BUCKET_NAME', 'pdf-documents')}")
    print("📄 Ready to accept PDF uploads!")
    
    app.run(host='0.0.0.0', port=port, debug=True)


