import FaceCapture from "./components/FaceCapture";

function App() {
  const handleCaptured = (descriptor) => {
    console.log("Captured descriptor:", descriptor);
    alert("Face captured! Check browser console for the 128-value descriptor array.");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Face Capture Test</h1>
      <FaceCapture onCaptured={handleCaptured} />
    </div>
  );
}

export default App;