import { useEffect, useState } from "react";
import API from "./api";

function CommunityStats({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await API.get("/stats");
        setStats(response.data);
      } catch (err) {
        console.error("Community stats fetch failed:", err);
        setError("Unable to load community statistics at this time.");
      }
    };

    fetchStats();
  }, [refreshKey]);

  if (error) {
    return (
      <div className="stats-container" style={{ padding: "20px", color: "#841617", fontWeight: 600, textAlign: "center" }}>
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-container" style={{ padding: "20px", color: "#264653", textAlign: "center" }}>
        Loading community sustainability data...
      </div>
    );
  }

  return (
    <div className="stats-container" style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        
        {/* Total Logins Card */}
        <div className="stat-card" style={cardStyle}>
          <h3 style={labelStyle}>Total Logins</h3>
          <p style={valueStyle}>{stats.totalLogins}</p>
          <span style={subTextStyle}>Community Engagement</span>
        </div>

        {/* Active Users Card */}
        <div className="stat-card" style={cardStyle}>
          <h3 style={labelStyle}>Active Users</h3>
          <p style={valueStyle}>{stats.activeUsers}</p>
          <span style={subTextStyle}>Unique Recyclers</span>
        </div>

        {/* Total Searches Card */}
        <div className="stat-card" style={cardStyle}>
          <h3 style={labelStyle}>AI Recommendations</h3>
          <p style={valueStyle}>{stats.totalSearches}</p>
          <span style={subTextStyle}>Gemini API Insights</span>
        </div>

        {/* Top Searches Chart Section */}
        <div className="stat-card" style={{ ...cardStyle, gridColumn: "1 / -1" }}>
          <h3 style={{ ...labelStyle, marginBottom: "20px" }}>Trending Recyclable Items</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {stats.topSearchedWasteItems && stats.topSearchedWasteItems.length > 0 ? (
              stats.topSearchedWasteItems.map((item, index) => {
                // Logic to calculate width based on highest count for a bar effect
                const maxCount = stats.topSearchedWasteItems[0].count;
                const barWidth = (item.count / maxCount) * 100;

                return (
                  <div key={index} style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>
                      <span>{item.itemName.toUpperCase()}</span>
                      <span>{item.count} searches</span>
                    </div>
                    <div style={{ width: "100%", height: "12px", background: "#f0f0f0", borderRadius: "6px", overflow: "hidden" }}>
                      <div style={{ 
                        width: `${barWidth}%`, 
                        height: "100%", 
                        background: "linear-gradient(90deg, #1f6f4d, #38b481)",
                        transition: "width 1s ease-in-out" 
                      }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#6b7268" }}>No search activity yet. Start typing in the search bar!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal Styles for consistency
const cardStyle = {
  background: "#ffffff",
  padding: "26px",
  borderRadius: "20px",
  boxShadow: "0 10px 25px rgba(26, 107, 74, 0.08)",
  border: "1px solid #e9f2ec",
  display: "flex",
  flexDirection: "column"
};

const labelStyle = { margin: 0, fontSize: "16px", color: "#5c7c6a", letterSpacing: "0.5px", textTransform: "uppercase" };
const valueStyle = { marginTop: "8px", marginBottom: "4px", fontSize: "42px", fontWeight: 800, color: "#1f6f4d" };
const subTextStyle = { fontSize: "12px", color: "#a0b3a8", fontWeight: 500 };

export default CommunityStats;