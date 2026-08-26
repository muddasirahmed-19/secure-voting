import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceCapture({ cnic, hasFaceOnFile, onVerified }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setStatus("Models loaded. Starting camera...");
      } catch (err) {
        setError("Failed to load face detection models: " + err.message);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;

    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus("Camera ready. Position your face in view.");
        }
      })
      .catch((err) => {
        setError("Could not access camera: " + err.message);
      });
  }, [modelsLoaded]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setStatus("Detecting face...");
    setError(null);

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setError("No face detected. Make sure your face is clearly visible and try again.");
      setStatus("Camera ready. Position your face in view.");
      return;
    }

    const descriptorArray = Array.from(detection.descriptor);

    if (!hasFaceOnFile) {
  // TEMP BYPASS: no face on file yet for most demo voters - skip verification for now
  setStatus("No face on file — skipping verification (demo bypass).");
  onVerified();
  return;
}

    setVerifying(true);
    setStatus("Verifying identity against records...");

    try {
      const res = await fetch("/api/verify-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic, descriptor: descriptorArray }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Face verification failed.");
        setStatus("Verification failed. Try again.");
        setVerifying(false);
        return;
      }

      setStatus("Identity verified successfully.");
      onVerified();
    } catch (err) {
      setError("Could not reach server. Try again.");
      setVerifying(false);
    }
  };

  return (
    <div className="ballot-card" style={{ textAlign: "center" }}>
      <span className="ballot-eyebrow">Step 2 of 4</span>
      <h2 className="ballot-title">Face Verification</h2>
      <p className="ballot-sub">{status}</p>
      {error && <div className="error-banner">{error}</div>}

      <video
        ref={videoRef}
        autoPlay
        muted
        width="320"
        height="240"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "4px",
          maxWidth: "100%",
        }}
      />

      <div style={{ marginTop: "1.25rem" }}>
        <button
          className="btn-primary"
          onClick={handleCapture}
          disabled={!modelsLoaded || verifying}
        >
          {verifying ? "Verifying..." : "Capture & Verify Face"}
        </button>
      </div>
    </div>
  );
}