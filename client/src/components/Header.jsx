import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom'
import countries from "./countries"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleArrowDown } from '@fortawesome/free-solid-svg-icons'





function Header() {
  const [active, setActive] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [theme, setTheme] = useState("light-theme");
  let category = ["business", "entertainment", "general", "health", "science", "sports", "technology","politics"]
  
  useEffect(() => {
    document.body.className = theme;
  }, [theme])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [])
  function toggleTheme() {
    if (theme === "light-theme") {
      setTheme("dark-theme")
    }
    else {
      setTheme("light-theme")
    }
  }
  return (
    <header className="">
     <nav className={`fixed top-0 left-0 w-full h-[60px] z-50 flex items-center justify-between px-6 transition-all duration-300 ${isScrolled ? 'scrolled-nav' : 'transparent-nav'}`} style={{backgroundColor: isScrolled ? 'var(--primary)' : 'transparent', borderBottom: isScrolled ? '1px solid var(--border)' : 'none'}}>
      
      <h3 className="heading font-bold text-xl z-50 m-0 p-0">NexusNews</h3>

        <ul className={active ? "nav-ul flex gap-10 lg:gap-10 lg:basis-3/6 md:basis-4/6 md:justify-end active" : " nav-ul flex gap-10 lg:basis-3/6 md:basis-4/6 justify-end"}>
          <li className="flex items-center"><Link className="no-underline font-medium text-sm" style={{color: 'var(--txt)'}} to="/" onClick={() => { setActive(!active) }}>All News</Link></li>
          <li className="dropdown-li flex items-center"><Link className="no-underline font-medium flex items-center gap-2 text-sm" style={{color: 'var(--txt)'}} onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowCountryDropdown(false) }}>Top-Headlines <FontAwesomeIcon className={showCategoryDropdown ? "down-arrow-icon down-arrow-icon-active" : "down-arrow-icon"} icon={faCircleArrowDown} /></Link>

            <ul className={showCategoryDropdown ? "dropdown p-2 show-dropdown" : "dropdown p-2"}>
              {category.map((element, index) => {
                return (
                  <li key={index} onClick={() => { setShowCategoryDropdown(!showCategoryDropdown) }}>

                    <Link to={"/top-headlines/" + element} className="flex gap-3 capitalize text-sm" style={{color: 'var(--txt)'}}
                      onClick={() => {
                        setActive(!active)
                      }}>
                      {element}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          <li className="dropdown-li flex items-center"><Link className="no-underline font-medium flex items-center gap-2 text-sm" style={{color: 'var(--txt)'}} onClick={() => { setShowCountryDropdown(!showCountryDropdown); setShowCategoryDropdown(false) }}>Country <FontAwesomeIcon className={showCountryDropdown ? "down-arrow-icon down-arrow-icon-active" : "down-arrow-icon"} icon={faCircleArrowDown} /></Link>
            <ul className={showCountryDropdown ? "dropdown p-2 show-dropdown" : "dropdown p-2"}>
              {countries.map((element, index) => {
                return (
                  <li key={index} onClick={() => { setShowCountryDropdown(!showCountryDropdown) }}>
                    <Link to={"/country/" + element?.iso_2_alpha} className="flex gap-3 text-sm" style={{color: 'var(--txt)'}}
                      onClick={() => {
                        setActive(!active)
                      }}>
                      <img
                        src={element?.png}
                        srcSet={`https://flagcdn.com/32x24/${element?.iso_2_alpha}.png 2x`}
                        alt={element?.countryName}
                        className="w-8 h-6"
                      />
                      <span>{element?.countryName}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          <li className="flex items-center"><button className="no-underline font-medium bg-none border-none cursor-pointer p-0" onClick={() => { toggleTheme() }}>
      
          <input type="checkbox" className="checkbox" id="checkbox"/>
             <label htmlFor="checkbox" className="checkbox-label">
          <i className="fas fa-moon"></i>
          <i className="fas fa-sun"></i>
          <span className="ball"></span>
          </label>
          

          </button></li>
        </ul>
        <div className={active ? "ham-burger z-50 ham-open" : "ham-burger z-50"} onClick={() => { setActive(!active) }}>
          <span className="lines line-1"></span>
          <span className="lines line-2"></span>
          <span className="lines line-3"></span>
        </div>
      </nav>
    </header>
  );
}

export default Header;