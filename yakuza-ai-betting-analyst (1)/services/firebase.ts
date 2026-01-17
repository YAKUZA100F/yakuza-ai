// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// إعدادات Firebase (تم نسخها بدقة من الكود الأصلي للموقع)
const firebaseConfig = {
  apiKey: "AIzaSyAV-2RbTd5uI-bl4cQ7IeJSVoy-NbA7_4U",
  authDomain: "yakuza-ai.firebaseapp.com",
  projectId: "yakuza-ai",
  storageBucket: "yakuza-ai.firebasestorage.app",
  messagingSenderId: "333876053572",
  appId: "1:333876053572:web:a75da066abd7e9c0a11e11",
  measurementId: "G-WEG9EGHGJX" // تم تصحيح هذا السطر (كان عندك غالط)
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// تصدير الأدوات
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);