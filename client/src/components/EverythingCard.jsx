import React from "react";

function Card(props) {
  // Extract category from source or use a default
  const getCategory = () => {
    const categories = ["Business", "Entertainment", "General", "Health", "Science", "Sports", "Technology", "Politics"];
    return categories[Math.floor(Math.random() * categories.length)];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="everything-card">
      {/* Card Image */}
      <div className="card-image-container">
        <img 
          className="everything-card-img" 
          src={props.imgUrl || "https://via.placeholder.com/400x200?text=No+Image"} 
          alt={props.title}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x200?text=No+Image";
          }}
        />
      </div>

      {/* Card Content */}
      <div className="card-content">
        {/* Category Tag */}
        <span className="card-category">{getCategory()}</span>

        {/* Title */}
        <h3 className="title">
          {props.title?.substring(0, 60)}
          {props.title?.length > 60 ? "..." : ""}
        </h3>

        {/* Info Section */}
        <div className="info">
          <div className="source-info">
            <span className="font-semibold text-xs" style={{color: 'var(--txt)'}}>Source:</span>
            <a
              href={props.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
              title={props.source}
            >
              {props.source?.substring(0, 50)}
            </a>
          </div>
          <div className="origin">
            {props.author && (
              <p className="origin-item">
                <span className="font-semibold text-xs">By:</span> {props.author?.substring(0, 30)}
              </p>
            )}
            <p className="origin-item">
              {formatDate(props.publishedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;