import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Search() {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // You can add search functionality here or navigate to a search results page
      console.log('Searching for:', searchTerm)
      setSearchTerm('')
    }
  }

  return (
    <form className='search-bar' onSubmit={handleSearch}>
      <input 
        type="text" 
        name='search' 
        className="search-box" 
        placeholder='Search News...'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button type='submit' className='btn'>Search</button>
    </form>
  )
}

export default Search