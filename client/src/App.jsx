import { useState } from "react";
import "./App.css";
import VoterCheck from "./components/VoterCheck";
import FaceCapture from "./components/FaceCapture";
import WebAuthnSetup from "./components/WebAuthnSetup";
import Ballot from "./components/Ballot";
import ResultsPanel from "./components/ResultsPanel";

function App() {
  const [voter, setVoter] = useState(null);
  const [step, setStep] = useState("cnic"); // cnic -> face -> webauthn -> NA -> PA -> done

  const handleEligible = (data) => {
    setVoter(data);
    setStep("face");
  };

  const handleFaceCaptured = () => {
    setStep("webauthn");
  };

  const handleWebAuthnVerified = () => {
    if (voter.hasVotedNA && voter.hasVotedPA) {
      setStep("done");
    } else if (voter.hasVotedNA) {
      setStep("PA");
    } else {
      setStep("NA");
    }
  };

  const handleNAVoted = () => setStep("PA");
  const handlePAVoted = () => setStep("done");

  const showResults = step === "NA" || step === "PA";
  const resultsLevel = step === "PA" ? "PA" : "NA";
  const resultsConstituency =
    step === "PA" ? voter?.paConstituency : voter?.naConstituency;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Online Voting System</h1>
        <p>Demo project — simulated data, not connected to NADRA or any government system.</p>
      </header>

      <main className="app-body">
        <div>
          {step === "cnic" && <VoterCheck onEligible={handleEligible} />}

          {step === "face" && <FaceCapture onCaptured={handleFaceCaptured} />}

          {step === "webauthn" && (
            <WebAuthnSetup cnic={voter.cnic} onVerified={handleWebAuthnVerified} />
          )}

          {step === "NA" && (
            <Ballot
              cnic={voter.cnic}
              level="NA"
              constituency={voter.naConstituency}
              onVoted={handleNAVoted}
            />
          )}

          {step === "PA" && (
            <Ballot
              cnic={voter.cnic}
              level="PA"
              constituency={voter.paConstituency}
              onVoted={handlePAVoted}
            />
          )}

          {step === "done" && (
            <div className="done-message">
              <h2>Thank you, {voter.fullName}.</h2>
              <p>Your ballots have been recorded. You may now close this page.</p>
            </div>
          )}
        </div>

        {showResults && resultsConstituency && (
          <ResultsPanel level={resultsLevel} constituency={resultsConstituency} />
        )}
      </main>
    </div>
  );
}

export default App;