import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EverythingCard from './EverythingCard';
import Loader from './Loader';
import ArticleModal from './ArticleModal';
import { useNews } from '../context/NewsContext';

function CountryNews() {
  const params = useParams();
  const { language } = useNews();
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

  // Cache utility functions
  const getCacheKey = (country) => {
    // For Sri Lanka: include language in cache key so English and Sinhala have separate caches
    if (country === 'lk') {
      return `nexusnews_country_${country}_${language}`;
    }
    return `nexusnews_country_${country}`;
  };
  const getCacheExpiry = (country) => {
    if (country === 'lk') {
      return `nexusnews_country_expiry_${country}_${language}`;
    }
    return `nexusnews_country_expiry_${country}`;
  };
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  const isCacheValid = (country) => {
    const expiry = localStorage.getItem(getCacheExpiry(country));
    if (!expiry) return false;
    return parseInt(expiry) > Date.now();
  };

  const getCache = (country) => {
    try {
      const cached = localStorage.getItem(getCacheKey(country));
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn("Cache read error:", err);
      return null;
    }
  };

  const setCache = (country, data) => {
    try {
      localStorage.setItem(getCacheKey(country), JSON.stringify(data));
      localStorage.setItem(getCacheExpiry(country), (Date.now() + CACHE_DURATION).toString());
      console.log(`📦 Cached ${country} news for 1 hour`);
    } catch (err) {
      console.warn("Cache write error:", err);
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Check cache first (for all pages)
        const cacheKey = params.iso;
        if (isCacheValid(cacheKey)) {
          const cachedData = getCache(cacheKey);
          if (cachedData) {
            console.log(`✅ Using cached ${cacheKey} news`);
            
            // Handle paginated data
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
            setIsLoading(false);
            return;
          }
        }

        let response;
        let myJson;

        if (params.iso === 'lk') {
          // Sri Lanka: Esana API with 8-second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          try {
            console.log(`🇱🇰 Fetching Sri Lanka news...`, new Date().toLocaleTimeString());
            response = await fetch(`https://esena-news-api-v3.vercel.app/`, 
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            console.log(`✅ Got response: ${response.status}`, response.headers.get('content-type'));
            
            if (!response.ok) {
              // Try stale cache as fallback
              const staleCache = getCache(params.iso);
              if (staleCache) {
                console.log(`⚠️  Using stale cache (HTTP ${response.status})`);
                setData(staleCache.articles || staleCache);
                setError("Using cached data - API temporarily unavailable");
                setIsLoading(false);
                return;
              }
              throw new Error(`HTTP ${response.status}`);
            }
            myJson = await response.json();
            console.log(`📦 API Response:`, { articles: myJson.news_data?.data?.length || 0 });
          } catch (esanaError) {
            clearTimeout(timeoutId);
            console.error(`❌ Esana error (${esanaError.name}):`, esanaError.message);
            setError(`Can't fetch Sri Lanka news right now. ${esanaError.message}`);
            setIsLoading(false);
            return;
          }
          
          // Transform Esena API posts
          const esanaData = myJson.news_data?.data || [];
          if (esanaData.length > 0) {
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
            
            // Implement client-side pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedArticles = transformedArticles.slice(startIndex, endIndex);
            
            setTotalResults(transformedArticles.length);
            setData(paginatedArticles);
            // Save all articles to cache
            setCache(params.iso, transformedArticles);
          } else {
            setError("No Sri Lanka news available right now");
          }
        } else {
          // Other countries: news-aggregator API with 8-second timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          
          try {
            response = await fetch(
              `https://nexusnews-production.up.railway.app/country-news/${params.iso}?page=${page}&pageSize=${pageSize}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              // Try stale cache as fallback
              const staleCache = getCache(params.iso);
              if (staleCache) {
                console.log(`⚠️  Using stale cache (HTTP ${response.status})`);
                setData(staleCache.articles || staleCache);
                setError("Using cached data - API temporarily unavailable");
                setIsLoading(false);
                return;
              }
              throw new Error(`HTTP ${response.status}`);
            }
            myJson = await response.json();
            
            if (myJson.success) {
              setTotalResults(myJson.data.totalResults);
              setData(myJson.data.articles);
              // Save to cache for future visits
              setCache(params.iso, { articles: myJson.data.articles, totalResults: myJson.data.totalResults });
            } else {
              throw new Error(myJson.message || "Failed to fetch news");
            }
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError(`❌ ${error.message || "Failed to fetch news. Please try again."}`);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNews();
  }, [page, params.iso, language]);

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
          <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || 'https://placehold.co/1400x500?text=Nexus+News'})`}}>
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