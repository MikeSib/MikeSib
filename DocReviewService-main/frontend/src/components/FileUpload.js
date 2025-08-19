import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      onUploadError('Please select a valid PDF file');
      return;
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const uploadFile = async () => {
    if (!selectedFile) {
      onUploadError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            onUploadSuccess(response.message);
            setSelectedFile(null);
            setUploadProgress(0);
          } catch (e) {
            console.error('Error parsing response:', e);
            onUploadError('Invalid response from server');
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            onUploadError(errorResponse.error || 'Upload failed');
          } catch (e) {
            console.error('Error parsing error response:', e);
            onUploadError(`Upload failed (${xhr.status}): ${xhr.responseText}`);
          }
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        onUploadError('Network error during upload');
        setUploading(false);
      });

      const apiUrl = 'http://localhost:3001'; //process.env.REACT_APP_API_URL || '';
      xhr.open('POST', `${apiUrl}/upload`);
      xhr.send(formData);

    } catch (error) {
      onUploadError('Upload failed: ' + error.message);
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <h2>📤 Upload PDF Document</h2>
      
      <div className="upload-section">
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="upload-icon">📄</div>
          {isDragActive ? (
            <p><strong>Drop the PDF file here...</strong></p>
          ) : (
            <>
              <p><strong>Drag & drop a PDF file here, or click to select</strong></p>
              <p>Maximum file size: 50MB</p>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="selected-file">
            <h4>Selected File:</h4>
            <div className="file-details">
              <p><strong>Name:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
              <p><strong>Type:</strong> {selectedFile.type}</p>
            </div>
            
            <div className="file-actions">
              <button 
                className="upload-button" 
                onClick={uploadFile}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
              <button 
                className="action-button delete-button" 
                onClick={clearSelection}
                disabled={uploading}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="upload-progress">
            <p>Uploading: {uploadProgress}%</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;


