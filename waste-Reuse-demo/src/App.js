import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import ResultCard from "./ResultCard";
import CollectorForm from "./CollectorForm";   
import LoginPage from "./LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import { trackVisit } from "./api";
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

// ── Tutorials ─────────────────────────────────────────────────
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
    { title: "DIY Glass Jar Candle Holders",        views: "2.3M", duration: "6:50", query: "glass jar candle holder DIY" },
    { title: "Growing Herbs in Glass Jars at Home", views: "1.5M", duration: "9:30", query: "grow herbs glass jar kitchen" },
  ],
  "cardboard box": [
    { title: "Cardboard Drawer Organiser DIY",     views: "780K", duration: "7:10",  query: "cardboard box drawer organiser DIY" },
    { title: "Giant Cardboard Playhouse for Kids", views: "4.5M", duration: "18:00", query: "cardboard box playhouse kids DIY" },
  ],
  default: [
    { title: "How to Recycle Almost Anything — Beginner Guide", views: "4.1M", duration: "14:00", query: "how to recycle almost anything guide" },
    { title: "Basic Upcycling Skills Everyone Should Know",      views: "2.3M", duration: "22:10", query: "basic upcycling skills home DIY" },
  ],
};

//video
function getVideoEmbedURL(item) {
  const query = encodeURIComponent(`${item} DIY reuse`);
  return `https://www.youtube.com/embed?listType=search&list=${query}`;
}

//nearby collectors
function getServiceKeyword(item) {
  item = item.toLowerCase();

  if (item.includes("clothes")) return "tailor";
  if (item.includes("plastic")) return "plastic recycling center";
  if (item.includes("glass")) return "glass recycling";
  if (item.includes("metal") || item.includes("tin")) return "scrap dealer";
  if (item.includes("paper") || item.includes("newspaper")) return "paper recycling";

  return "waste management";
}

// ─────────────────────────────────────────────────────────────
function MainApp() {
  const navigate = useNavigate();

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

  // ── existing state ────────────────────────────────────────
  const [results,      setResults]      = useState([]);
  const [searchedItem, setSearchedItem] = useState("");
  const [hasSearched,  setHasSearched]  = useState(false);
  const serviceKeyword = getServiceKeyword(searchedItem);

  // ── collectors list — fetched from MongoDB on mount
  const [collectors, setCollectors] = useState([]);

  useGSAP(() => {
    const selectors = [
      ".section-title",
      ".section-subtitle",
      ".card",
      ".service-card",
      ".collector-card",
      ".about-card",
      ".register-cta",
      ".video-card"
    ];
    
    // Add base reveal class
    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      el.classList.add("reveal-item");
    });

    // Staggered Reveals (Upgraded dynamic 3D springing)
    ScrollTrigger.batch(".reveal-item", {
      onEnter: (elements) => gsap.fromTo(elements, 
        { opacity: 0, y: 80, scale: 0.95, rotationX: 10 },
        { opacity: 1, y: 0, scale: 1, rotationX: 0, stagger: 0.12, duration: 1.4, ease: "expo.out" }
      ),
      start: "top 85%"
    });

    // Scrollytelling Background Interp
    const sections = [
      { id: ".home-section", color: "#edf2ef" },
      { id: ".ideas-section", color: "#fdfefd" },
      { id: ".tutorials-section", color: "#59785c" },
      { id: ".services-section", color: "#edf2ef" },
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

    // GSAP Parallax physics applied to trash items (Upgraded with 3D drift)
    gsap.utils.toArray(".trash-item").forEach((item, index) => {
      const speed = item.classList.contains('trash-bottle') ? 2.2 :
                    item.classList.contains('trash-bag') ? 1.5 :
                    item.classList.contains('trash-cardboard') ? 2.8 :
                    item.classList.contains('trash-cup') ? 0.9 : 1.4;
      
      const dir = index % 2 === 0 ? 1 : -1;

      gsap.to(item, {
        y: () => -1 * speed * 500,
        x: () => dir * speed * 120, // Diagonal drift
        rotation: () => dir * speed * 45,
        scale: () => 1 + (speed * 0.15), // Parallax zoom-in depth
        ease: "none",
        scrollTrigger: {
          trigger: ".home-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    });

    // Signature horizontal scrollytelling for title lines
    gsap.to(".title-row-left", {
      xPercent: -40,
      ease: "none",
      scrollTrigger: {
        trigger: ".home-section",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(".title-row-right", {
      xPercent: 40,
      ease: "none",
      scrollTrigger: {
        trigger: ".home-section",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

  }, { dependencies: [hasSearched, results.length, collectors.length] });

  // Fetch collectors from MongoDB filtered by searched item
  useEffect(() => {
    const fetchCollectors = async () => {
      try {
        // If user has searched, filter by that item; otherwise get all
        const url = hasSearched 
          ? `http://localhost:5000/api/services/search?type=${encodeURIComponent(searchedItem)}`
          : "http://localhost:5000/api/services";
        
        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) {
          setCollectors(data);
        }
      } catch (error) {
        console.error("Error fetching collectors:", error);
      }
    };
    fetchCollectors();
  }, [searchedItem, hasSearched]);

  // ── NEW: controls whether the registration modal is visible ─
  const [showForm, setShowForm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

 const handleSearch = async (item) => {
  const key = item.toLowerCase().trim();

  setSearchedItem(item);
  setHasSearched(true);

  try {
    const response = await fetch(
      `http://localhost:5000/api/reuse/search?q=${encodeURIComponent(key)}`
    );

    // If backend returns 404 or error, show popup
    if (!response.ok) {
      const errorData = await response.json();
      window.alert(errorData.message || "You have entered invalid data.");
      setResults([]);
      return;
    }

    const data = await response.json();

    // If no results, show popup
    if (!Array.isArray(data) || data.length === 0) {
      window.alert("You have entered invalid data.");
      setResults([]);
      return;
    }

    setResults(data);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    window.alert("You have entered invalid data.");
    setResults([]);
  }

  setTimeout(() => {
    document.getElementById("ideas").scrollIntoView({ behavior: "smooth" });
  }, 100);
};

  // ── NEW: called by CollectorForm after user submits ────────
  const handleRegister = async (newCollector) => {
    try {
      // Send to backend to store in MongoDB
      const response = await fetch("http://localhost:5000/api/services/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCollector)
      });
      
      if (response.ok) {
        const savedCollector = await response.json();
        // Use the saved collector from backend (has _id)
        setCollectors((prev) => [savedCollector, ...prev]);
      } else {
        // Fallback to local if backend fails
        setCollectors((prev) => [newCollector, ...prev]);
      }
    } catch (error) {
      console.error("Error saving collector:", error);
      // Still add locally even if backend fails
      setCollectors((prev) => [newCollector, ...prev]);
    }
  };

  // const currentTutorials =
  //   tutorials[searchedItem.toLowerCase().trim()] || tutorials["default"];

  return (
    <div>
      <div className="grain-overlay"></div>

      {/* ── REGISTRATION MODAL ─────────────────────────────
           Only rendered when showForm === true              */}
      {showForm && (
        <CollectorForm
          onRegister={handleRegister}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">🌱 ReUseIt</div>
          <nav>
            <ul className="nav-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#ideas">Ideas</a></li>
              <li><a href="#tutorials">Tutorials</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* ── HOME ────────────────────────────────────────── */}
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
            <div className="title-row title-row-right">
              INTO <span className="accent">SOMETHING</span>
            </div>
          </h2>
          <p className="home-subtitle">
            Search any household waste item and get creative reuse ideas,
            video tutorials, and nearby collectors — all in one place.
          </p>
          <button
            className="btn-primary"
            onClick={() =>
              document.getElementById("ideas").scrollIntoView({ behavior: "smooth" })
            }
          >
            Explore Ideas ↓
          </button>
        </div>
      </section>

      {/* ── IDEAS ───────────────────────────────────────── */}
      <section id="ideas" className="section ideas-section">
        <div className="outlined-title">IDEAS IDEAS</div>
        <h2 className="section-title">💡 Ideas</h2>
        <p className="section-subtitle">
          <b>Don't Trash It — Re-Imagine It.</b>
        </p>

        <SearchBar onSearch={handleSearch} />

        <div className="chips-row">
          <span className="chips-label">Try:</span>
          {["Plastic bottle", "Old clothes", "Glass jar", "Tin can", "Newspaper"].map((chip) => (
            <button key={chip} className="chip" onClick={() => handleSearch(chip)}>
              {chip}
            </button>
          ))}
        </div>

        {hasSearched && (
          <>
            <p className="results-heading">
              Showing ideas for: <strong>"{searchedItem}"</strong>
            </p>
            <div className="results">
              {results.map((r, index) => (
                <ResultCard key={index} {...r} />
              ))}
            </div>
          </>
        )}

        {!hasSearched && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>Search above to see reuse ideas for your waste item!</p>
          </div>
        )}
      </section>

      {/* ── TUTORIALS ───────────────────────────────────── */}
      <section id="tutorials" className="section tutorials-section">
        <div className="outlined-title outlined-light">TUTORIALS</div>
        <h2 className="section-title">🎬 Tutorials</h2>
        <p className="section-subtitle">
          {hasSearched
            ? `Step-by-step videos for "${searchedItem}"`
            : "Search an item first to see related tutorials."}
        </p>
        <div className="tutorials-grid">
          {hasSearched && (
  <div className="tutorial-preview">
  <div className="video-card">
    <div className="video-thumb">▶</div>

    <div className="video-info">
      <h3>{searchedItem} DIY Reuse Ideas</h3>
      <p>Watch step-by-step tutorials for this item</p>

      <button
        className="video-btn"
        onClick={() => {
          const query = encodeURIComponent(searchedItem + " DIY reuse");
          window.open(
            `https://www.youtube.com/results?search_query=${query}`,
            "_blank"
          );
        }}
      >
        ▶ Watch on YouTube
      </button>
    </div>
  </div>
</div>
)}
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────── */}
      <section id="services" className="section services-section">
        <div className="outlined-title">SERVICES</div>
        <h2 className="section-title">🛠️ Nearby Services</h2>
        <p className="section-subtitle">
          People and organisations near you who collect or upcycle waste.
          <span className="collector-count"> {collectors.length} collectors listed</span>
        </p>

        {hasSearched && (
  <div className="service-card">
    
    <div className="service-left">
      <div className="service-icon">📍</div>
      <div>
        <h3 >Nearby Help Available</h3>
        <p>
          For <b>{searchedItem}</b>, try finding a{" "}
          <span className="highlight">{serviceKeyword}</span>
        </p>
      </div>
    </div>

    <button
      className="map-btn"
      onClick={() => {
        trackVisit(serviceKeyword);
        const query = encodeURIComponent(serviceKeyword + " near me");
        window.open(
          `https://www.google.com/maps/search/?api=1&query=${query}`,
          "_blank"
        );
      }}
    >
      🗺️ Find {serviceKeyword}
    </button>

  </div>
)}

        <div className="collectors-grid">
          {collectors.map((c, i) => (
            <div key={i} className={`collector-card ${c.isNew ? "collector-card-new" : ""}`}>

              {/* "New" badge — only appears on freshly registered collectors */}
              {c.isNew && <div className="new-badge">✦ New</div>}

              <div className="collector-top">
                <div className="collector-avatar">{c.icon}</div>
                <div>
                  <div className="collector-name">{c.name}</div>
                  <div className="collector-type">{c.type}</div>
                </div>
              </div>

              <div className="collector-addr">📍 {c.address}</div>
              <div className="collector-dist">✓ {c.distance} away</div>

              {/* Waste type tags — shown only for new registrations */}
              {c.wasteTypes && c.wasteTypes.length > 0 && (
                <div className="collector-waste-tags">
                  {c.wasteTypes.map((w) => (
                    <span key={w} className="waste-tag">{w}</span>
                  ))}
                </div>
              )}

              {/* Optional description */}
              {c.description && (
                <p className="collector-desc">"{c.description}"</p>
              )}

              <a
                className="wa-btn"
                onClick={() => trackVisit(c.name)}
                href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(
                  "Hi! I found your listing on ReUseIt and I have some waste I'd like to give for reuse/recycling."
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                💬 WhatsApp
              </a>
            </div>
          ))}
        </div>

        {/* Register CTA — clicking opens the form modal */}
        <div className="register-cta">
          <h3>Are you a collector or upcycler?</h3>
          <p>List yourself so people in your area can find and contact you.</p>
          <button
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Register as Collector →
          </button>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────── */}
      <section id="about" className="section about-section">
        <div className="outlined-title">ABOUT ABOUT</div>
        <h2 className="section-title">🧠 About</h2>
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">🗑️</div>
            <h4>The Problem</h4>
            <p>Millions of reusable items are discarded daily because people don't know better alternatives exist.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">💡</div>
            <h4>Our Solution</h4>
            <p>ReUseIt gives instant reuse ideas, tutorials, and connects you with local collectors — all for free.</p>
          </div>
          <div className="about-card">
            <div className="about-icon">🌍</div>
            <h4>Our Impact</h4>
            <p>Every item reused is one less item in a landfill. Together we can make communities cleaner and greener.</p>
          </div>
        </div>
        <p className="about-text">
          Waste Reuse Helper is a platform designed to spread awareness about reusing and
          recycling household waste. Our goal is to inspire people with creative ideas,
          tutorials, and local services that promote sustainable living.
        </p>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>🌱 ReUseIt</h3>
            <p>Helping you turn everyday waste into useful, creative ideas and promoting sustainable living.</p>
          </div>
          <div className="footer-section">
            <h3>☎️ Contact</h3>
            <p>📩 reuseit@gmail.com</p>
            <p>📞 +91 9876543210</p>
            <p>📍 India</p>
          </div>
          <div className="footer-section">
            <h3>👩‍💻 Team</h3>
            <p>Alciya · Nicole · Bliss · Rishal</p>
            <p style={{ marginTop: "8px", fontSize: "13px", color: "#888" }}>
              Mini Project — 2026
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Waste Reuse Helper Project | All Rights Reserved</p>
        </div>
      </footer>

    </div>
  );
}

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
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;