import { useState } from "react";
import Ballot from "./components/Ballot";

function App() {
  const [voted, setVoted] = useState(false);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Ballot Test</h1>
      {voted ? (
        <p style={{ textAlign: "center", color: "green", fontSize: "1.2rem" }}>
          Thank you for voting!
        </p>
      ) : (
        <Ballot cnic="3520255566677" onVoted={() => setVoted(true)} />
      )}
    </div>
  );
}

export default App;