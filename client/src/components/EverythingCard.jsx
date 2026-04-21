import React from "react";

const categories = ["Business", "Entertainment", "General", "Health", "Science", "Sports", "Technology", "Politics"];

function Card(props) {
  const getStaticCategory = () => {
    // Use URL as stable identifier instead of title length (so category doesn't change when language changes)
    const url = props.url || props.title || '';
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash) + url.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % categories.length;
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
          src={props.imgUrl || "https://placehold.co/400x200?text=Nexus+News"} 
          alt={props.title}
          onError={(e) => {
            e.target.src = "https://placehold.co/400x200?text=Nexus+News";
          }}
        />
      </div>

      <div className="card-content">
        <span className="card-category">{props.source || 'News'}</span>

        <h3 className="title">
          {props.title?.substring(0, 60)}
          {props.title?.length > 60 ? "..." : ""}
        </h3>

        <div className="info">

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