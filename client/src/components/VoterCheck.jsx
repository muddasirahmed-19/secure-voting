import { useState } from "react";

export default function VoterCheck({ onEligible }) {
  const [cnic, setCnic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{13}$/.test(cnic)) {
      setError("CNIC must be exactly 13 digits, no dashes");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/check-voter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Something went wrong");
        setLoading(false);
        return;
      }

      // Eligible - pass data up to parent to move to next step
      onEligible({ cnic, fullName: result.fullName, hasFaceOnFile: result.hasFaceOnFile });
    } catch (err) {
      setError("Could not reach server. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "3rem auto", fontFamily: "sans-serif" }}>
      <h2>Voter Verification</h2>
      <p style={{ color: "#555" }}>Enter your CNIC to begin voting.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={cnic}
          onChange={(e) => setCnic(e.target.value.replace(/\D/g, ""))}
          placeholder="3520212345671"
          maxLength={13}
          style={{ width: "100%", padding: "10px", fontSize: "1rem", marginBottom: "0.5rem" }}
        />

        {error && (
          <p style={{ color: "red", fontWeight: "bold", marginBottom: "0.5rem" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", width: "100%", fontSize: "1rem" }}
        >
          {loading ? "Checking..." : "Continue"}
        </button>
      </form>
    </div>
  );
}