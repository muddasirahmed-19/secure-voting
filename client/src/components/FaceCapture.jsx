import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceCapture({ onCaptured }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");
  const [error, setError] = useState(null);

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

    setStatus("Face captured successfully.");
    const descriptorArray = Array.from(detection.descriptor);
    onCaptured(descriptorArray);
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
        <button className="btn-primary" onClick={handleCapture} disabled={!modelsLoaded}>
          Capture Face
        </button>
      </div>
    </div>
  );
}