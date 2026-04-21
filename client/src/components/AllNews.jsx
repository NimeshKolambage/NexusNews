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
  const getCacheKey = (region) => {
    // For Sri Lanka: include language in cache key so English and Sinhala have separate caches
    if (region === 'srilanka') {
      return `nexusnews_cache_srilanka_${language}`;
    }
    return `nexusnews_cache_${region}`;
  };
  const getCacheExpiry = (region) => {
    if (region === 'srilanka') {
      return `nexusnews_expiry_srilanka_${language}`;
    }
    return `nexusnews_expiry_${region}`;
  };
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
        // Only use cache for Sri Lanka news (client-side pagination)
        // For world news, always fetch from API (server-side pagination)
        const cacheKey = newsRegion === 'srilanka' ? 'srilanka' : 'world';
        
        // Only apply cache logic for Sri Lanka news
        if (newsRegion === 'srilanka' && isCacheValid(cacheKey)) {
          const cachedData = getCache(cacheKey);
          if (cachedData) {
            console.log(`✅ Using cached ${cacheKey} news`);
            
            // Handle paginated data for Sri Lanka
            if (Array.isArray(cachedData)) {
              // Array of articles - implement pagination
              const startIndex = (page - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              setData(cachedData.slice(startIndex, endIndex));
              setTotalResults(cachedData.length);
            } else {
              // Object with articles array
              const articles = cachedData.articles || [];
              const startIndex = (page - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              setData(articles.slice(startIndex, endIndex));
              setTotalResults(cachedData.totalResults || articles.length);
            }
            setFeaturedIndex(0);
            setIsLoading(false);
            return;
          }
        }

        let url = '';
        let options = {};

        if (newsRegion === 'srilanka') {
          // Sri Lanka news using new Esena API v3
          url = `https://esena-news-api-v3.vercel.app/`;
        } else {
          // World all news using local backend (with backup API fallback)
          url = `https://nexusnews-production.up.railway.app/all-news?page=${page}&pageSize=${pageSize}`;
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
          // New Esena API v3 format - articles in news_data.data
          const esanaData = myJson.news_data?.data || [];
          if (Array.isArray(esanaData) && esanaData.length > 0) {
            // Transform Esena API format to our unified format
            const transformedArticles = esanaData.map(item => {
              // Get description from contentSi array
              let description = '';
              if (Array.isArray(item.contentSi) && item.contentSi.length > 0) {
                // Extract text content from content objects
                description = item.contentSi
                  .filter(c => c.type === 'text' || !c.type)
                  .map(c => c.content || c.data || c.text || '')
                  .join(' ')
                  .substring(0, 300) || '';
              }
              
              return {
                // When Sinhala selected: ONLY show Sinhala (no English fallback)
                title: language === 'en' ? (item.titleEn || item.titleSi || '') : (item.titleSi || ''),
                description: description,
                content: description,
                image_url: item.cover || item.thumb || 'https://placehold.co/400x300?text=Nexus+News',
                urlToImage: item.cover || item.thumb || 'https://placehold.co/400x300?text=Nexus+News',
                pubDate: item.published,
                publishedAt: item.published,
                link: item.share_url,
                url: item.share_url,
                source_id: 'Helakuru Esana',
                source: { name: 'Helakuru Esana' }
              };
            });
            setTotalResults(transformedArticles.length);
            
            // Implement client-side pagination for Sri Lanka news
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            setData(transformedArticles.slice(startIndex, endIndex));
            setFeaturedIndex(0);
            // Cache all articles
            setCache('srilanka', transformedArticles);
          } else {
            setError("No Sri Lanka news found. Try again later");
          }
        } else {
          // Custom API format for world news
          if (myJson.success) {
            setTotalResults(myJson.data.totalResults);
            setData(myJson.data.articles);
            setFeaturedIndex(0);
            // Cache the data for all pages
            if (newsRegion !== 'srilanka') {
              setCache('world', { articles: myJson.data.articles, totalResults: myJson.data.totalResults });
            }
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
            <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || featuredArticle.image_url || 'https://placehold.co/1400x500?text=Nexus+News'})`}}>
              <div className="hero-overlay">
                <span className="hero-tag">Daily News</span>
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