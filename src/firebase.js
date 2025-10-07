// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Vul hier jouw Firebase config in
const firebaseConfig = {
  apiKey: "AIzaSyBFClTpH-Vk0uJbjRwx9dpoZzCg8jJtQ54",
  authDomain: "dominos-lening-tracker.firebaseapp.com",
  projectId: "dominos-lening-tracker",
  storageBucket: "dominos-lening-tracker.firebasestorage.app",
  messagingSenderId: "577483653469",
  appId: "1:577483653469:web:da348f8a19b7b71f50e8b4",
  measurementId: "G-0YX12FT8MK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
