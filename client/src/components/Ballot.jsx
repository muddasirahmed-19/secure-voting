import { useEffect, useState } from "react";

export default function Ballot({ cnic, level, constituency, onVoted }) {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/candidates?level=${level}&constituency=${constituency}`)
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.candidates || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load candidates.");
        setLoading(false);
      });
  }, [level, constituency]);

  const handleSubmit = async () => {
    if (!selected) {
      setError("Please select a candidate before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic, candidateId: selected, level }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Vote failed");
        setSubmitting(false);
        return;
      }

      onVoted();
    } catch (err) {
      setError("Could not reach server. Try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading candidates...</p>;

  const ballotColor = level === "NA" ? "#2e7d32" : "#616161"; // green for NA, grey/white-ish border for PA
  const ballotLabel = level === "NA" ? "Green Ballot — National Assembly" : "White Ballot — Provincial Assembly";

  return (
    <div style={{ maxWidth: "420px", margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h2 style={{ color: ballotColor }}>{ballotLabel}</h2>
      <p style={{ color: "#555" }}>Constituency: {constituency}</p>

      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <div>
        {candidates.map((c) => (
          <label
            key={c.id}
            style={{
              display: "block",
              padding: "12px",
              marginBottom: "8px",
              border: selected === c.id ? `2px solid ${ballotColor}` : "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="candidate"
              value={c.id}
              checked={selected === c.id}
              onChange={() => setSelected(c.id)}
              style={{ marginRight: "10px" }}
            />
            <strong>{c.name}</strong> — {c.party}
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ marginTop: "1rem", padding: "10px 20px", width: "100%", fontSize: "1rem" }}
      >
        {submitting ? "Submitting..." : `Submit ${level} Vote`}
      </button>
    </div>
  );
}