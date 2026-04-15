import React, { useState, useEffect } from "react";
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import ArticleModal from './ArticleModal';

function AllNews() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handlePrev() {
    setPage(page - 1);
  }

  function handleNext() {
    setPage(page + 1);
  }

  function handleCardClick(article) {
    setSelectedArticle(article);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedArticle(null);
  }

  function handleFeaturedPrev() {
    const featuredCount = Math.min(5, data.length);
    setFeaturedIndex((prev) => (prev === 0 ? featuredCount - 1 : prev - 1));
  }

  function handleFeaturedNext() {
    const featuredCount = Math.min(5, data.length);
    setFeaturedIndex((prev) => (prev === featuredCount - 1 ? 0 : prev + 1));
  }

  let pageSize = 12;

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://news-aggregator-dusky.vercel.app/all-news?page=${page}&pageSize=${pageSize}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const myJson = await response.json();
        if (myJson.success) {
          setTotalResults(myJson.data.totalResults);
          setData(myJson.data.articles);
          setFeaturedIndex(0);
        } else {
          setError(myJson.message || "An error occurred");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to fetch news. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, [page]);

  // Auto-rotate featured articles
  useEffect(() => {
    if (!isLoading && data.length > 0) {
      const interval = setInterval(() => {
        handleFeaturedNext();
      }, 6000); // Change featured article every 6 seconds
      return () => clearInterval(interval);
    }
  }, [isLoading, data.length]);

  const featuredArticle = data && data.length > 0 ? data[featuredIndex] : null;
  const featuredCount = Math.min(5, data.length);

  return (
    <main style={{backgroundColor: 'var(--background)'}}>
      {error && (
        <div className="text-red-500 mb-4 text-center py-4">{error}</div>
      )}

      {/* Hero/Featured Section with Carousel */}
      {!isLoading && featuredArticle && page === 1 && (
        <div className="container mx-auto px-5 pt-10 pb-5">
          <div className="hero-section-wrapper">
            <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || 'https://via.placeholder.com/1400x500'})`}}>
              <div className="hero-overlay">
                <span className="hero-tag">Editor's Choice</span>
                <h2 className="hero-title">
                  {featuredArticle.title?.substring(0, 80)}
                  {featuredArticle.title?.length > 80 ? "..." : ""}
                </h2>
                <div className="hero-meta">
                  <span>{featuredArticle.source?.name || "News"}</span>
                  <span>{new Date(featuredArticle.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Featured Navigation Controls */}
            {featuredCount > 1 && (
              <>
                {/* Navigation Arrows */}
                <div className="hero-nav">
                  <button 
                    className="hero-nav-btn hero-nav-prev" 
                    onClick={handleFeaturedPrev}
                    aria-label="Previous featured article"
                  >
                    ←
                  </button>
                  <button 
                    className="hero-nav-btn hero-nav-next" 
                    onClick={handleFeaturedNext}
                    aria-label="Next featured article"
                  >
                    →
                  </button>
                </div>

                {/* Featured Indicators (Dots) */}
                <div className="hero-indicators">
                  {Array.from({ length: featuredCount }).map((_, index) => (
                    <button
                      key={index}
                      className={`hero-indicator ${index === featuredIndex ? 'active' : ''}`}
                      onClick={() => setFeaturedIndex(index)}
                      aria-label={`Go to featured article ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* News Cards Grid */}
      {!isLoading && (
        <div className='cards'>
          {data.map((element, index) => (
            <div key={index} onClick={() => handleCardClick(element)}>
              <EverythingCard
                title={element.title}
                description={element.description}
                imgUrl={element.urlToImage}
                publishedAt={element.publishedAt}
                url={element.url}
                author={element.author}
                source={element.source.name}
              />
            </div>
          ))}
        </div>
      )}

      {isLoading && <Loader />}

      {/* Pagination */}
      {!isLoading && data.length > 0 && (
        <div className="pagination">
          <button 
            disabled={page <= 1} 
            className='pagination-btn' 
            onClick={handlePrev}
          >
            ← Previous
          </button>
          <p className='font-semibold' style={{color: 'var(--txt)'}}>
            Page {page} of {Math.ceil(totalResults / pageSize)}
          </p>
          <button 
            className='pagination-btn' 
            disabled={page >= Math.ceil(totalResults / pageSize)} 
            onClick={handleNext}
          >
            Next →
          </button>
        </div>
      )}

      {/* Article Modal */}
      {isModalOpen && selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={handleCloseModal} />
      )}
    </main>
  );
}

export default AllNews;