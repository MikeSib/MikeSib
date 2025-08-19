import React, { useState, useEffect } from 'react';
import ChecksGrid from './components/ChecksGrid';
import NewCheckModal from './components/NewCheckModal';
import './App.css';
import './styles/theme.css';

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/files`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        const errorText = await response.text();
        console.error('Fetch files error:', response.status, errorText);
        setError(`Failed to fetch files (${response.status})`);
      }
    } catch (err) {
      console.error('Fetch files network error:', err);
      setError('Error connecting to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadSuccess = (message) => {
    setSuccess(message);
    setError('');
    fetchFiles(); // Refresh file list
    setTimeout(() => setSuccess(''), 5000);
  };

  const handleUploadError = (message) => {
    setError(message);
    setSuccess('');
  };

  const handleDeleteSuccess = () => {
    setSuccess('File deleted successfully');
    setError('');
    fetchFiles(); // Refresh file list
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteError = (message) => {
    setError(message);
    setSuccess('');
  };

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const downloadFile = async (fileName, originalName) => {
    try {
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
        setError('Failed to download file');
      }
    } catch (err) {
      setError('Error downloading file: ' + err.message);
    }
  };

  const deleteFile = async (fileName) => {
    try {
      const response = await fetch(`${apiUrl}/files/${fileName}`, { method: 'DELETE' });
      if (response.ok) {
        handleDeleteSuccess();
      } else {
        const text = await response.text();
        handleDeleteError(text || 'Failed to delete file');
      }
    } catch (err) {
      handleDeleteError('Error deleting file: ' + err.message);
    }
  };

  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <div className="App">
      <div className="container">
        <header className="header" style={{marginBottom: 20}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{fontWeight: 700, fontSize: 24}}>Регла</div>
          </div>
          <button className="primary-button" onClick={() => setModalOpen(true)}>+ Новая проверка</button>
        </header>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div style={{marginBottom: 16}}>
          <span className="chip" style={{marginRight: 8}}>Все</span>
          <span className="chip" style={{marginRight: 8}}>Есть ошибки</span>
          <span className="chip" style={{marginRight: 8}}>Без ошибок</span>
          <span className="chip" style={{marginRight: 8}}>В процессе</span>
          <span className="chip">В очереди</span>
        </div>

        <ChecksGrid 
          items={files}
          onDownload={downloadFile}
          onDelete={deleteFile}
        />
      </div>

      <NewCheckModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onUploaded={handleUploadSuccess}
      />
    </div>
  );
}

export default App;


