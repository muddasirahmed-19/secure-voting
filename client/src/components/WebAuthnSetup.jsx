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
      // Step 1: get registration options from backend
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

      // Step 2: trigger browser's native biometric prompt (fingerprint/FaceID/Windows Hello)
      const registrationResponse = await startRegistration({ optionsJSON: options });

      // Step 3: send response back to backend for verification
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
      // User cancelled the prompt, or device has no biometric available
      setError("Verification cancelled or unavailable: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
      <h3>Device Verification</h3>
      <p style={{ color: "#555" }}>{status}</p>
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{ padding: "10px 20px", fontSize: "1rem" }}
      >
        {loading ? "Verifying..." : "Verify with Fingerprint / Face ID"}
      </button>
    </div>
  );
}