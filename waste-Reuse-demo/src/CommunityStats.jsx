import { useEffect, useState } from "react";
import API from "./api";

function CommunityStats({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Ensure your backend is running on the port defined in your API config
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
      <div className="stats-container" style={{ padding: "20px", color: "#841617", fontWeight: 600 }}>
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="stats-container" style={{ padding: "20px", color: "#264653" }}>
        Loading community statistics...
      </div>
    );
  }

  return (
    /* The 'stats-container' class is required for the GSAP reveal 
      logic in your App.js to trigger the animation.
    */
    <div className="stats-container" style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        
        {/* Total Logins Card */}
        <div className="stat-card" style={{ background: "#ffffff", padding: "22px", borderRadius: "18px", boxShadow: "0 12px 30px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#163f2b" }}>Total Logins</h3>
          <p style={{ marginTop: "10px", fontSize: "34px", fontWeight: 700, color: "#1f6f4d" }}>
            {stats.totalLogins}
          </p>
        </div>

        {/* Active Users Card */}
        <div className="stat-card" style={{ background: "#ffffff", padding: "22px", borderRadius: "18px", boxShadow: "0 12px 30px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#163f2b" }}>Active Users</h3>
          <p style={{ marginTop: "10px", fontSize: "34px", fontWeight: 700, color: "#1f6f4d" }}>
            {stats.activeUsers}
          </p>
        </div>

        {/* Top Searches Card */}
        <div className="stat-card" style={{ gridColumn: "1 / -1", background: "#ffffff", padding: "22px", borderRadius: "18px", boxShadow: "0 12px 30px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "#163f2b" }}>Top 5 Searched Waste Items</h3>
          <ul style={{ marginTop: "14px", paddingLeft: "18px", color: "#334e3b" }}>
            {stats.topSearchedWasteItems && stats.topSearchedWasteItems.length > 0 ? (
              stats.topSearchedWasteItems.map((item, index) => (
                <li key={index} style={{ marginBottom: "10px" }}>
                  <strong>{item.itemName}</strong> — {item.count} search{item.count === 1 ? "" : "es"}
                </li>
              ))
            ) : (
              <li>No search activity yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CommunityStats;
