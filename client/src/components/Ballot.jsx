import { useEffect, useState } from "react";

export default function Ballot({ cnic, level, constituency, onVoted, onSkip }) {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
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

  if (loading) {
    return (
      <div className="ballot-card">
        <p className="ballot-sub">Loading candidates...</p>
      </div>
    );
  }

  const isNA = level === "NA";
  const ballotLabel = isNA ? "Green Ballot" : "White Ballot";
  const assemblyLabel = isNA ? "National Assembly" : "Provincial Assembly";
  const stepLabel = isNA ? "Step 3 of 4" : "Step 4 of 4";

  const filtered = candidates.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.party.toLowerCase().includes(q);
  });

  return (
    <div className="ballot-card">
      <span className="ballot-eyebrow">
        {stepLabel} — {ballotLabel}
      </span>
      <h2 className={`ballot-title ${isNA ? "" : "pa"}`}>{assemblyLabel}</h2>
      <p className="ballot-sub">Constituency: {constituency}</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="field-group">
        <input
          type="text"
          placeholder="Search candidate or party..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="candidate-list">
        {filtered.length === 0 ? (
          <p className="results-empty" style={{ color: "var(--grey)" }}>
            No candidates match "{search}".
          </p>
        ) : (
          filtered.map((c) => (
            <label
              key={c.id}
              className={`candidate-option ${selected === c.id ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="candidate"
                value={c.id}
                checked={selected === c.id}
                onChange={() => setSelected(c.id)}
              />
              <span>
                <span className="candidate-name">{c.name}</span>
                <br />
                <span className="candidate-party">{c.party}</span>
              </span>
            </label>
          ))
        )}
      </div>

      <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : `Submit ${level} Vote`}
      </button>

      {onSkip && (
        <button type="button" className="skip-link" onClick={onSkip}>
          Skip this ballot for now
        </button>
      )}
    </div>
  );
}