// SETUP: Firebase Console > Project settings > Your apps (Web) > copy the config values below.
// These web config values are not secrets; security comes from firestore.rules and your admin login.
// Never put your admin password in code. Until you fill these in, the site simply shows its default content.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyCHsXK062IVj7AARwfT2dxbyZJ-iKHR0qM",
    authDomain: "voice-forte-website.firebaseapp.com",
    projectId: "voice-forte-website",
    storageBucket: "voice-forte-website.firebasestorage.app",
    messagingSenderId: "1042407770134",
    appId: "1:1042407770134:web:ffa3762b0bbf5e7ee14d37"
};

export const configured = !firebaseConfig.apiKey.startsWith("YOUR_");
export const app = configured ? initializeApp(firebaseConfig) : null;
export const auth = configured ? getAuth(app) : null;
export const db = configured ? getFirestore(app) : null;
