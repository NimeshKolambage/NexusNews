import React, { useState } from 'react'

function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      setLoading(true)
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${searchTerm}&sortBy=publishedAt&apiKey=${import.meta.env.VITE_API_KEY}`
        )
        const data = await response.json()
        setResults(data.articles || [])
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const closeResults = () => {
    setShowResults(false)
    setResults([])
    setSearchTerm('')
  }

  return (
    <div className='search-container'>
      <form className='search-bar' onSubmit={handleSearch}>
        <input 
          type="text" 
          name='search' 
          className="search-box" 
          placeholder='Search News...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type='submit' className='btn' disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {showResults && (
        <div className='search-results-modal'>
          <div className='search-results-backdrop' onClick={closeResults}></div>
          <div className='search-results-content'>
            <div className='search-results-header'>
              <h3>Search Results for "{searchTerm}"</h3>
              <button className='close-btn' onClick={closeResults}>✕</button>
            </div>
            <div className='search-results-list'>
              {results.length > 0 ? (
                results.slice(0, 10).map((article, index) => (
                  <a 
                    key={index} 
                    href={article.url} 
                    target='_blank' 
                    rel='noopener noreferrer'
                    className='search-result-item'
                  >
                    <div className='search-result-title'>{article.title}</div>
                    <div className='search-result-source'>{article.source.name}</div>
                  </a>
                ))
              ) : (
                <p className='no-results'>No articles found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search