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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  // Handle both API formats
  const imageUrl = article.urlToImage || article.image_url;
  const title = article.title;
  const description = article.description;
  const content = article.content;
  const publishDate = article.publishedAt || article.pubDate;
  const author = article.author || (article.creator ? article.creator[0] : null);
  const sourceName = article.source?.name || article.source_id || 'News';
  const articleUrl = article.url || article.link;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        {/* Close Button */}
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        {/* Modal Image */}
        {imageUrl && (
          <div className="modal-image-container">
            <img 
              src={imageUrl} 
              alt={title}
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
          <span className="modal-tag">{sourceName}</span>

          {/* Title */}
          <h1 className="modal-title">{title}</h1>

          {/* Meta Information */}
          <div className="modal-meta">
            <div className="modal-meta-item">
              <strong>Published:</strong>
              <span>{formatDate(publishDate)}</span>
            </div>
            {author && (
              <div className="modal-meta-item">
                <strong>Author:</strong>
                <span>{author}</span>
              </div>
            )}
            <div className="modal-meta-item">
              <strong>Source:</strong>
              <span>{sourceName}</span>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="modal-section">
              <h2>Summary</h2>
              <p>{description}</p>
            </div>
          )}

          {/* Content */}
          {content && (
            <div className="modal-section">
              <h2>Full Article</h2>
              <p>{content}</p>
            </div>
          )}

          {/* Read Full Article Button */}
          <div className="modal-actions">
            <a 
              href={articleUrl} 
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
