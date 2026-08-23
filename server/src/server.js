import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/firebaseAdmin.js";

dotenv.config();

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

app.post("/api/seed-candidates", async (req, res) => {
  try {
    const candidates = [
      { name: "Ayesha Khan", party: "Progress Party", voteCount: 0 },
      { name: "Bilal Ahmed", party: "Unity Alliance", voteCount: 0 },
      { name: "Sara Malik", party: "Future Forward", voteCount: 0 },
    ];

    const batch = db.batch();
    candidates.forEach((c) => {
      const ref = db.collection("candidates").doc();
      batch.set(ref, c);
    });
    await batch.commit();

    res.json({ status: "ok", message: "Candidates seeded", count: candidates.length });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Seed sample voters (simulated NADRA-style roll, run once)
app.post("/api/seed-voters", async (req, res) => {
  try {
    const voters = [
      {
        cnic: "3520212345671",
        fullName: "Ali Raza",
        dob: "1998-05-14",
        hasVoted: false,
        faceDescriptor: null,
        webAuthnCredentialId: null,
      },
      {
        cnic: "3520298765432",
        fullName: "Hina Sheikh",
        dob: "1995-11-02",
        hasVoted: false,
        faceDescriptor: null,
        webAuthnCredentialId: null,
      },
      {
        cnic: "3520255566677",
        fullName: "Usman Tariq",
        dob: "2001-02-20",
        hasVoted: false,
        faceDescriptor: null,
        webAuthnCredentialId: null,
      },
    ];

    const batch = db.batch();
    voters.forEach((v) => {
      const ref = db.collection("voters").doc(v.cnic); // CNIC as document ID
      batch.set(ref, v);
    });
    await batch.commit();

    res.json({ status: "ok", message: "Voters seeded", count: voters.length });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Check if a CNIC is a registered, eligible voter
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

    if (voter.hasVoted) {
      return res.status(403).json({ status: "error", message: "You have already voted" });
    }

    // Eligible — return minimal info needed for next step (not the whole record)
    res.json({
      status: "ok",
      message: "Voter eligible",
      fullName: voter.fullName,
      hasFaceOnFile: voter.faceDescriptor !== null,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});