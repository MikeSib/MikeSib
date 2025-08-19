import React from 'react';

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString() + ', ' + d.toLocaleTimeString().slice(0,5);
  } catch {
    return '';
  }
};

const ChecksGrid = ({ items = [], onDelete, onDownload }) => {
  return (
    <div className="checks-grid">
      {items.map((f) => (
        <div key={f.name} className="check-card">
          <div className="check-meta">
            <div className="check-date">{formatDate(f.uploadDate)}</div>
            <div className="check-title">{f.originalName}</div>
          </div>
          <div className="check-status">
            <span className="chip">Загружено</span>
          </div>
          <div className="check-actions">
            <button className="action-button" onClick={() => onDownload?.(f.name, f.originalName)}>Скачать</button>
            <button className="action-button danger" onClick={() => onDelete?.(f.name)}>Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChecksGrid;


