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
import { buildApiUrl } from "./api";
import ProtectedRoute from "./ProtectedRoute";
import CommunityStats from "./CommunityStats";
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

// ── Tutorials Database ─────────────────────
const tutorials = {
  "plastic bottle": [
    { title: "Self-Watering Planter from Plastic Bottle", views: "1.2M", duration: "8:24" },
    { title: "DIY Bird Feeder from Plastic Bottles", views: "840K", duration: "5:12" },
    { title: "Vertical Garden Wall Using Plastic Bottles", views: "3.4M", duration: "12:06" },
  ],
  "old clothes": [
    { title: "No-Sew T-Shirt Tote Bag in 10 Minutes", views: "5.2M", duration: "10:34" },
    { title: "Braided T-Shirt Rug Easy Tutorial", views: "2.1M", duration: "14:22" },
  ],
  "glass jar": [
    { title: "DIY Glass Jar Candle Holders", views: "2.3M", duration: "6:50" },
    { title: "Growing Herbs in Glass Jars at Home", views: "1.5M", duration: "9:30" },
  ],
  "cardboard box": [
    { title: "Cardboard Drawer Organiser DIY", views: "780K", duration: "7:10" },
    { title: "Giant Cardboard Playhouse for Kids", views: "4.5M", duration: "18:00" },
  ],
  default: [
    { title: "How to Recycle Almost Anything — Beginner Guide", views: "4.1M", duration: "14:00" },
    { title: "Basic Upcycling Skills Everyone Should Know", views: "2.3M", duration: "22:10" },
  ],
};

function getServiceKeyword(item) {
  const lowerItem = item.toLowerCase();
  if (lowerItem.includes("clothes") || lowerItem.includes("fabric")) return "tailor";
  if (lowerItem.includes("plastic")) return "plastic recycling center";
  if (lowerItem.includes("glass")) return "glass recycling";
  if (lowerItem.includes("metal") || lowerItem.includes("tin") || lowerItem.includes("can")) return "scrap dealer";
  if (lowerItem.includes("paper") || lowerItem.includes("newspaper") || lowerItem.includes("cardboard")) return "paper recycling";
  if (lowerItem.includes("electronics") || lowerItem.includes("e-waste") || lowerItem.includes("battery")) return "e-waste recycling";
  return "waste management";
}

function getWhatsAppLink(phone) {
  // Normalize and build a wa.me link that supports local 10-digit numbers
  const raw = String(phone || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // If number looks like a 10-digit local number, assume India (+91)
  if (digits.length === 10) {
    return `https://wa.me/91${digits}`;
  }

  // If it already contains a country code (more than 10 digits), use as-is
  if (digits.length > 10) {
    return `https://wa.me/${digits}`;
  }

  // For shorter numbers fallback to using what we have (may not work)
  return `https://wa.me/${digits}`;
}

function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return phone;
  if (digits.length === 10) return `+91 ${digits.replace(/(\d{5})(\d{5})/, "$1 $2")}`;
  if (digits.length > 10) return `+${digits}`;
  return digits;
}

// Provide sensible fallback collectors (with phone numbers) for frequently-searched items
function buildFallbackCollectors(item) {
  const key = (item || "").toLowerCase();
  const fallback = [];
  if (key.includes("plastic")) {
    fallback.push({
      name: "Plastic Pickup Pune",
      type: "plastic",
      address: "Kondhwa, Pune",
      phone: "9876543210",
      description: "We collect plastic bottles and packaging.",
      distance: "2.1 km",
      mapUrl: "https://www.google.com/maps",
      isNew: true,
      rating: 4.2,
    });
  }
  if (key.includes("clothes") || key.includes("old clothes") || key.includes("cloth")) {
    fallback.push({
      name: "Cloth Recycling Initiative",
      type: "cloth",
      address: "Sadashiv Peth, Pune",
      phone: "9123456780",
      description: "Pickup for old clothes for reuse and donation.",
      distance: "3.5 km",
      mapUrl: "https://www.google.com/maps",
      isNew: false,
      rating: 4.6,
    });
  }
  if (key.includes("glass")) {
    fallback.push({
      name: "Glass Recycle Co",
      type: "glass",
      address: "Aundh, Pune",
      phone: "9988776655",
      description: "Accepts glass jars and bottles for recycling.",
      distance: "4.0 km",
      mapUrl: "https://www.google.com/maps",
      isNew: false,
      rating: 4.1,
    });
  }
  if (key.includes("tin") || key.includes("can") || key.includes("metal")) {
    fallback.push({
      name: "Metal Scrap Dealer",
      type: "metal",
      address: "Viman Nagar, Pune",
      phone: "9012345678",
      description: "Buys metal cans and scrap.",
      distance: "5.2 km",
      mapUrl: "https://www.google.com/maps",
      isNew: false,
      rating: 3.9,
    });
  }
  if (key.includes("paper") || key.includes("newspaper") || key.includes("cardboard")) {
    fallback.push({
      name: "Paper Recyclers Co",
      type: "paper",
      address: "Baner, Pune",
      phone: "9000001122",
      description: "Collects newspapers, cardboard and paper waste.",
      distance: "6.0 km",
      mapUrl: "https://www.google.com/maps",
      isNew: false,
      rating: 4.0,
    });
  }
  return fallback;
}

// ──────────────────────────────────────────────────────────
function MainApp() {
  const navigate = useNavigate();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0, 0);
    return () => {
      lenis.destroy();
    };
  }, []);

  const [results, setResults] = useState([]);
  const [searchedItem, setSearchedItem] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [collectors, setCollectors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Requesting location access...");
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [servicesError, setServicesError] = useState("");

  const serviceKeyword = getServiceKeyword(searchedItem);

  const openTutorialSearch = (item) => {
    const searchQuery = `${item.trim()} reuse ideas`;
    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    const popup = window.open(targetUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.assign(targetUrl);
    }
  };

  const openNearbyMap = () => {
    if (locationCoords?.lat == null || locationCoords?.lng == null) {
      refreshLocation();
      return;
    }

    const targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(serviceKeyword)}+near+${locationCoords.lat},${locationCoords.lng}`;
    const popup = window.open(targetUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.assign(targetUrl);
    }
  };

  const refreshLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location access denied. Showing general results.");
      return;
    }
    setIsRefreshingLocation(true);
    setLocationStatus("Requesting location access...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus(`Using your location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setIsRefreshingLocation(false);
      },
      () => {
        setLocationCoords(null);
        setLocationStatus("Location access denied. Showing general results.");
        setIsRefreshingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    refreshLocation();
  }, []);

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
      ".stats-section",
    ];
    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      el.classList.add("reveal-item");
    });

    ScrollTrigger.batch(".reveal-item", {
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 80, scale: 0.95, rotationX: 10 },
          { opacity: 1, y: 0, scale: 1, rotationX: 0, stagger: 0.12, duration: 1.4, ease: "expo.out" }
        ),
      start: "top 85%",
    });

    const sections = [
      { id: ".home-section", color: "#edf2ef" },
      { id: ".ideas-section", color: "#fdfefd" },
      { id: ".tutorials-section", color: "#59785c" },
      { id: ".services-section", color: "#edf2ef" },
      { id: ".stats-section", color: "#fdfefd" },
      { id: ".about-section", color: "#dce9dc" },
    ];
    sections.forEach((sec, i) => {
      if (i === 0) return;
      ScrollTrigger.create({
        trigger: sec.id,
        start: "top 50%",
        end: "top 10%",
        scrub: true,
        animation: gsap.to("body", { backgroundColor: sec.color, ease: "none" }),
      });
    });

    gsap.utils.toArray(".trash-item").forEach((item, index) => {
      const speed = item.classList.contains("trash-bottle")
        ? 2.2
        : item.classList.contains("trash-bag")
        ? 1.5
        : item.classList.contains("trash-cardboard")
        ? 2.8
        : item.classList.contains("trash-cup")
        ? 0.9
        : 1.4;
      const dir = index % 2 === 0 ? 1 : -1;
      gsap.to(item, {
        y: () => -1 * speed * 500,
        x: () => dir * speed * 120,
        rotation: () => dir * speed * 45,
        scale: () => 1 + speed * 0.15,
        ease: "none",
        scrollTrigger: { trigger: ".home-section", start: "top top", end: "bottom top", scrub: true },
      });
    });

    gsap.to(".title-row-left", {
      xPercent: -40,
      ease: "none",
      scrollTrigger: { trigger: ".home-section", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".title-row-right", {
      xPercent: 40,
      ease: "none",
      scrollTrigger: { trigger: ".home-section", start: "top top", end: "bottom top", scrub: true },
    });
  }, { dependencies: [hasSearched, results.length, collectors.length] });

  useEffect(() => {
    const fetchCollectors = async () => {
      setIsLoadingVendors(true);
      setServicesError("");
      try {
        const queryItem = hasSearched ? searchedItem : "recycling";
        const params = new URLSearchParams({ item: queryItem });
        if (locationCoords?.lat != null && locationCoords?.lng != null) {
          params.set("lat", String(locationCoords.lat));
          params.set("lng", String(locationCoords.lng));
        }
        const url = `${buildApiUrl("/api/services/vendors")}?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Vendor API failed");
        const data = await response.json();
        // Merge fetched collectors with fallbacks for common queries so WhatsApp links show
        let fetched = Array.isArray(data) && data.length > 0 ? data : [];
        if (hasSearched && searchedItem) {
          const fallback = buildFallbackCollectors(searchedItem);
          if (fallback.length > 0) {
            const existingPhones = new Set(fetched.map((c) => String(c.phone || "").replace(/\D/g, "")));
            const toAdd = fallback.filter((f) => !existingPhones.has(String(f.phone || "").replace(/\D/g, "")));
            fetched = [...toAdd, ...fetched];
          }
        }
        setCollectors(fetched);
      } catch (error) {
        console.error("Error fetching collectors:", error);
        // Use fallback collectors on error for common queries
        if (hasSearched && searchedItem) {
          setCollectors(buildFallbackCollectors(searchedItem));
        } else {
          setCollectors([]);
        }
        setServicesError("Unable to fetch nearby services right now. Showing fallback data if available.");
      } finally {
        setIsLoadingVendors(false);
      }
    };
    fetchCollectors();
  }, [searchedItem, hasSearched, locationCoords]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleSearch = async (item) => {
    const key = item.toLowerCase().trim();
    setSearchedItem(item);
    setHasSearched(true);
    setErrorMsg("");

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.userId || user?._id;

    try {
        const url = `${buildApiUrl("/api/reuse/search")}?q=${encodeURIComponent(key)}${userId ? `&userId=${userId}` : ""}`;
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
      document.getElementById("ideas")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleRegister = async (newCollector) => {
    try {
      const response = await fetch(buildApiUrl("/api/services/add"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCollector),
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

  const currentTutorials = tutorials[searchedItem.toLowerCase()] || tutorials.default;

  return (
    <div>
      <div className="grain-overlay"></div>



      {showForm && <CollectorForm onRegister={handleRegister} onClose={() => setShowForm(false)} />}

      {/* ── NAVBAR ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo"> ReUseIt</div>
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
          <button className="btn-primary" onClick={() => document.getElementById("ideas")?.scrollIntoView({ behavior: "smooth" })}>
            Explore Ideas ↓
          </button>
        </div>
      </section>

      {/* ── IDEAS SECTION ── */}
      <section id="ideas" className="section ideas-section">
        <div className="outlined-title">IDEAS IDEAS</div>
        <h2 className="section-title"> Ideas</h2>
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
          <div className="results-container">
            {errorMsg ? (
              <div className="error-msg" style={{ color: "red", marginTop: "20px" }}>
                {errorMsg}
              </div>
            ) : (
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
          </div>
        )}
      </section>

      {/* ── TUTORIALS SECTION ── */}
      <section id="tutorials" className="section tutorials-section">
        <div className="outlined-title outlined-light">TUTORIALS</div>
        <h2 className="section-title"> Tutorials</h2>
        <div className="tutorials-grid">
          {hasSearched ? (
            <div className="video-card">
              <div className="video-thumb">▶</div>
              <div className="video-info">
                <h3>{currentTutorials[0]?.title || `${searchedItem} reuse ideas`}</h3>
                <p>
                  {currentTutorials[0]
                    ? `${currentTutorials[0].views} views • ${currentTutorials[0].duration}`
                    : "Open YouTube search results for more ideas"}
                </p>
                <button className="video-btn" onClick={() => openTutorialSearch(searchedItem)}>
                  ▶ Watch Tutorial
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: "white", textAlign: "center", width: "100%" }}>
              Search an item to see video tutorials.
            </p>
          )}
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section id="services" className="section services-section">
        <div className="outlined-title">SERVICES</div>
        <h2 className="section-title"> Nearby Services</h2>
        <p className="section-subtitle">
          <span className="collector-count">{collectors.length} collectors active in your area.</span>
        </p>
        {servicesError && <p className="services-error">{servicesError}</p>}
        <div className="location-banner">
          <div>
            <strong>Location</strong>
            <p>{locationStatus}</p>
          </div>
          <button className="location-btn" onClick={refreshLocation} disabled={isRefreshingLocation}>
            {isRefreshingLocation ? "Refreshing..." : "Refresh Location"}
          </button>
        </div>

        {hasSearched && (
          <div className="service-card">
            <div className="service-left">
              <div className="service-icon"> </div>
              <div>
                <h3>Local Recycling Assistance</h3>
                <p>
                  For <b>{searchedItem}</b>, we recommend contacting a{" "}
                  <span className="highlight">{serviceKeyword}</span>.
                </p>
              </div>
            </div>
            <button
              className="map-btn"
              onClick={openNearbyMap}
            >
               View Nearby on Map
            </button>
          </div>
        )}

        <div className="collectors-grid">
          {collectors.map((c, i) => (
            <div key={i} className={`collector-card ${c.isNew ? "collector-card-new" : ""}`}>
              {c.isNew && <div className="new-badge"> New</div>}
              <div className="collector-top">
                <div className="collector-avatar">{c.icon || " "}</div>
                <div>
                  <div className="collector-name">{c.name}</div>
                  <div className="collector-type">{c.type}</div>
                </div>
              </div>
              <div className="collector-addr"> {c.address}</div>
              {typeof c.rating === "number" && (
                <div className="collector-rating"> {c.rating.toFixed(1)}</div>
              )}
              <div className="collector-dist"> {c.distance || "Near you"}</div>
              {c.phone && <div className="collector-phone"> {formatPhoneDisplay(c.phone)}</div>}
              {c.description && <div className="collector-desc">{c.description}</div>}

              {c.phone ? (
                <a
                  className="wa-btn"
                  href={getWhatsAppLink(c.phone)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackVisit(c.name)}
                >
                  Chat on WhatsApp • {formatPhoneDisplay(c.phone)}
                </a>
              ) : (
                <div className="contact-unavailable">Contact not available</div>
              )}
              {c.mapUrl && (
                <a className="map-link" href={c.mapUrl} target="_blank" rel="noreferrer">
                  View on Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
        {!isLoadingVendors && hasSearched && collectors.length === 0 && (
          <p className="no-services">No services nearby.</p>
        )}
        {isLoadingVendors && <p className="no-services">Loading nearby services...</p>}

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
        <h2 className="section-title"> Community Stats</h2>
        <p className="section-subtitle">Real-time data from our eco-conscious community.</p>
        <div className="stats-container" style={{ padding: "40px 0", minHeight: "300px" }}>
          <CommunityStats refreshKey={statsRefresh} />
        </div>
      </section>

      {/* ── ABOUT SECTION ── */}
      <section id="about" className="section about-section">
        <div className="outlined-title">ABOUT ABOUT</div>
        <h2 className="section-title"> About The Project</h2>
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon"> </div>
            <h4>The Problem</h4>
            <p>Household waste often ends up in landfills because reuse options are hard to find.</p>
          </div>
          <div className="about-card">
            <div className="about-icon"> </div>
            <h4>Our Solution</h4>
            <p>We provide instant inspiration and connect you to people who can give waste a second life.</p>
          </div>
          <div className="about-card">
            <div className="about-icon"> </div>
            <h4>Our Impact</h4>
            <p>Reducing carbon footprints one recycled bottle and upcycled t-shirt at a time.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3> ReUseIt</h3>
            <p>Empowering sustainable living through technology and community action.</p>
          </div>
          <div className="footer-section">
            <h3> Contact</h3>
            <p> support@reuseit.com</p>
            <p> 8767463879, 98347 85341</p>
          </div>
          <div className="footer-section">
            <h3> Team</h3>
            <p>Nicole Dabre, Alciya Dodti, Rishal Fernandes, Bliss Gonsalves</p>
            <p style={{ marginTop: "10px", fontSize: "12px", opacity: 0.6 }}>Engineering Mini Project 2026</p>
            <a href="https://github.com/Rishal-F/ReUseIt" target="_blank" rel="noreferrer" style={{ color: "white", fontSize: "12px" }}>
              GitHub Repo
            </a>
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
      <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;

