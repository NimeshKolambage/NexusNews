import React, { useState, useEffect } from "react";
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import ArticleModal from './ArticleModal';
import { useNews } from '../context/NewsContext';

function AllNews() {
  const { newsRegion, language } = useNews();
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

  // Cache utility functions
  const getCacheKey = (region) => `nexusnews_cache_${region}`;
  const getCacheExpiry = (region) => `nexusnews_expiry_${region}`;
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  const isCacheValid = (region) => {
    const expiry = localStorage.getItem(getCacheExpiry(region));
    if (!expiry) return false;
    return parseInt(expiry) > Date.now();
  };

  const getCache = (region) => {
    try {
      const cached = localStorage.getItem(getCacheKey(region));
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn("Cache read error:", err);
      return null;
    }
  };

  const setCache = (region, data) => {
    try {
      localStorage.setItem(getCacheKey(region), JSON.stringify(data));
      localStorage.setItem(getCacheExpiry(region), (Date.now() + CACHE_DURATION).toString());
      console.log(`📦 Cached ${region} news for 1 hour`);
    } catch (err) {
      console.warn("Cache write error:", err);
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Check cache only on first page
        const cacheKey = newsRegion === 'srilanka' ? 'srilanka' : 'world';
        if (page === 1 && isCacheValid(cacheKey)) {
          const cachedData = getCache(cacheKey);
          if (cachedData) {
            console.log(`✅ Using cached ${cacheKey} news`);
            setData(cachedData.articles || cachedData);
            setTotalResults((cachedData.totalResults || cachedData.length));
            setFeaturedIndex(0);
            setIsLoading(false);
            return;
          }
        }

        let url = '';
        let options = {};

        if (newsRegion === 'srilanka') {
          // Sri Lanka news using Esana API with language parameter
          const lang = language === 'si' ? 'si' : 'en';
          url = `https://esana-api.vercel.app/EsanaV3?lang=${lang}`;
        } else {
          // World all news using local backend (with backup API fallback)
          url = `http://localhost:3000/all-news?page=${page}&pageSize=${pageSize}`;
        }

        console.log("🌐 Fetching fresh data from:", url); // Debug log
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Fetch error response:", response.status, errorText);
          
          // Try to use stale cache as fallback
          const cachedData = getCache(cacheKey);
          if (cachedData) {
            console.log(`⚠️  API failed, using stale cache`);
            setData(cachedData.articles || cachedData);
            setTotalResults((cachedData.totalResults || cachedData.length));
            setError("Using cached data - API temporarily unavailable");
            setIsLoading(false);
            return;
          }
          
          if (response.status === 429) {
            throw new Error("API Rate Limited - Please try again in a few minutes");
          }
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
        
        const myJson = await response.json();
        console.log("API Response:", myJson); // Debug log
        
        // Check for API-level errors (e.g., rate limiting)
        if (myJson.Status && !myJson.Status.success) {
          throw new Error(`API Error: ${myJson.Status.description || 'Unknown error'}`);
        }
        
        // Handle different API response formats
        if (newsRegion === 'srilanka') {
          // Esana API format - has Posts array with specific structure
          const esanaData = myJson.Posts || [];
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
            setFeaturedIndex(0);
            // Cache the data
            setCache('srilanka', transformedArticles);
          } else {
            setError("No Sri Lanka news found. Try again later.");
          }
        } else {
          // Custom API format
          if (myJson.success) {
            setTotalResults(myJson.data.totalResults);
            setData(myJson.data.articles);
            setFeaturedIndex(0);
            // Cache the data
            setCache('world', { articles: myJson.data.articles, totalResults: myJson.data.totalResults });
          } else {
            setError(myJson.message || "An error occurred fetching world news");
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
  }, [page, newsRegion, language]);

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
            <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || featuredArticle.image_url || 'https://via.placeholder.com/1400x500'})`}}>
              <div className="hero-overlay">
                <span className="hero-tag">Editor's Choice</span>
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