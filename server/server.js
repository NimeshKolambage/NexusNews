require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const API_KEY = process.env.API_KEY;

// Cache to store news (1-hour expiry)
const cache = {
  allNews: null,
  topHeadlines: null,
  countryNews: {},
  expiry: {}
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

function isCacheValid(key) {
  return cache.expiry[key] && cache.expiry[key] > Date.now();
}

function setCacheData(key, data) {
  cache[key] = data;
  cache.expiry[key] = Date.now() + CACHE_DURATION;
  console.log(`📦 Cached ${key} for 1 hour`);
}

function fetchNews(url,res) {
    axios.get(url)
       .then(response => {

        if(response.data.totalResults > 0) {

            res.json({
                status:200,
                success: true,
                message: "News fetched successfully",
                data:response.data,
                articles: response.data.articles
            });

        } else {
            res.status(404).json({
                status: 404,
                message: "No news found"
            });
        }
    })
    .catch((error) => {
        console.error("Error fetching news:", error.message);
        res.status(500).json({
            status: 500,
            message: "Failed to fetch news"
        });
    });
}
 
//top headlines
app.options("/top-headlines",cors());
app.get("/top-headlines",(req,res)=>{
    let pageSize = parseInt(req.query.pageSize) || 80;
    let page = parseInt(req.query.page) || 1;
    let url=`https://newsapi.org/v2/top-headlines?country=us&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`; 
    fetchNews(url,res); 
})


app.get("/all-news",(req,res)=>{

    let pageSize = parseInt(req.query.pageSize) || 10;
    let page = parseInt(req.query.page) || 1;
    let category = req.query.category || "business";
    
    // Check cache first
    if (isCacheValid('allNews')) {
      console.log("✅ Returning cached all-news");
      return res.json({
        status: 200,
        success: true,
        message: "News from cache",
        data: cache.allNews,
        articles: cache.allNews.articles,
        cached: true
      });
    }
    
    let url=`https://newsapi.org/v2/top-headlines?country=us&category=${category}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`; 
    
    axios.get(url)
      .then(response => {
        if (response.data.totalResults > 0) {
          // Save to cache
          setCacheData('allNews', response.data);
          res.json({
            status: 200,
            success: true,
            message: "News fetched successfully",
            data: response.data,
            articles: response.data.articles,
            cached: false
          });
        } else {
          res.status(404).json({
            status: 404,
            message: "No news found"
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching all-news:", error.message);
        
        // Return cache even if expired, as fallback
        if (cache.allNews) {
          console.log("⚠️  API failed, returning stale cache");
          return res.json({
            status: 200,
            success: true,
            message: "News from stale cache (API limit reached)",
            data: cache.allNews,
            articles: cache.allNews.articles,
            cached: true,
            stale: true
          });
        }
        
        res.status(500).json({
          status: 500,
          message: "Failed to fetch news"
        });
      });
})

//country news
app.options("/country-news/:ios",cors());
app.get("/country-news/:ios",(req,res)=>{
    let pageSize = parseInt(req.query.pageSize) || 10;  
    let page = parseInt(req.query.page) || 1;
    let country = req.params.ios;
    let url=`https://newsapi.org/v2/top-headlines?country=${country}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;
    fetchNews(url,res);
})

// Chat Bot API
app.options("/api/chat", cors());
app.post("/api/chat", async (req, res) => {
    const userMessage = req.body.message?.toLowerCase() || "";
    
    let reply = "";
    
    try {
        // Check if user is asking about news
        if (userMessage.includes("news") || userMessage.includes("latest") || userMessage.includes("world")) {
            try {
                // Fetch real news from the custom API with timeout
                const newsResponse = await axios.get("https://news-aggregator-dusky.vercel.app/all-news?pageSize=5", {
                    timeout: 5000
                });
                
                // Handle different response formats
                const articles = newsResponse.data.data?.articles || newsResponse.data.articles || [];
                
                if (Array.isArray(articles) && articles.length > 0) {
                    const topArticles = articles.slice(0, 3);
                    reply = "📰 **Latest World News:**\n\n";
                    
                    topArticles.forEach((article, index) => {
                        const title = article.title?.substring(0, 60) || "Breaking News";
                        const source = article.source?.name || "News Source";
                        reply += `${index + 1}. ${title}...\n   📌 Source: ${source}\n\n`;
                    });
                    
                    reply += "Click on articles in the News section to read full stories! 📲";
                } else {
                    reply = "📰 No news articles found right now. Try browsing the News section directly!";
                }
            } catch (newsError) {
                console.error("News fetch error:", newsError.message);
                reply = "📰 **World News:**\nNews API temporarily unavailable. Please visit the app's News section to read the latest headlines! 📲";
            }
        } else if (userMessage.includes("sri lanka") || userMessage.includes("sinhala") || userMessage.includes("srilanka")) {
            try {
                // Detect language from message
                const isSinhala = userMessage.includes("sinhala") || userMessage.includes("සිංහල");
                const lang = isSinhala ? "si" : "en";
                
                // Fetch from Esana API
                const esanaResponse = await axios.get(`https://esana-api.vercel.app/EsanaV3`, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 8000
                });
                
                const posts = esanaResponse.data.Posts || [];
                
                if (Array.isArray(posts) && posts.length > 0) {
                    const topPosts = posts.slice(0, 3);
                    reply = isSinhala ? "🇱🇰 **ශ්‍රී ලංකා පුවත්:**\n\n" : "🇱🇰 **Sri Lanka News:**\n\n";
                    
                    topPosts.forEach((post, index) => {
                        // Get title based on language
                        const title = isSinhala 
                            ? (post.title || "ශ්‍රී ලංකා පුවත්")
                            : (post.title_en || post.title || "Sri Lanka News");
                        const displayTitle = title.substring(0, 60);
                        reply += `${index + 1}. ${displayTitle}...\n`;
                        if (post.published) {
                            reply += `   📅 ${new Date(post.published).toLocaleDateString()}\n`;
                        }
                        reply += "\n";
                    });
                    
                    reply += isSinhala 
                        ? "🇱🇰 ශ්‍රී ලංකා කොටසින් සම්පූර්ණ පුවත් කියවන්න! 📲" 
                        : "🇱🇰 Visit Sri Lanka section for full stories! 📲";
                } else {
                    reply = isSinhala 
                        ? "🇱🇰 දැනට ශ්‍රී ලංකා පුවත් ලබාගත නොහැක. කරුණාකර නැවත උත්සාහ කරන්න."
                        : "🇱🇰 No Sri Lanka news available right now. Please try again in a moment.";
                }
            } catch (sriLankaError) {
                console.error("Sri Lanka news error:", sriLankaError.message);
                const isSinhala = userMessage.includes("sinhala") || userMessage.includes("සිංහල");
                
                // Check if it's a rate limit error
                if (sriLankaError.response?.status === 429 || sriLankaError.message.includes("429")) {
                    reply = isSinhala
                        ? "🇱🇰 ශ්‍රී ලංකා API තාවකාලිකව පරිමිතයි. කරුණාකර 10 මිනිත්තු පසු උත්සාහ කරන්න. ඔබ සරල පතුවලි සම්පූර්ණ පුවත් බ්‍රවුස් කළ හැක! 📲"
                        : "🇱🇰 Sri Lanka API is temporarily rate-limited. Please try again in 10 minutes. You can browse full news in the Sri Lanka section! 📲";
                } else {
                    reply = isSinhala
                        ? "🇱🇰 ශ්‍රී ලංකා පුවත් සේවාව තාවකාලිකව නොමැති ය. කරුණාකර ශ්‍රී ලංකා කොටසින් ඉතින් පුවත් බ්‍රවුස් කරන්න! 📲"
                        : "🇱🇰 Sri Lanka news service temporarily unavailable. Please browse the Sri Lanka section directly! 📲";
                }
            }
        } else if (userMessage.includes("hello") || userMessage.includes("hi") || userMessage.includes("hey")) {
            reply = "Hello! 👋 What would you like to know?\n\n✨ Try asking:\n• 'Latest world news'\n• 'News about Sri Lanka'\n• 'How do I browse news?'";
        } else if (userMessage.includes("how") || userMessage.includes("help")) {
            reply = "📖 **How to use NexusNews:**\n1️⃣ Select Region: 🌍 World or 🇱🇰 Sri Lanka\n2️⃣ Choose Language: English or සිංහල\n3️⃣ Browse News: Scroll through articles\n4️⃣ Read Story: Click any article to read full content\n5️⃣ Explore: Try different categories or countries\n\nAsk me about specific news or features!";
        } else {
            reply = "I'm here to help! 🤖 Try asking:\n• 'Show me latest news'\n• 'What's happening in the world?'\n• 'Tell me about Sri Lanka'\n• 'How do I use this app?'";
        }
        
        res.json({ 
            reply: reply,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Chat error:", error);
        res.json({
            reply: "Sorry, I'm having trouble fetching live data right now. Try browsing the news directly in the app! 📰",
            timestamp: new Date().toISOString()
        });
    }
});

//port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});