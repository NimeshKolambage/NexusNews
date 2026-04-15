import React, { createContext, useContext, useState } from 'react';

const NewsContext = createContext();

export const NewsProvider = ({ children }) => {
  const [newsRegion, setNewsRegion] = useState('world');
  const [language, setLanguage] = useState('en');

  const value = {
    newsRegion,
    setNewsRegion,
    language,
    setLanguage,
  };

  return (
    <NewsContext.Provider value={value}>
      {children}
    </NewsContext.Provider>
  );
};

export const useNews = () => {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNews must be used within NewsProvider');
  }
  return context;
};
