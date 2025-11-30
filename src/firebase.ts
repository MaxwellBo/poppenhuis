import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB58W8TQi0UnVCNvXcgCTc6P230DXzya44",
  authDomain: "poppenhu-is.firebaseapp.com",
  projectId: "poppenhu-is",
  storageBucket: "poppenhu-is.firebasestorage.app",
  messagingSenderId: "584295659368",
  appId: "1:584295659368:web:297ae35ccd2653f68208dd",
  measurementId: "G-450HM7SJ6H"
};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);