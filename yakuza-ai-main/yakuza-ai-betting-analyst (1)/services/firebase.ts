// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// إعدادات Firebase الخاصة بمشروعك (Yakuza AI)
const firebaseConfig = {
  apiKey: "AIzaSyAV-2RbTd5uI-bl4cQ7IeJSVoy-NbA7_4U",
  authDomain: "yakuza-ai.firebaseapp.com",
  projectId: "yakuza-ai",
  storageBucket: "yakuza-ai.firebasestorage.app",
  messagingSenderId: "333876053572",
  appId: "1:333876053572:web:a75da066abd7e9c0a11e11",
  measurementId: "G-WFG9FGHGJX"
};

// 1. تفعيل التطبيق
const app = initializeApp(firebaseConfig);

// 2. تصدير الأدوات (هادو هما اللي ناقصينك وكانو دايرين المشكل)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);