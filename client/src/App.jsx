import { useState } from "react";
import Ballot from "./components/Ballot";

function App() {
  const [voter, setVoter] = useState(null);
  const [step, setStep] = useState("NA"); // "NA" -> "PA" -> "done"

  // Temporary hardcoded voter for testing (later replaced by real CNIC entry flow)
  const testVoter = {
    cnic: "3520255566677",
    naConstituency: "NA-263",
    paConstituency: "PB-42",
  };

  const handleNAVoted = () => setStep("PA");
  const handlePAVoted = () => setStep("done");

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Online Voting System</h1>

      {step === "NA" && (
        <Ballot
          cnic={testVoter.cnic}
          level="NA"
          constituency={testVoter.naConstituency}
          onVoted={handleNAVoted}
        />
      )}

      {step === "PA" && (
        <Ballot
          cnic={testVoter.cnic}
          level="PA"
          constituency={testVoter.paConstituency}
          onVoted={handlePAVoted}
        />
      )}

      {step === "done" && (
        <p style={{ textAlign: "center", color: "green", fontSize: "1.2rem" }}>
          Thank you for voting! Both ballots submitted.
        </p>
      )}
    </div>
  );
}

export default App;