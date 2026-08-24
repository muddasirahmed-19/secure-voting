import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebaseAdmin.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const rpName = "Secure Voting Platform";
const rpID = "localhost"; // change to your real domain when deployed
const origin = "http://localhost:5173"; // frontend URL

// Temporary in-memory store for challenges (fine for demo; use Redis/Firestore in production)
const challengeStore = {};

dotenv.config();


// Euclidean distance between two face descriptors (128-length arrays)
// Lower distance = more similar faces. Typical threshold: 0.6
function euclideanDistance(descriptor1, descriptor2) {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error("Descriptor length mismatch");
  }
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

const FACE_MATCH_THRESHOLD = 0.6; // face-api.js standard threshold


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Voting system API running" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    await db.collection("_test").doc("ping").set({ timestamp: Date.now() });
    res.json({ status: "ok", message: "Firestore connected successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Seed sample candidates for both NA and PA levels, real party names
app.post("/api/seed-candidates", async (req, res) => {
  try {
    const candidates = [
      // National Assembly candidates - NA-263
      { name: "Zahid Khan", party: "Pakistan Tehreek-e-Insaf (PTI)", level: "NA", constituency: "NA-263", voteCount: 0 },
      { name: "Naseer Ahmed Baloch", party: "Pakistan Muslim League (N)", level: "NA", constituency: "NA-263", voteCount: 0 },
      { name: "Sana Jamali", party: "Pakistan Peoples Party (PPP)", level: "NA", constituency: "NA-263", voteCount: 0 },
      { name: "Mir Aslam Raisani", party: "Balochistan Awami Party (BAP)", level: "NA", constituency: "NA-263", voteCount: 0 },

      // Provincial Assembly candidates - PB-42
      { name: "Rahim Dad Kakar", party: "Pakistan Tehreek-e-Insaf (PTI)", level: "PA", constituency: "PB-42", voteCount: 0 },
      { name: "Fahmida Sultana", party: "Pakistan Muslim League (N)", level: "PA", constituency: "PB-42", voteCount: 0 },
      { name: "Ghulam Rasool Marri", party: "Pakistan Peoples Party (PPP)", level: "PA", constituency: "PB-42", voteCount: 0 },
      { name: "Yasmeen Lehri", party: "Balochistan Awami Party (BAP)", level: "PA", constituency: "PB-42", voteCount: 0 },
    ];

    const batch = db.batch();
    candidates.forEach((c) => {
      const ref = db.collection("candidates").doc();
      batch.set(ref, c);
    });
    await batch.commit();

    res.json({ status: "ok", message: "Candidates re-seeded with NA/PA levels", count: candidates.length });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Seed sample voters (simulated NADRA-style roll, with NA/PA constituency mapping)
app.post("/api/seed-voters", async (req, res) => {
  try {
    const voters = [
      {
        cnic: "3520212345671",
        fullName: "Ali Raza",
        dob: "1998-05-14",
        naConstituency: "NA-263",
        paConstituency: "PB-42",
        hasVotedNA: false,
        hasVotedPA: false,
        faceDescriptor: null,
        webAuthnCredentialId: null,
      },
      {
        cnic: "3520298765432",
        fullName: "Hina Sheikh",
        dob: "1995-11-02",
        naConstituency: "NA-263",
        paConstituency: "PB-42",
        hasVotedNA: false,
        hasVotedPA: false,
        faceDescriptor: null,
        webAuthnCredentialId: null,
      },
      {
        cnic: "3520255566677",
        fullName: "Usman Tariq",
        dob: "2001-02-20",
        naConstituency: "NA-263",
        paConstituency: "PB-42",
        hasVotedNA: false,
        hasVotedPA: false,
        faceDescriptor: null,
        webAuthnCredentialId: null,
      },
    ];

    const batch = db.batch();
    voters.forEach((v) => {
      const ref = db.collection("voters").doc(v.cnic);
      batch.set(ref, v);
    });
    await batch.commit();

    res.json({ status: "ok", message: "Voters re-seeded with constituencies", count: voters.length });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/api/check-voter", async (req, res) => {
  try {
    const { cnic } = req.body;

    if (!cnic || !/^\d{13}$/.test(cnic)) {
      return res.status(400).json({ status: "error", message: "Invalid CNIC format" });
    }

    const voterRef = db.collection("voters").doc(cnic);
    const voterSnap = await voterRef.get();

    if (!voterSnap.exists) {
      return res.status(404).json({ status: "error", message: "You are not a registered voter" });
    }

    const voter = voterSnap.data();

    if (voter.hasVotedNA && voter.hasVotedPA) {
      return res.status(403).json({ status: "error", message: "You have already voted" });
    }

    res.json({
      status: "ok",
      message: "Voter eligible",
      fullName: voter.fullName,
      naConstituency: voter.naConstituency,
      paConstituency: voter.paConstituency,
      hasVotedNA: voter.hasVotedNA,
      hasVotedPA: voter.hasVotedPA,
      hasFaceOnFile: voter.faceDescriptor !== null,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Step 1: generate registration options (first-time biometric enroll for a CNIC)
app.post("/api/webauthn/register-options", async (req, res) => {
  try {
    const { cnic } = req.body;
    const voterRef = db.collection("voters").doc(cnic);
    const voterSnap = await voterRef.get();

    if (!voterSnap.exists) {
      return res.status(404).json({ status: "error", message: "Voter not found" });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(cnic),
      userName: cnic,
      attestationType: "none",
      authenticatorSelection: {
        userVerification: "required", // forces biometric/PIN, not just "device present"
      },
    });

    challengeStore[cnic] = options.challenge;
    res.json(options);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Step 2: verify registration response, store credential
app.post("/api/webauthn/register-verify", async (req, res) => {
  try {
    const { cnic, response } = req.body;
    const expectedChallenge = challengeStore[cnic];

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      return res.status(403).json({ status: "error", message: "WebAuthn registration failed" });
    }

    const { credential } = verification.registrationInfo;

    await db.collection("voters").doc(cnic).update({
      webAuthnCredentialId: credential.id,
      webAuthnPublicKey: Buffer.from(credential.publicKey).toString("base64"),
      webAuthnCounter: credential.counter,
    });

    delete challengeStore[cnic];
    res.json({ status: "ok", message: "Device biometric registered successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Public: get candidates filtered by level and constituency
app.get("/api/candidates", async (req, res) => {
  try {
    const { level, constituency } = req.query;

    let query = db.collection("candidates");
    if (level) query = query.where("level", "==", level);
    if (constituency) query = query.where("constituency", "==", constituency);

    const snapshot = await query.get();
    const candidates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ status: "ok", candidates });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Cast a vote for NA or PA level - tracks separately, requires both to complete voting
app.post("/api/vote", async (req, res) => {
  try {
    const { cnic, candidateId, level } = req.body;

    if (!cnic || !candidateId || !["NA", "PA"].includes(level)) {
      return res.status(400).json({ status: "error", message: "Missing or invalid CNIC, candidate, or level" });
    }

    const voterRef = db.collection("voters").doc(cnic);
    const voterSnap = await voterRef.get();

    if (!voterSnap.exists) {
      return res.status(404).json({ status: "error", message: "Voter not found" });
    }

    const voter = voterSnap.data();
    const votedField = level === "NA" ? "hasVotedNA" : "hasVotedPA";

    if (voter[votedField]) {
      return res.status(403).json({ status: "error", message: `You have already voted at the ${level} level` });
    }

    const candidateRef = db.collection("candidates").doc(candidateId);
    const candidateSnap = await candidateRef.get();

    if (!candidateSnap.exists) {
      return res.status(404).json({ status: "error", message: "Candidate not found" });
    }

    const candidateData = candidateSnap.data();
    if (candidateData.level !== level) {
      return res.status(400).json({ status: "error", message: "Candidate does not match voting level" });
    }

    const batch = db.batch();
    const voteRef = db.collection("votes").doc();
    batch.set(voteRef, {
      candidateId,
      level,
      constituency: candidateData.constituency,
      timestamp: Date.now(),
    });
    batch.update(candidateRef, { voteCount: (candidateData.voteCount || 0) + 1 });
    batch.update(voterRef, { [votedField]: true });
    await batch.commit();

    res.json({ status: "ok", message: `${level} vote cast successfully` });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Verify a live face descriptor against the stored descriptor for a CNIC
// NOTE: Not yet wired into the voting flow - will be enabled once full flow is built
/*
app.post("/api/verify-face", async (req, res) => {
  try {
    const { cnic, descriptor } = req.body;

    if (!cnic || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ status: "error", message: "Invalid CNIC or descriptor" });
    }

    const voterRef = db.collection("voters").doc(cnic);
    const voterSnap = await voterRef.get();

    if (!voterSnap.exists) {
      return res.status(404).json({ status: "error", message: "Voter not found" });
    }

    const voter = voterSnap.data();

    if (!voter.faceDescriptor) {
      return res.status(400).json({ status: "error", message: "No face on file for this voter" });
    }

    const distance = euclideanDistance(voter.faceDescriptor, descriptor);
    const isMatch = distance < FACE_MATCH_THRESHOLD;

    if (!isMatch) {
      return res.status(403).json({
        status: "error",
        message: "Face verification failed. Identity could not be confirmed.",
        distance,
      });
    }

    res.json({ status: "ok", message: "Face verified successfully", distance });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});
*/

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});