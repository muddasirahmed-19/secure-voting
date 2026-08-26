import { useEffect, useState } from "react";

export default function ResultsPanel({ level, constituency }) {
  const [candidates, setCandidates] = useState([]);

  const load = () => {
    fetch(`/api/candidates?level=${level}&constituency=${constituency}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...(data.candidates || [])].sort(
          (a, b) => (b.voteCount || 0) - (a.voteCount || 0)
        );
        setCandidates(sorted.slice(0, 3));
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [level, constituency]);

  const maxVotes = Math.max(1, ...candidates.map((c) => c.voteCount || 0));

  return (
    <div className="results-panel">
      <span className="results-tab-label">
        Live Tally — {level === "NA" ? "National Assembly" : "Provincial Assembly"}
      </span>
      <h3>Leading Candidates</h3>

      {candidates.length === 0 ? (
        <p className="results-empty">No votes recorded yet.</p>
      ) : (
        candidates.map((c) => (
          <div className="results-row" key={c.id}>
            <div className="results-row-top">
              <span className="results-row-name">{c.name}</span>
              <span>{c.voteCount || 0}</span>
            </div>
            <div className="results-bar-track">
              <div
                className="results-bar-fill"
                style={{ width: `${((c.voteCount || 0) / maxVotes) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}