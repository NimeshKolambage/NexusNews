require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));

const API_KEY = process.env.API_KEY;

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
        console.error("Error fetching news:", error);
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
    let url=`https://newsapi.org/v2/top-headlines?country=us&category=${category}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`; 
    fetchNews(url,res); 
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

//port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});