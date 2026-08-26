import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export default function WebAuthnSetup({ cnic, onVerified }) {
  const [status, setStatus] = useState("Click below to verify with your device.");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    setStatus("Requesting device biometric...");

    try {
      const optionsRes = await fetch("/api/webauthn/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic }),
      });
      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        setError(options.message || "Failed to start verification");
        setLoading(false);
        return;
      }

      const registrationResponse = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic, response: registrationResponse }),
      });
      const verifyResult = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyResult.message || "Verification failed");
        setLoading(false);
        return;
      }

      setStatus("Device biometric verified successfully.");
      onVerified();
    } catch (err) {
      setError("Verification cancelled or unavailable: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="ballot-card" style={{ textAlign: "center" }}>
      <span className="ballot-eyebrow">Step 3 of 4</span>
      <h2 className="ballot-title">Device Verification</h2>
      <p className="ballot-sub">{status}</p>
      {error && <div className="error-banner">{error}</div>}

      <button className="btn-primary" onClick={handleRegister} disabled={loading}>
        {loading ? "Verifying..." : "Verify with Fingerprint / Face ID"}
      </button>
    </div>
  );
}