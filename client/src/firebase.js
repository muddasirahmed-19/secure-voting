import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjBiTx93ppHxIVFN18F0ptQ_fnB0-FjQg",
  authDomain: "voting-platform-b6040.firebaseapp.com",
  projectId: "voting-platform-b6040",
  storageBucket: "voting-platform-b6040.firebasestorage.app",
  messagingSenderId: "444988410955",
  appId: "1:444988410955:web:9e4e16d40b8a53578451ce"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;