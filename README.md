# Secure Voting Platform (Demo)

A demo online voting system simulating Pakistan's dual ballot election
(National + Provincial Assembly), with CNIC lookup, face recognition, and
WebAuthn fingerprint verification. **Not a real voting system,** no NADRA
connection, all voters and candidates are fictional sample data.

## Stack

React (Vite) · Node.js/Express · Firebase Firestore · face-api.js ·
@simplewebauthn

## How it works

1. Voter enters CNIC >> checked against a preseeded voter roll
2. Face verification (live webcam vs stored descriptor)
3. Fingerprint verification (WebAuthn, device sensor)
4. Green Ballot (National Assembly) >> White Ballot (Provincial Assembly)
5. Vote stored anonymously, never linked to the CNIC

All sensitive checks (eligibility, face match, vote casting) run server side
only, Firestore security rules block direct client writes.

## Run it locally

1. `npm install` in both `client/` and `server/`
2. Create a free Firebase project >> enable Firestore
3. Add a service account key as `server/src/config/serviceAccountKey.json`
4. Add your web app config to `client/src/firebase.js`
5. `npm run dev` in `server/`, then `npm run dev` in `client/`
6. Seed data: `POST /api/seed-voters` and `POST /api/seed-candidates`
7. Visit `/?admin=1` to enroll a face for a test CNIC, then vote at `/`

## Status

Core flow works end to end. Styling and results dashboard still evolving.

## Future idea

Move vote tallying to a blockchain smart contract for public auditability,
keeping identity data off-chain.
