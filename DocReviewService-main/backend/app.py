import os
import uuid
from datetime import datetime
from io import BytesIO
from urllib.parse import quote, unquote

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from minio import Minio
from minio.error import S3Error
import traceback

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# MinIO Configuration
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'localhost')
MINIO_PORT = int(os.getenv('MINIO_PORT', 9000))
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', 'admin')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', 'minio123456')
MINIO_SECURE = os.getenv('MINIO_SECURE', 'false').lower() == 'true'
BUCKET_NAME = os.getenv('MINIO_BUCKET_NAME', 'pdf-documents')

# Initialize MinIO client
minio_client = Minio(
    f"{MINIO_ENDPOINT}:{MINIO_PORT}",
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

def initialize_bucket():
    """Initialize MinIO bucket if it doesn't exist"""
    try:
        print(f"Connecting to MinIO at {MINIO_ENDPOINT}:{MINIO_PORT}")
        print(f"Using credentials: {MINIO_ACCESS_KEY}")
        print(f"Checking bucket: {BUCKET_NAME}")
        
        if not minio_client.bucket_exists(BUCKET_NAME):
            minio_client.make_bucket(BUCKET_NAME)
            print(f"Bucket '{BUCKET_NAME}' created successfully")
        else:
            print(f"Bucket '{BUCKET_NAME}' already exists")
    except S3Error as e:
        print(f"S3 Error initializing bucket: {e}")
        print(f"Error code: {e.code}, message: {e.message}")
    except Exception as e:
        print(f"General error initializing bucket: {e}")
        import traceback
        traceback.print_exc()

def allowed_file(filename):
    """Check if file is a PDF"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

def format_bytes(bytes_size):
    """Format bytes to human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} TB"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'Server is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload PDF file to MinIO"""
    try:
        # Check if file is present in request
        if 'pdf' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['pdf']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file is PDF
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Generate unique filename while preserving unicode characters
        # Extract base name and remove path separators
        original_filename_raw = file.filename or "uploaded.pdf"
        base_name = os.path.basename(original_filename_raw).replace('/', '_').replace('\\', '_')
        # Use base name as-is (unicode preserved) for object key suffix
        unique_filename = f"{uuid.uuid4()}-{base_name}"
        
        # Read file content
        file_content = file.read()
        file_size = len(file_content)
        
        # Check file size
        if file_size > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({'error': 'File too large (max 50MB)'}), 400
        
        # Ensure bucket exists
        if not minio_client.bucket_exists(BUCKET_NAME):
            minio_client.make_bucket(BUCKET_NAME)
            print(f"Created bucket '{BUCKET_NAME}' on demand")
        
        # Upload to MinIO
        file_stream = BytesIO(file_content)
        
        # Store URL-encoded original name in metadata to keep ASCII-only header constraints
        metadata = {
            'X-Original-Name-Encoded': quote(base_name, safe=''),
            'X-Upload-Date': datetime.now().isoformat(),
            'Content-Type': 'application/pdf'
        }
        
        minio_client.put_object(
            BUCKET_NAME,
            unique_filename,
            file_stream,
            file_size,
            content_type='application/pdf',
            metadata=metadata
        )
        
        return jsonify({
            'message': 'File uploaded successfully',
            'fileName': unique_filename,
            'originalName': base_name,
            'size': file_size,
            'uploadDate': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to upload file'}), 500

@app.route('/files', methods=['GET'])
def list_files():
    """List all uploaded files"""
    try:
        # Ensure bucket exists
        if not minio_client.bucket_exists(BUCKET_NAME):
            minio_client.make_bucket(BUCKET_NAME)
            print(f"Created bucket '{BUCKET_NAME}' on demand")
        
        files = []
        objects = minio_client.list_objects(BUCKET_NAME, recursive=True)
        
        for obj in objects:
            try:
                # Get object metadata
                stat = minio_client.stat_object(BUCKET_NAME, obj.object_name)
                # decode original name from metadata if present
                encoded_name = stat.metadata.get('x-original-name-encoded')
                original_name = unquote(encoded_name) if encoded_name else obj.object_name

                file_info = {
                    'name': obj.object_name,
                    'originalName': original_name,
                    'size': obj.size,
                    'lastModified': obj.last_modified.isoformat() if obj.last_modified else None,
                    'uploadDate': stat.metadata.get('x-upload-date', obj.last_modified.isoformat() if obj.last_modified else None)
                }
                files.append(file_info)
            except Exception as e:
                print(f"Error getting metadata for {obj.object_name}: {e}")
                # Add basic file info even if metadata fails
                files.append({
                    'name': obj.object_name,
                    'originalName': obj.object_name,
                    'size': obj.size,
                    'lastModified': obj.last_modified.isoformat() if obj.last_modified else None,
                    'uploadDate': obj.last_modified.isoformat() if obj.last_modified else None
                })
        
        return jsonify(files), 200
        
    except Exception as e:
        print(f"Error listing files: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to retrieve files'}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download file from MinIO"""
    try:
        # Get object metadata
        stat = minio_client.stat_object(BUCKET_NAME, filename)
        encoded_name = stat.metadata.get('x-original-name-encoded')
        original_name = unquote(encoded_name) if encoded_name else filename
        
        # Get object data
        response = minio_client.get_object(BUCKET_NAME, filename)
        
        # Create response with file data
        def generate():
            try:
                for chunk in response.stream():
                    yield chunk
            finally:
                response.close()
                response.release_conn()
        
        # Build Content-Disposition with RFC 5987 for UTF-8 filenames
        ascii_fallback = original_name.encode('ascii', errors='ignore').decode('ascii') or 'download.pdf'
        disposition = (
            f"attachment; filename=\"{ascii_fallback}\"; "
            f"filename*=UTF-8''{quote(original_name)}"
        )

        return Response(
            generate(),
            headers={
                'Content-Type': 'application/pdf',
                'Content-Disposition': disposition,
                'Content-Length': str(stat.size)
            }
        )
        
    except S3Error as e:
        if e.code == 'NoSuchKey':
            return jsonify({'error': 'File not found'}), 404
        print(f"MinIO error downloading {filename}: {e}")
        return jsonify({'error': 'Failed to download file'}), 500
    except Exception as e:
        print(f"Download error for {filename}: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to download file'}), 500

@app.route('/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete file from MinIO"""
    try:
        minio_client.remove_object(BUCKET_NAME, filename)
        return jsonify({'message': 'File deleted successfully'}), 200
        
    except S3Error as e:
        if e.code == 'NoSuchKey':
            return jsonify({'error': 'File not found'}), 404
        print(f"MinIO error deleting {filename}: {e}")
        return jsonify({'error': 'Failed to delete file'}), 500
    except Exception as e:
        print(f"Delete error for {filename}: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Failed to delete file'}), 500

@app.errorhandler(413)
def file_too_large(error):
    """Handle file too large error"""
    return jsonify({'error': 'File too large (max 50MB)'}), 413

@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors"""
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    return jsonify({'error': 'Internal server error'}), 500

# Initialize bucket during app startup
try:
    initialize_bucket()
except Exception as e:
    print(f"Warning: Could not initialize bucket during startup: {e}")
    print("Bucket will be created on first request")

if __name__ == '__main__':
    # Run the application
    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"Starting Flask server on port {port}")
    print(f"MinIO endpoint: {MINIO_ENDPOINT}:{MINIO_PORT}")
    print(f"MinIO bucket: {BUCKET_NAME}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

