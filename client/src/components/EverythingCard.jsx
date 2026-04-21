import React from "react";

const categories = ["Business", "Entertainment", "General", "Health", "Science", "Sports", "Technology", "Politics"];

function Card(props) {
  const getStaticCategory = () => {
    const titleLength = props.title ? props.title.length : 0;
    const index = titleLength % categories.length;
    return categories[index];
  };

  const category = getStaticCategory();

  const formatDate = (dateString) => {
    if (!dateString) return "";
    let date;
    // Handle both ISO format and other formats
    try {
      date = new Date(dateString);
    } catch {
      return "";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="everything-card">
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

      <div className="card-content">
        <span className="card-category">{category}</span>

        <h3 className="title">
          {props.title?.substring(0, 60)}
          {props.title?.length > 60 ? "..." : ""}
        </h3>

        <div className="info">
          <div className="source-info">
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