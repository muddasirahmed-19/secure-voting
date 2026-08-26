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

      onEligible({
        cnic,
        fullName: result.fullName,
        naConstituency: result.naConstituency,
        paConstituency: result.paConstituency,
        hasFaceOnFile: result.hasFaceOnFile,
        hasVotedNA: result.hasVotedNA,
        hasVotedPA: result.hasVotedPA,
      });
    } catch (err) {
      setError("Could not reach server. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="ballot-card">
      <span className="ballot-eyebrow">Step 1 of 4</span>
      <h2 className="ballot-title">Voter Verification</h2>
      <p className="ballot-sub">Enter your CNIC to begin voting.</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="cnic">CNIC Number</label>
          <input
            id="cnic"
            type="text"
            value={cnic}
            onChange={(e) => setCnic(e.target.value.replace(/\D/g, ""))}
            placeholder="3520212345671"
            maxLength={13}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Checking..." : "Continue"}
        </button>
      </form>
    </div>
  );
}