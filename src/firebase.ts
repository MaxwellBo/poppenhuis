import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
export const db = getFirestore(app);
export const storage = getStorage(app);