# 📰 NexusNews

A modern, feature-rich news aggregation platform that delivers real-time news from around the world with personalized regional content and language support.

## ✨ Features

### 🌍 Multi-Region News
- **Global News**: Access world news with comprehensive category filtering
- **Sri Lanka News**: Specialized integration with Esena News API v3 for locally-sourced Sri Lankan news
- **Country-Specific News**: Browse news by individual countries
- **Real-time Updates**: Fresh news from multiple sources updated continuously

### 🌐 Language Support
- **Pure Sinhala Mode**: Complete Sinhala language interface and content for Sri Lanka region
- **English Interface**: Full English support for global news consumption
- **Language-Aware Caching**: Separate cache per language and region for optimal performance
- **Seamless Switching**: Toggle between languages instantly

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Theme toggle with persistent localStorage storage
- **Modern Styling**: 
  - Smooth animations and transitions (0.2-0.3s)
  - Backdrop blur effects on dropdowns
  - Professional hover effects with lift animations
  - Rounded corners and layered shadows
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Smart Dropdowns**: Click-outside-to-close dropdown menus for better UX

### 🔍 Search & Filter
- **Category Filtering**: Filter news by categories (Politics, Sports, Technology, etc.)
- **Search Functionality**: Find news by keywords
- **Advanced Sorting**: Sort by date, relevance, and popularity

### ⚡ Performance
- **Intelligent Caching**: Language-aware and region-specific caching (1-hour TTL)
- **Fast Load Times**: Optimized API calls with request interceptors
- **Error Handling**: Comprehensive error handling with user-friendly overlays

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14+)
- **npm** (v6+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd NexusNews

# Install dependencies for both client and server
cd client && npm install
cd ../server && npm install
```

### Running the Application

```bash
# Terminal 1: Start the backend server (from server directory)
npm run dev
# or
node server.js

# Terminal 2: Start the frontend dev server (from client directory)
npm run dev
```

- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:5000

## 📁 Project Structure

```
NexusNews/
├── client/                           # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Navigation, theme toggle, region/language selector
│   │   │   ├── AllNews.jsx          # Main news display with language-aware caching
│   │   │   ├── TopHeadline.jsx      # Featured stories (hidden for Sri Lanka)
│   │   │   ├── CountryNews.jsx      # Country-specific news filtering
│   │   │   ├── ArticleModal.jsx     # Full article view modal
│   │   │   ├── ChatBot.jsx          # Interactive chat assistant
│   │   │   ├── Loader.jsx           # Loading spinner
│   │   │   └── ...others
│   │   ├── context/
│   │   │   └── NewsContext.jsx      # Global state management
│   │   ├── hooks/
│   │   │   ├── useErrorHandler.js   # Error handling
│   │   │   └── useConnectionErrorHandler.js
│   │   ├── services/
│   │   │   └── apiInterceptor.js    # API request/response handling
│   │   ├── App.jsx
│   │   └── index.css                # Modern styling with theme variables
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── server/                           # Node.js Express backend
    ├── server.js                     # Main server file with API routes
    └── package.json
```

## 🔌 API Integration

### Primary News Source
- **NewsAPI.org**: Global news and world news categories
- **Esena News API v3**: Sri Lanka-specific news (`https://esena-news-api-v3.vercel.app/`)

### Response Format (Esena)
```json
{
  "news_data": {
    "data": [
      {
        "titleEn": "English Title",
        "titleSi": "සිංහල මාතෘකාව",
        "contentSi": ["Content snippet in Sinhala"],
        "cover": "image-url",
        "thumb": "thumbnail-url",
        "published": "2024-04-16",
        "share_url": "https://..."
      }
    ]
  }
}
```

## 🎯 Key Features in Detail

### Language-Aware Caching
- Separate cache keys per language and region
- AllNews: `nexusnews_cache_srilanka_${language}`
- CountryNews: `nexusnews_country_${country}_${language}`
- Cache TTL: 1 hour (3600000ms)

### Theme System
- **Storage**: LocalStorage (`nexusnews-theme`)
- **Options**: `light-theme`, `dark-theme`
- **Fallback**: System preference (`prefers-color-scheme`)
- **Variables**: CSS custom properties for seamless switching

### Regional Features
- **Sri Lanka Region**:
  - Pure Sinhala content mode
  - Esena API v3 integration
  - No Top-Headlines (API limitation)
  - Language-specific caching
  - Dedicated CountryNews component
- **Global Regions**:
  - Full category filtering
  - Top-Headlines featured section
  - Multiple language support

### Modern UI Components
- **Navbar**: Smooth hover effects with accent colors
- **Dropdowns**: Backdrop blur (10px), 12px border radius, dual-layer shadows
- **Buttons**: Lift animation on hover (translateY -2px)
- **Checkboxes**: Enhanced glow effect on focus
- **Transitions**: 0.2-0.3s cubic-bezier for smooth animations

## 🛠️ Technology Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **ESLint** - Code quality

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Axios** - HTTP client for API calls

## 📝 Recent Updates (v2.0)

### Major Features Added
- ✅ Esena News API v3 integration for Sri Lanka
- ✅ Pure Sinhala language support
- ✅ Dark/Light mode toggle with theme persistence
- ✅ Modern UI redesign with animations
- ✅ Language-aware caching system
- ✅ Close-on-outside-click dropdown behavior
- ✅ Conditional Top-Headlines rendering
- ✅ Improved error handling with visual overlays

### Performance Improvements
- Language-specific cache separation
- Optimized API request handling
- Reduced redundant API calls

## 🐛 Known Limitations

- Esena News API v3 doesn't support category filtering
- Top-Headlines not available for Sri Lanka region (API limitation)
- Some articles may not have Sinhala translations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the MIT License.

## 📧 Support

For issues, questions, or feature requests, please open an issue on the repository or contact the development team.
