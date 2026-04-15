import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import ArticleModal from './ArticleModal';

function CountryNews() {
  const params = useParams();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleCardClick(article) {
    setSelectedArticle(article);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setSelectedArticle(null);
  }

  function handlePrev() {
    setPage(page - 1);
  }

  function handleNext() {
    setPage(page + 1);
  }

  const pageSize = 12;

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://news-aggregator-dusky.vercel.app/country/${params.iso}?page=${page}&pageSize=${pageSize}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const myJson = await response.json();
        if (myJson.success) {
          setTotalResults(myJson.data.totalResults);
          setData(myJson.data.articles);
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
  }, [page, params.iso]);

  const featuredArticle = data && data.length > 0 ? data[0] : null;

  return (
    <main style={{backgroundColor: 'var(--background)'}}>
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {/* Country Header */}
      {!isLoading && (
        <div className="container mx-auto px-5 pt-10 pb-5">
          <h1 style={{color: 'var(--heading)'}} className="text-4xl font-bold">
            News from {params.iso?.toUpperCase()}
          </h1>
          <p style={{color: 'var(--txt)'}} className="text-sm opacity-70 mt-2">
            Latest stories and updates from this region
          </p>
        </div>
      )}

      {/* Hero/Featured Section */}
      {!isLoading && featuredArticle && page === 1 && (
        <div className="container mx-auto px-5 pt-5">
          <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || 'https://via.placeholder.com/1400x500'})`}}>
            <div className="hero-overlay">
              <span className="hero-tag">Featured</span>
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
        </div>
      )}

      {/* News Cards Grid */}
      {!isLoading && data.length > 0 ? (
        <>
          <div className="cards">
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

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={page <= 1}
              className="pagination-btn"
              onClick={handlePrev}
            >
              ← Previous
            </button>
            <p className="font-semibold" style={{color: 'var(--txt)'}}>
              Page {page} of {Math.ceil(totalResults / pageSize)}
            </p>
            <button
              disabled={page >= Math.ceil(totalResults / pageSize)}
              className="pagination-btn"
              onClick={handleNext}
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        !isLoading && <div className="text-center py-20" style={{color: 'var(--txt)'}}>No news articles found for this country.</div>
      )}

      {isLoading && <Loader />}

      {/* Article Modal */}
      {isModalOpen && selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={handleCloseModal} />
      )}
    </main>
  );
}

export default CountryNews;