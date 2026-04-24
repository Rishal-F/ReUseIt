/**
 * Main application component.
 * Handles search input, API requests, routing, and page sections for reuse ideas,
 * tutorials, and nearby collector services.
 */
/* eslint-disable no-unused-vars */

import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import ResultCard from "./ResultCard";
import CollectorForm from "./CollectorForm";   
import LoginPage from "./LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import CommunityStats from "./CommunityStats";
import API, { trackVisit } from "./api";
import plasticBottle from "./assets/items/plastic_bottle.png";
import crumpledPaper from "./assets/items/crumpled_paper.png";
import tinCan from "./assets/items/tin_can.png";
import glassBottle from "./assets/items/glass_bottle.png";
import cardboardPiece from "./assets/items/cardboard.png";
import "./App.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// ── Tutorials Database ─────────────────────
const tutorials = {
  "plastic bottle": [
    { title: "Self-Watering Planter from Plastic Bottle", views: "1.2M", duration: "8:24",  query: "self watering planter plastic bottle DIY" },
    { title: "DIY Bird Feeder from Plastic Bottles",       views: "840K", duration: "5:12",  query: "DIY bird feeder plastic bottle" },
    { title: "Vertical Garden Wall Using Plastic Bottles", views: "3.4M", duration: "12:06", query: "vertical garden plastic bottles wall" },
  ],
  "old clothes": [
    { title: "No-Sew T-Shirt Tote Bag in 10 Minutes", views: "5.2M", duration: "10:34", query: "no sew tshirt tote bag DIY" },
    { title: "Braided T-Shirt Rug Easy Tutorial",      views: "2.1M", duration: "14:22", query: "braided tshirt rug DIY easy" },
  ],
  "glass jar": [
    { title: "DIY Glass Jar Candle Holders",          views: "2.3M", duration: "6:50", query: "glass jar candle holder DIY" },
    { title: "Growing Herbs in Glass Jars at Home", views: "1.5M", duration: "9:30", query: "grow herbs glass jar kitchen" },
  ],
  "cardboard box": [
    { title: "Cardboard Drawer Organiser DIY",      views: "780K", duration: "7:10",  query: "cardboard box drawer organiser DIY" },
    { title: "Giant Cardboard Playhouse for Kids", views: "4.5M", duration: "18:00", query: "cardboard box playhouse kids DIY" },
  ],
  default: [
    { title: "How to Recycle Almost Anything — Beginner Guide", views: "4.1M", duration: "14:00", query: "how to recycle almost anything guide" },
    { title: "Basic Upcycling Skills Everyone Should Know",      views: "2.3M", duration: "22:10", query: "basic upcycling skills home DIY" },
  ],
};

// Logic for finding the right service keyword based on search
function getServiceKeyword(item) {
  const lowerItem = item.toLowerCase();
  if (lowerItem.includes("clothes") || lowerItem.includes("fabric")) return "tailor";
  if (lowerItem.includes("plastic")) return "plastic recycling center";
  if (lowerItem.includes("glass")) return "glass recycling";
  if (lowerItem.includes("metal") || lowerItem.includes("tin") || lowerItem.includes("can")) return "scrap dealer";
  if (lowerItem.includes("paper") || lowerItem.includes("newspaper") || lowerItem.includes("cardboard")) return "paper recycling";
  return "waste management";
}

function getWhatsAppLink(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;

  const fullNumber = digits.length === 10 ? `91${digits}` : digits;
  if (fullNumber.length < 10) return null;

  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
}

// ──────────────────────────────────────────────────────────
function MainApp() {
  const navigate = useNavigate();

  // Initialize Smooth Scrolling (Lenis)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  // Application State
  const [results, setResults] = useState([]);
  const [searchedItem, setSearchedItem] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [collectors, setCollectors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [statsRefresh, setStatsRefresh] = useState(0);

  const serviceKeyword = getServiceKeyword(searchedItem);

  // GSAP Animations Logic
  useGSAP(() => {
    const selectors = [
      ".section-title",
      ".section-subtitle",
      ".card",
      ".service-card",
      ".collector-card",
      ".about-card",
      ".register-cta",
      ".video-card",
      ".stat-card", 
      ".stats-section" 
    ];
    
    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      el.classList.add("reveal-item");
    });

    // Staggered reveals for all items
    ScrollTrigger.batch(".reveal-item", {
      onEnter: (elements) => gsap.fromTo(elements, 
        { opacity: 0, y: 80, scale: 0.95, rotationX: 10 },
        { opacity: 1, y: 0, scale: 1, rotationX: 0, stagger: 0.12, duration: 1.4, ease: "expo.out" }
      ),
      start: "top 85%"
    });

    // Background color transitions between sections
    const sections = [
      { id: ".home-section", color: "#edf2ef" },
      { id: ".ideas-section", color: "#fdfefd" },
      { id: ".tutorials-section", color: "#59785c" },
      { id: ".services-section", color: "#edf2ef" },
      { id: ".stats-section", color: "#fdfefd" }, 
      { id: ".about-section", color: "#dce9dc" }
    ];

    sections.forEach((sec, i) => {
      if (i === 0) return;
      ScrollTrigger.create({
        trigger: sec.id,
        start: "top 50%",
        end: "top 10%",
        scrub: true,
        animation: gsap.to("body", { backgroundColor: sec.color, ease: "none" })
      });
    });

    // Home Screen Parallax Trash
    gsap.utils.toArray(".trash-item").forEach((item, index) => {
      const speed = item.classList.contains('trash-bottle') ? 2.2 :
                    item.classList.contains('trash-bag') ? 1.5 :
                    item.classList.contains('trash-cardboard') ? 2.8 :
                    item.classList.contains('trash-cup') ? 0.9 : 1.4;
      const dir = index % 2 === 0 ? 1 : -1;

      gsap.to(item, {
        y: () => -1 * speed * 500,
        x: () => dir * speed * 120,
        rotation: () => dir * speed * 45,
        scale: () => 1 + (speed * 0.15),
        ease: "none",
        scrollTrigger: {
          trigger: ".home-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    });

    // Title animations
    gsap.to(".title-row-left", {
      xPercent: -40,
      ease: "none",
      scrollTrigger: { trigger: ".home-section", start: "top top", end: "bottom top", scrub: true }
    });

    gsap.to(".title-row-right", {
      xPercent: 40,
      ease: "none",
      scrollTrigger: { trigger: ".home-section", start: "top top", end: "bottom top", scrub: true }
    });
  }, { dependencies: [hasSearched, results.length, collectors.length] });

  // Fetch Collectors from MongoDB
  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        // FIXED TERNARY LOGIC BELOW
        const url = hasSearched 
          ? `http://localhost:5000/api/services/search?type=${encodeURIComponent(searchedItem)}`
          : serviceKeyword 
          ? `http://localhost:5000/api/services/google-search?type=${encodeURIComponent(serviceKeyword)}`
          : "http://localhost:5000/api/services?validateWhatsapp=true";

        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) setCollectors(data);
      } catch (error) {
        console.error("Error fetching collectors:", error);
      }
    };
    fetchCollectors();
  }, [searchedItem, hasSearched, serviceKeyword]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // Search Logic
  const handleSearch = async (item) => {
    const key = item.toLowerCase().trim();
    setSearchedItem(item);
    setHasSearched(true);
    setErrorMsg("");

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.userId || user?._id;

    try {
      const url = `http://localhost:5000/api/reuse/search?q=${encodeURIComponent(key)}${userId ? `&userId=${userId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(errorData.message || "Invalid recyclable item. Please enter a valid item.");
        setResults([]);
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setErrorMsg("No reuse ideas found for this item yet.");
        setResults([]);
        return;
      }
      setResults(data);
      setStatsRefresh((prev) => prev + 1);
    } catch (error) {
      setErrorMsg("Connection error. Please check if the server is running.");
      setResults([]);
    }
    setTimeout(() => {
      document.getElementById("ideas").scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleRegister = async (newCollector) => {
    try {
      const response = await fetch("http://localhost:5000/api/services/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCollector)
      });
      if (response.ok) {
        const savedCollector = await response.json();
        setCollectors((prev) => [savedCollector, ...prev]);
      } else {
        setCollectors((prev) => [newCollector, ...prev]);
      }
    } catch (error) {
      setCollectors((prev) => [newCollector, ...prev]);
    }
  };

  return (
    <div>
      <div className="grain-overlay"></div>
      
      {showForm && (
        <CollectorForm 
          onRegister={handleRegister} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {/* ── NAVBAR ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">🌱 ReUseIt</div>
          <nav>
            <ul className="nav-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#ideas">Ideas</a></li>
              <li><a href="#tutorials">Tutorials</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#stats">Stats</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ── HOME SECTION ── */}
      <section id="home" className="section home-section">
        <div className="trash-parallax" aria-hidden="true">
          <div className="trash-set trash-set-a">
            <img className="trash-item trash-cardboard" src={cardboardPiece} alt="" />
            <img className="trash-item trash-cup" src={glassBottle} alt="" />
            <img className="trash-item trash-toothbrush" src={tinCan} alt="" />
          </div>
          <div className="trash-set trash-set-b">
            <img className="trash-item trash-bag" src={plasticBottle} alt="" />
            <img className="trash-item trash-rings" src={tinCan} alt="" />
            <img className="trash-item trash-fork" src={plasticBottle} alt="" />
            <img className="trash-item trash-cardboard-b" src={cardboardPiece} alt="" />
            <img className="trash-item trash-cup-b" src={crumpledPaper} alt="" />
          </div>
        </div>
        <div className="home-content">
          <h2 className="home-title gsap-home-title">
            <div className="title-row title-row-left">TURN WASTE</div>
            <div className="title-row title-row-right">INTO <span className="accent">SOMETHING</span></div>
          </h2>
          <p className="home-subtitle">
            Transform your household waste into creative treasures. Find DIY ideas, 
            video tutorials, and local collectors in one click.
          </p>
          <button className="btn-primary" onClick={() => document.getElementById("ideas").scrollIntoView({ behavior: "smooth" })}>
            Explore Ideas ↓
          </button>
        </div>
      </section>

      {/* ── IDEAS SECTION ── */}
      <section id="ideas" className="section ideas-section">
        <div className="outlined-title">IDEAS IDEAS</div>
        <h2 className="section-title">💡 Ideas</h2>
        <SearchBar onSearch={handleSearch} />
        <div className="chips-row">
          <span className="chips-label">Try:</span>
          {["Plastic bottle", "Old clothes", "Glass jar", "Tin can", "Newspaper"].map((chip) => (
            <button key={chip} className="chip" onClick={() => handleSearch(chip)}>{chip}</button>
          ))}
        </div>
        {hasSearched && (
          <div className="results-container">
            {errorMsg ? <div className="error-msg" style={{color: 'red', marginTop: '20px'}}>{errorMsg}</div> : (
              <>
                <p className="results-heading">Showing ideas for: <strong>"{searchedItem}"</strong></p>
                <div className="results">
                  {results.map((r, index) => <ResultCard key={index} {...r} />)}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── TUTORIALS SECTION ── */}
      <section id="tutorials" className="section tutorials-section">
        <div className="outlined-title outlined-light">TUTORIALS</div>
        <h2 className="section-title">🎬 Tutorials</h2>
        <div className="tutorials-grid">
          {hasSearched ? (
            <div className="tutorial-preview">
              <div className="video-card">
                <div className="video-thumb">▶</div>
                <div className="video-info">
                  <h3>{searchedItem} DIY Reuse Ideas</h3>
                  <p>Step-by-step guides for upcycling your item.</p>
                  <button className="video-btn" onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchedItem + " DIY reuse")}`, "_blank")}>
                    ▶ Watch on YouTube
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <p style={{color: 'white', textAlign: 'center', width: '100%'}}>Search an item to see video tutorials.</p>
          )}
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section id="services" className="section services-section">
        <div className="outlined-title">SERVICES</div>
        <h2 className="section-title">🛠️ Nearby Services</h2>
        <p className="section-subtitle">
          <span className="collector-count">{collectors.length} collectors active in your area.</span>
        </p>
        
        {hasSearched && (
          <div className="service-card">
            <div className="service-left">
              <div className="service-icon">📍</div>
              <div>
                <h3>Local Recycling Assistance</h3>
                <p>For <b>{searchedItem}</b>, we recommend contacting a <span className="highlight">{serviceKeyword}</span>.</p>
              </div>
            </div>
            <button className="map-btn" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(serviceKeyword + " near me")}`, "_blank")}>
              🗺️ Open Maps
            </button>
          </div>
        )}

        <div className="collectors-grid">
          {collectors.map((c, i) => (
            <div key={i} className={`collector-card ${c.isNew ? "collector-card-new" : ""}`}>
              {c.isNew && <div className="new-badge">✦ New</div>}
              <div className="collector-top">
                <div className="collector-avatar">{c.icon || "👤"}</div>
                <div>
                  <div className="collector-name">{c.name}</div>
                  <div className="collector-type">{c.type}</div>
                </div>
              </div>
              <div className="collector-addr">📍 {c.address}</div>
              <div className="collector-dist">✓ {c.distance || "Near you"}</div>
              
              {/* Logic for WhatsApp Button */}
              {(() => {
                const waLink = c.phone
                  ? `https://wa.me/91${c.phone.replace(/\D/g, '')}?text=Hi! I found your listing on ReUseIt.`
                  : null;

                return waLink ? (
                  <a className="wa-btn" href={waLink} target="_blank" rel="noreferrer" onClick={() => trackVisit(c.name)}>
                    💬 WhatsApp
                  </a>
                ) : null;
              })()}
            </div>
          ))}
        </div>

        <div className="register-cta">
          <h3>Are you a collector or upcycler?</h3>
          <p>Help your community by listing your service here.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            Register Now →
          </button>
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section id="stats" className="section stats-section">
        <div className="outlined-title">STATS STATS</div>
        <h2 className="section-title">📊 Community Stats</h2>
        <p className="section-subtitle">Real-time data from our eco-conscious community.</p>
        <div className="stats-container" style={{ padding: '40px 0', minHeight: '300px' }}>
            <CommunityStats refreshKey={statsRefresh} />
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" className="section about-section">
        <div className="outlined-title">ABOUT ABOUT</div>
        <h2 className="section-title">🧠 About The Project</h2>
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">🗑️</div>
            <h4>The Problem</h4>
            <p>Household waste often ends up in landfills because reuse options are hard to find.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">💡</div>
            <h4>Our Solution</h4>
            <p>We provide instant inspiration and connect you to people who can give waste a second life.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🌍</div>
            <h4>Our Impact</h4>
            <p>Reducing carbon footprints one recycled bottle and upcycled t-shirt at a time.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>🌱 ReUseIt</h3>
            <p>Empowering sustainable living through technology and community action.</p>
          </div>
          <div className="footer-section">
            <h3>☎️ Contact</h3>
            <p>📩 support@reuseit.com</p>
            <p>📞 8767463879, 98347 85341</p>
          </div>
          <div className="footer-section">
            <h3>👩‍💻 Team</h3>
            <p>Nicole Dabre, Alciya Dodti, Rishal Fernandes, Bliss Gonsalves</p>
            <p style={{ marginTop: "10px", fontSize: "12px", opacity: 0.6 }}>Engineering Mini Project 2026</p>
            <a href="https://github.com/Rishal-F/ReUseIt" target="_blank" rel="noreferrer" style={{color: 'white', fontSize: '12px'}}>GitHub Repo</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 ReUseIt. All rights reserved. Content and branding are project copyright of the ReUseIt team.</p>
        </div>
      </footer>
    </div>
  );
}

// ── ROOT APP COMPONENT (Routing) ──
function App() {
  const isLoggedIn = Boolean(localStorage.getItem("user"));

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        } 
      />
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;