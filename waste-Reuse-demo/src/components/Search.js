import { useState } from "react";
import API from "../api";

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await API.get(`/reuse/search?q=${encodeURIComponent(query.trim())}`);
      setResults(res.data);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Reuse Recommendation System</h2>

      <input
        type="text"
        placeholder="Enter waste item (e.g. plastic bottle)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button onClick={handleSearch}>Search</button>

      <div style={{ marginTop: "20px" }}>
        {results.map((item, index) => (
          <div key={index} style={{ border: "1px solid black", margin: "10px", padding: "10px" }}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <p><b>Category:</b> {item.category}</p>
            <a href={item.video_link} target="_blank">Watch Video</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;