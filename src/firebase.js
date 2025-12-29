import { initializeApp } from "firebase/app";
import { getAuth, TwitterAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWyt-c8WKx7fEhTQfuhcazJM27E-6BkWQ",
  authDomain: "ethmumbai-maxi.firebaseapp.com",
  projectId: "ethmumbai-maxi",
  storageBucket: "ethmumbai-maxi.firebasestorage.app",
  messagingSenderId: "1096851029246",
  appId: "1:1096851029246:web:8ef9f7c53278c5a1b039af"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new TwitterAuthProvider();
export const db = getFirestore(app);
