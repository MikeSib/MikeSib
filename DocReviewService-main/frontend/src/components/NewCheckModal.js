import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const BYTES_IN_MB = 1024 * 1024;

const NewCheckModal = ({ isOpen, onClose, onUploaded }) => {
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length) {
      const msgs = rejectedFiles.map(r => r.errors?.map(e => e.message).join(', ')).filter(Boolean);
      setErrors(prev => [...prev, ...msgs]);
    }
    if (acceptedFiles?.length) {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * BYTES_IN_MB,
  });

  const removeFile = useCallback((name) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  }, []);

  const totalSizeMB = useMemo(() => {
    const total = files.reduce((s, f) => s + f.size, 0);
    return (total / BYTES_IN_MB).toFixed(2);
  }, [files]);

  const startUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setErrors([]);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('pdf', file);
        const res = await fetch(`${apiUrl}/upload`, { method: 'POST', body: formData });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Upload failed (${res.status}) ${text}`);
        }
      }
      setFiles([]);
      onUploaded?.('Файлы загружены');
      onClose?.();
    } catch (e) {
      setErrors(prev => [...prev, e.message]);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>Новая проверка</h2>
          <button className="icon-button" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="modal-body">
          <div className="left">
            <label className="field">
              <span>Название проекта</span>
              <input
                type="text"
                placeholder="Введите название"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </label>

            <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
              <input {...getInputProps()} />
              <p><strong>Перетащите документ или выберите его на компьютере</strong></p>
              <p className="muted">Поддерживаемые форматы документов: PDF</p>
            </div>

            {!!files.length && (
              <div className="files-list">
                <div className="files-list-header">{files.length} документ(ов) • {totalSizeMB} МБ</div>
                {files.map((f) => (
                  <div key={f.name} className="file-row">
                    <div className="file-meta">
                      <span className="file-icon">📄</span>
                      <div>
                        <div className="file-name">{f.name}</div>
                        <div className="file-size">{(f.size / BYTES_IN_MB).toFixed(2)} МБ</div>
                      </div>
                    </div>
                    <button className="icon-button" onClick={() => removeFile(f.name)} aria-label="Удалить">✕</button>
                  </div>
                ))}
              </div>
            )}

            {!!errors.length && (
              <div className="error">
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
          <div className="right">
            <div className="checks-panel">
              <div className="panel-title">Доступные проверки</div>
              <ul>
                <li>ГОСТ 2.301-6 — форматы и рамки</li>
                <li>ГОСТ Р 2.105-2019 — общие требования к текстовым документам</li>
                <li>ГОСТ Р 21.101 — основные требования</li>
                <li>Постановление № 87 — состав проекта</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="primary-button" disabled={!files.length || uploading} onClick={startUpload}>
            {uploading ? 'Загрузка...' : 'Начать проверку'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCheckModal;


