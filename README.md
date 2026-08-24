# Secure Voting Platform (Demo)

A proof of concept online voting system for Pakistan, simulating how identity
verification and a dual ballot (National + Provincial Assembly) election
could work online.

**This is a demo project, not a real voting system.** It does not
connect to NADRA or any government database. All voters, candidates, and
constituencies are fictional sample data used to demonstrate the concept.

## What it does

- Looks up a voter by CNIC against a pre-seeded "voter roll"
- Verifies identity using face recognition (face-api.js) and device
  biometrics (WebAuthn - fingerprint/Face ID/Windows Hello)
- Presents two separate ballots per Pakistan's real system:
  - **Green Ballot:** National Assembly (NA) candidate, filtered by the
    voter's NA constituency
  - **White Ballot:** Provincial Assembly (PA) candidate, filtered by the
    voter's PA constituency
- Prevents double voting per ballot level
- Stores votes anonymously; never linked back to a CNIC

## Tech stack

- **Frontend:** React (Vite), face-api.js, @simplewebauthn/browser
- **Backend:** Node.js, Express, @simplewebauthn/server
- **Database:** Firebase Firestore (Admin SDK on backend only, all writes
  go through the server, never directly from the client)

## Security notes

- Firestore security rules block all direct client reads/writes; every
  sensitive action is validated server side
- Face matching (Euclidean distance on face descriptors) happens on the
  backend so it can't be bypassed via browser dev tools
- WebAuthn never exposes raw biometric data to the browser or server, it
  only returns a cryptographic proof of device level verification, the same
  trust model real banking apps use
- Since no public API can access NADRA's actual biometric database, this
  project uses self seeded sample data to demonstrate the same verification
  logic that would apply to a real integration

## Status

Actively in development.

## Possible future direction

A later phase could move vote tallying to a blockchain smart contract for
public auditability and immutability, while keeping identity/biometric data
off chain for privacy.
