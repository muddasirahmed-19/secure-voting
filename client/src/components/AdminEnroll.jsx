import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

const TEST_VOTERS = [
  { cnic: "3520212345671", name: "Ali Raza" },
  { cnic: "3520298765432", name: "Hina Sheikh" },
  { cnic: "3520255566677", name: "Usman Tariq" },
];

// Minimal capture-only component (no verification call) - used only for enrollment
function FaceCaptureRaw({ onCaptured }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
      setStatus("Camera starting...");
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (!modelsLoaded) return;
    navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus("Ready. Click capture.");
      }
    });
  }, [modelsLoaded]);

  const handleCapture = async () => {
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setStatus("No face detected, try again.");
      return;
    }
    onCaptured(Array.from(detection.descriptor));
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p>{status}</p>
      <video ref={videoRef} autoPlay muted width="320" height="240" />
      <div>
        <button onClick={handleCapture} disabled={!modelsLoaded} style={{ marginTop: "1rem" }}>
          Capture
        </button>
      </div>
    </div>
  );
}

export default function AdminEnroll() {
  const [selectedCnic, setSelectedCnic] = useState(null);
  const [message, setMessage] = useState(null);

  const handleCaptured = async (descriptor) => {
    try {
      const res = await fetch("/api/enroll-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnic: selectedCnic, descriptor }),
      });
      const result = await res.json();
      setMessage(result.message);
      setSelectedCnic(null);
    } catch (err) {
      setMessage("Enrollment failed: " + err.message);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "500px", margin: "0 auto" }}>
      <h2>Admin: Enroll Test Voter Faces</h2>
      <p style={{ color: "#666" }}>
        This is a temporary dev-only tool to simulate NADRA-style face enrollment for demo
        voters. Not part of the real voting flow.
      </p>

      {message && <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>}

      {!selectedCnic ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {TEST_VOTERS.map((v) => (
            <li key={v.cnic} style={{ marginBottom: "0.75rem" }}>
              <button
                onClick={() => setSelectedCnic(v.cnic)}
                style={{ padding: "10px 16px", width: "100%", cursor: "pointer" }}
              >
                Enroll face for {v.name} ({v.cnic})
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <p>
            Enrolling face for <strong>{selectedCnic}</strong>
          </p>
          <FaceCaptureRaw onCaptured={handleCaptured} />
          <button onClick={() => setSelectedCnic(null)} style={{ marginTop: "1rem" }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}