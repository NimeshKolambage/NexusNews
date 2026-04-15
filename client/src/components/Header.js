import React from "react";
import { Link } from "react-router-dom";
import './Header.css'

function Header() {
    return (

        <header className="fixed top-0 left-0 w-full h-auto bg-gray-800 z-10 flex items-center justify-between px-4 py-2">
            <h3 className="relative text-white text-xl font-bold md:text-2xl xs:basic-4/12 z-50 ">NexusNews</h3>
            <span className="logo">
                <img src="/logo.png" alt="NexusNews Logo" className="w-10 h-10 object-contain" />
            </span>

           <nav className="nav">
            <ul className="nav-list">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/news">All News</Link></li>   
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
            </ul>
              </nav>
        </header>


    )
}