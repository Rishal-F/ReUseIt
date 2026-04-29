/**
 * Login page component.
 * Authenticates the user and stores session state in localStorage.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  // Changed to async to handle the database call
  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      // --- NEW: API call to your backend ---
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password, // sending to backend for verification
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // If login/creation is successful in DB, save the returned user to localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        setError("");
        navigate("/", { replace: true });
      } else {
        // Show error message from backend (e.g., "Invalid credentials")
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Cannot connect to server. Ensure backend is running on port 5000.");
    }
    // --- End of API call ---
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
