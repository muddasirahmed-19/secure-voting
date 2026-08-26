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

  const handleSkipNA = () => setStep("PA");
  const handleSkipPA = () => setStep("done");

  const resultsLevel = step === "PA" ? "PA" : "NA";
  const resultsConstituency =
    step === "PA"
      ? voter?.paConstituency
      : step === "NA"
      ? voter?.naConstituency
      : undefined;

  const letterheadRight = {
    cnic: "Identity Check",
    face: "Biometric Verification",
    webauthn: "Fingerprint Verification",
    NA: "National Assembly Ballot",
    PA: "Provincial Assembly Ballot",
    done: "Confirmation",
  }[step];

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Online Voting System</h1>
        <p>Demo project — simulated data, not connected to NADRA or any government system.</p>
      </header>

      <div className="app-stage">
        <main className="app-body">
          <div className="document-wrap">
            <div className="document-letterhead">
              <span>Official Ballot — Demo</span>
              <span>{letterheadRight}</span>
            </div>

            {step === "cnic" && <VoterCheck onEligible={handleEligible} />}

            {step === "face" && (
              <FaceCapture
                cnic={voter.cnic}
                hasFaceOnFile={voter.hasFaceOnFile}
                onVerified={handleFaceCaptured}
              />
            )}

            {step === "webauthn" && (
              <WebAuthnSetup cnic={voter.cnic} onVerified={handleWebAuthnVerified} />
            )}

            {step === "NA" && (
              <Ballot
                cnic={voter.cnic}
                level="NA"
                constituency={voter.naConstituency}
                onVoted={handleNAVoted}
                onSkip={handleSkipNA}
              />
            )}

            {step === "PA" && (
              <Ballot
                cnic={voter.cnic}
                level="PA"
                constituency={voter.paConstituency}
                onVoted={handlePAVoted}
                onSkip={handleSkipPA}
              />
            )}

            {step === "done" && (
              <div className="done-message">
                <h2>Thank you, {voter.fullName}.</h2>
                <p>Your ballots have been recorded. You may now close this page.</p>
              </div>
            )}
          </div>

          <ResultsPanel level={resultsLevel} constituency={resultsConstituency} />
        </main>
      </div>
    </div>
  );
}

export default App;