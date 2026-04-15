
import "./App.css";
import Header from "./components/Header";
import AllNews from "./components/AllNews";
import ChatBot from "./components/ChatBot";
// import Footer from "./components/Footer";
import TopHeadlines from "./components/TopHeadline";
import { NewsProvider } from "./context/NewsContext";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import CountryNews from "./components/CountryNews";

function App() {
  
  return (
    <div className="w-full">
      <BrowserRouter>
        <NewsProvider>
          <Header />
          <Routes>
            <Route path="/" element={<AllNews />} />
            <Route path="/top-headlines/:category" element={<TopHeadlines />} />
            <Route path="/country/:iso" element={<CountryNews />} />
          </Routes>
          <ChatBot />
        </NewsProvider>
        {/* <Cards />  */}
        {/* <Footer />   */}
      </BrowserRouter>
    </div>
  );
}

export default App;