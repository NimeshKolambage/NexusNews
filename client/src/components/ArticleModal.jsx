import React, { useEffect } from 'react';

function ArticleModal({ article, onClose }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {/* Modal Image */}
        {article.urlToImage && (
          <div className="modal-image-container">
            <img 
              src={article.urlToImage} 
              alt={article.title}
              className="modal-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body">
          {/* Category */}
          <span className="modal-tag">{article.source?.name || 'News'}</span>

          {/* Title */}
          <h1 className="modal-title">{article.title}</h1>

          {/* Meta Information */}
          <div className="modal-meta">
            <div className="modal-meta-item">
              <strong>Published:</strong>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            {article.author && (
              <div className="modal-meta-item">
                <strong>Author:</strong>
                <span>{article.author}</span>
              </div>
            )}
            {article.source && (
              <div className="modal-meta-item">
                <strong>Source:</strong>
                <span>{article.source.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {article.description && (
            <div className="modal-section">
              <h2>Summary</h2>
              <p>{article.description}</p>
            </div>
          )}

          {/* Content */}
          {article.content && (
            <div className="modal-section">
              <h2>Full Article</h2>
              <p>{article.content}</p>
            </div>
          )}

          {/* Read Full Article Button */}
          <div className="modal-actions">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="modal-link-btn"
            >
              Read Full Article →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleModal;
