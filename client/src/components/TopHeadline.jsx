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
          // Sri Lanka news using new Esena API v3
          url = `https://esena-news-api-v3.vercel.app/`;
        } else {
          // World news using local backend (with backup API fallback)
          const categoryParam = params.category ? `&category=${params.category}` : "";
          url = `https://nexusnews-production.up.railway.app/top-headlines?language=en${categoryParam}&page=${page}&pageSize=${pageSize}`;
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
          // New Esena API v3 format - articles in news_data.data
          const esanaData = json.news_data?.data || [];
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
          <div className="hero-section" style={{backgroundImage: `url(${featuredArticle.urlToImage || featuredArticle.image_url || 'https://placehold.co/1400x500?text=Nexus+News'})`}}>
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