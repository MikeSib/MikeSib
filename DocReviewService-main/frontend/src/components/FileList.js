import React, { useState } from 'react';

const FileList = ({ files, loading, onDeleteSuccess, onDeleteError }) => {
  const [deletingFiles, setDeletingFiles] = useState(new Set());

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const downloadFile = async (fileName, originalName) => {
    try {
      const apiUrl = 'http://localhost:3001'; //process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiUrl}/download/${fileName}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName || fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        onDeleteError('Failed to download file');
      }
    } catch (error) {
      onDeleteError('Error downloading file: ' + error.message);
    }
  };

  const deleteFile = async (fileName) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingFiles(prev => new Set([...prev, fileName]));

    try {
      const apiUrl = 'http://localhost:3001'; //process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiUrl}/files/${fileName}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onDeleteSuccess();
      } else {
        try {
          const errorData = await response.json();
          onDeleteError(errorData.error || 'Failed to delete file');
        } catch (e) {
          const errorText = await response.text();
          console.error('Delete error response:', response.status, errorText);
          onDeleteError(`Failed to delete file (${response.status})`);
        }
      }
    } catch (error) {
      onDeleteError('Error deleting file: ' + error.message);
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>📂 Uploaded Documents</h2>
        <div className="loading">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📂 Uploaded Documents ({files.length})</h2>
      
      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No documents uploaded yet</p>
            <p>Upload your first PDF to get started!</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.name} className="file-item">
              <div className="file-info">
                <h4>{file.originalName}</h4>
                <p>
                  Size: {formatFileSize(file.size)} | 
                  Uploaded: {formatDate(file.uploadDate)}
                </p>
              </div>
              
              <div className="file-actions">
                <button 
                  className="action-button download-button"
                  onClick={() => downloadFile(file.name, file.originalName)}
                  title="Download file"
                >
                  ⬇️ Download
                </button>
                <button 
                  className="action-button delete-button"
                  onClick={() => deleteFile(file.name)}
                  disabled={deletingFiles.has(file.name)}
                  title="Delete file"
                >
                  {deletingFiles.has(file.name) ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileList;