import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAWmJKc2v41zWnHKM_i-EALzKXQ4QAqEBY",
  authDomain: "pineapplesystem-df3ca.firebaseapp.com",
  projectId: "pineapplesystem-df3ca",
  storageBucket: "pineapplesystem-df3ca.firebasestorage.app",
  messagingSenderId: "292505870376",
  appId: "1:292505870376:web:cd6b3f0bab69944b5e951d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
