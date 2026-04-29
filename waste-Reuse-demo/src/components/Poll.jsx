import React, { useMemo, useEffect, useState } from "react";
import API from "../api";

// Poll component will try server persistence and fall back to localStorage
export default function Poll({ id, question, options = [] }) {
  const storageKey = `poll_${id}`;
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  const [results, setResults] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : { counts: options.map(() => 0), voted: false };
    } catch (e) {
      return { counts: options.map(() => 0), voted: false };
    }
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Try server first
      try {
        const res = await API.get(`/polls/${encodeURIComponent(id)}`);
        if (!mounted) return;
        setResults({ counts: res.data.counts, voted: false });
        return;
      } catch (err) {
        // Auto-create the poll if it does not exist yet on backend
        if (err?.response?.status === 404) {
          try {
            await API.post("/polls", { pollId: id, question, options: JSON.parse(optionsKey) });
            const seeded = await API.get(`/polls/${encodeURIComponent(id)}`);
            if (!mounted) return;
            setResults({ counts: seeded.data.counts, voted: false });
            return;
          } catch (seedErr) {
            // fallback to local below
          }
        }
      }

      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) setResults(JSON.parse(raw));
      } catch (e) {}
    };

    load();
    return () => (mounted = false);
  }, [id, storageKey, question, optionsKey]);

  const vote = async (index) => {
    if (results.voted) return;
    // Try server
    try {
      const res = await API.post(`/polls/${encodeURIComponent(id)}/vote`, { index });
      if (res && res.data) {
        setResults({ counts: res.data.counts, voted: true });
        return;
      }
    } catch (err) {
      // fallback
    }

    const newCounts = [...results.counts];
    newCounts[index] = (newCounts[index] || 0) + 1;
    const next = { counts: newCounts, voted: true };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {}
    setResults(next);
  };

  const total = results.counts.reduce((a, b) => a + (b || 0), 0) || 0;

  return (
    <div className="poll-card" style={{ background: "#fff", padding: 18, borderRadius: 12, border: "1px solid #eef6ee" }}>
      <h4 style={{ margin: 0, marginBottom: 8, color: "#2f6f48" }}>{question}</h4>

      {options.map((opt, i) => {
        const count = results.counts[i] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={i} style={{ marginTop: 8 }}>
            <button
              onClick={() => vote(i)}
              disabled={results.voted}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #dfefe1",
                background: results.voted ? "#f6f9f6" : "linear-gradient(90deg,#e9f7ee,#fff)",
                cursor: results.voted ? "default" : "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12
              }}
            >
              <span style={{ fontWeight: 700, color: "#335c42" }}>{opt}</span>
              <span style={{ minWidth: 60, textAlign: "right", color: "#5b7364" }}>{count} ({pct}%)</span>
            </button>

            <div style={{ height: 8, background: "#f0f3f0", borderRadius: 8, overflow: "hidden", marginTop: 8 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#1f6f4d,#38b481)", transition: "width 800ms ease" }} />
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 12, fontSize: 13, color: "#6b7268" }}>{total} votes</div>
    </div>
  );
}
