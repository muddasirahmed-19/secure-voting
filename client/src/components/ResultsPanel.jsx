import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function ResultsPanel({ level, constituency }) {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    let q;
    if (level && constituency) {
      q = query(
        collection(db, "candidates"),
        where("level", "==", level),
        where("constituency", "==", constituency)
      );
    } else {
      // Default view before voter info is known: overall NA candidates
      q = query(collection(db, "candidates"), where("level", "==", "NA"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = list.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
      setCandidates(sorted.slice(0, 3));
    });

    return () => unsubscribe();
  }, [level, constituency]);

  const maxVotes = Math.max(1, ...candidates.map((c) => c.voteCount || 0));
  const effectiveLevel = level || "NA";
  const label =
    effectiveLevel === "NA" ? "National Assembly" : "Provincial Assembly";
  const subLabel = constituency ? constituency : "All Constituencies";

  return (
    <div className="results-panel">
      <span className="results-tab-label">
        Live Tally — {label} · {subLabel}
      </span>
      <h3>Leading Candidates</h3>

      {candidates.length === 0 ? (
        <p className="results-empty">No votes recorded yet.</p>
      ) : (
        candidates.map((c, i) => (
          <div className="results-row" key={c.id}>
            <span className="results-rank">{i + 1}</span>
            <div className="results-row-body">
              <div className="results-row-top">
                <span className="results-row-name">{c.name}</span>
                <span className="results-row-count">{c.voteCount || 0}</span>
              </div>
              <div className="results-bar-track">
                <div
                  className="results-bar-fill"
                  style={{ width: `${((c.voteCount || 0) / maxVotes) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}