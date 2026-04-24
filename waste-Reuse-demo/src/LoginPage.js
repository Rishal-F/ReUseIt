/**
 * Login page component.
 * Authenticates the user and stores session state in localStorage.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "./api";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (localStorage.getItem("user")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      const res = await API.post("/users/login", { email, password });
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/", { replace: true });
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f4faf5",
        padding: "20px"
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          border: "1px solid #dce9df",
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(26, 107, 74, 0.12)",
          padding: "28px"
        }}
      >
        <h1 style={{ marginBottom: "8px", color: "#1a1c18", fontSize: "28px" }}>Login</h1>
        <p style={{ marginBottom: "20px", color: "#6b7268", fontSize: "14px" }}>
          Sign in to continue to ReUseIt.
        </p>

        <label htmlFor="email" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            marginBottom: "14px",
            padding: "11px 12px",
            borderRadius: "10px",
            border: "1.5px solid #cfe2d4",
            outline: "none"
          }}
        />

        <label htmlFor="password" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          style={{
            width: "100%",
            marginBottom: "14px",
            padding: "11px 12px",
            borderRadius: "10px",
            border: "1.5px solid #cfe2d4",
            outline: "none"
          }}
        />

        {error && (
          <p style={{ color: "#d93025", marginBottom: "14px", fontSize: "13px" }}>{error}</p>
        )}

        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
