import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export default function FaceCapture({ onCaptured }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [status, setStatus] = useState("Loading models...");
  const [error, setError] = useState(null);

  // Load models on mount
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

  // Start webcam once models are ready
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
    // descriptor is a Float32Array of 128 values - convert to plain array for JSON/Firestore
    const descriptorArray = Array.from(detection.descriptor);
    onCaptured(descriptorArray);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", textAlign: "center" }}>
      <h3>Face Verification</h3>
      <p style={{ color: "#555" }}>{status}</p>
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <video
        ref={videoRef}
        autoPlay
        muted
        width="320"
        height="240"
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
      />

      <div>
        <button
          onClick={handleCapture}
          disabled={!modelsLoaded}
          style={{ marginTop: "1rem", padding: "10px 20px", fontSize: "1rem" }}
        >
          Capture Face
        </button>
      </div>
    </div>
  );
}