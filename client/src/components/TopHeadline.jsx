import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom'
import EverythingCard from './EverythingCard'
import Loader from "./Loader";
import ArticleModal from './ArticleModal';
import { useNews } from '../context/NewsContext';

function TopHeadlines() {
  const params = useParams();
  const { newsRegion, language } = useNews();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
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

  let pageSize = 12;

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = '';
        let options = {};

        if (newsRegion === 'srilanka') {
          // Sri Lanka news using Esana API with language parameter
          const lang = language === 'si' ? 'si' : 'en';
          url = `https://esana-api.vercel.app/EsanaV3?lang=${lang}`;
        } else {
          // World news using local backend (with backup API fallback)
          const categoryParam = params.category ? `&category=${params.category}` : "";
          url = `http://localhost:3000/top-headlines?language=en${categoryParam}&page=${page}&pageSize=${pageSize}`;
        }

        console.log("Fetching from:", url); // Debug log
        
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Fetch error response:", response.status, errorText);
          if (response.status === 429) {
            throw new Error("API Rate Limited - Please try again in a few minutes");
          }
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        
        const json = await response.json();
        console.log("API Response:", json); // Debug log
        
        // Check for API-level errors (e.g., rate limiting)
        if (json.Status && !json.Status.success) {
          throw new Error(`API Error: ${json.Status.description || 'Unknown error'}`);
        }
        
        // Handle different API response formats
        if (newsRegion === 'srilanka') {
          // Esana API format - has Posts array with specific structure
          const esanaData = json.Posts || [];
          if (Array.isArray(esanaData) && esanaData.length > 0) {
            // Transform Esana format to our unified format
            const transformedArticles = esanaData.map(item => {
              // Get description from content array
              let description = '';
              if (Array.isArray(item.content) && item.content.length > 0) {
                // Use English (data_en) if language is English, otherwise Sinhala (data)
                description = language === 'en' ? (item.content[0].data_en || item.content[0].data || '') : (item.content[0].data || item.content[0].data_en || '');
              }
              
              return {
                title: language === 'en' ? (item.title_en || item.title || '') : (item.title || item.title_en || ''),
                description: description,
                content: description,
                image_url: item.thumb || 'https://via.placeholder.com/400x300',
                urlToImage: item.thumb || 'https://via.placeholder.com/400x300',
                pubDate: item.published,
                publishedAt: item.published,
                link: item.link,
                url: item.link,
                source_id: 'Esana',
                source: { name: 'Esana' }
              };
            });
            setTotalResults(transformedArticles.length);
            setData(transformedArticles);
          } else {
            setError("No Sri Lanka news found. Try again later.");
          }
        } else {
          // Custom API format
          if (json.success) {
            setTotalResults(json.data.totalResults);
            setData(json.data.articles);
          } else {
            setError(json.message || "An error occurred fetching world news");
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError(`❌ ${error.message || "Failed to fetch news. Please try again later."}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, [page, params.category, newsRegion, language]);

  const featuredArticle = data && data.length > 0 ? data[0] : null;

  return (
    <main style={{backgroundColor: 'var(--background)'}}>
      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {/* Category Header */}
      {!isLoading && params.category && (
        <div className="container mx-auto px-5 pt-10 pb-5">
          <h1 style={{color: 'var(--heading)'}} className="text-4xl font-bold capitalize">
            {params.category}
          </h1>
          <p style={{color: 'var(--txt)'}} className="text-sm opacity-70 mt-2">
            Top stories in {params.category}
          </p>
        </div>
      )}

      {/* Hero/Featured Section */}
      {!isLoading && featuredArticle && page === 1 && (
        <div className="container mx-auto px-5 pt-5">
          <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || featuredArticle.image_url || 'https://via.placeholder.com/1400x500'})`}}>
            <div className="hero-overlay">
              <span className="hero-tag">Top Story</span>
              <h2 className="hero-title">
                {featuredArticle.title?.substring(0, 80)}
                {featuredArticle.title?.length > 80 ? "..." : ""}
              </h2>
              <div className="hero-meta">
                <span>{featuredArticle.source?.name || featuredArticle.source_id || "News"}</span>
                <span>{new Date(featuredArticle.publishedAt || featuredArticle.pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Cards Grid */}
      {!isLoading && data.length > 0 ? (
        <>
          <div className='cards'>
            {data.map((element, index) => {
              // Handle both API formats
              const title = element.title;
              const description = element.description || element.content;
              const imgUrl = element.urlToImage || element.image_url;
              const publishedAt = element.publishedAt || element.pubDate;
              const url = element.url || element.link;
              const author = element.author || (element.creator ? element.creator[0] : 'Unknown');
              const source = element.source?.name || element.source_id || 'News';

              return (
                <div key={index} onClick={() => handleCardClick(element)}>
                  <EverythingCard
                    title={title}
                    description={description}
                    imgUrl={imgUrl}
                    publishedAt={publishedAt}
                    url={url}
                    author={author}
                    source={source}
                  />
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button disabled={page <= 1} className='pagination-btn' onClick={handlePrev}>← Previous</button>
            <p className='font-semibold' style={{color: 'var(--txt)'}}>Page {page} of {Math.ceil(totalResults / pageSize)}</p>
            <button className='pagination-btn' disabled={page >= Math.ceil(totalResults / pageSize)} onClick={handleNext}>Next →</button>
          </div>
        </>
      ) : (
        !isLoading && <div className="text-center py-20" style={{color: 'var(--txt)'}}>No articles found for this category.</div>
      )}

      {isLoading && <Loader />}

      {/* Article Modal */}
      {isModalOpen && selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={handleCloseModal} />
      )}
    </main>
  );
}

export default TopHeadlines;