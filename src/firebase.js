import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBqzfUw4x1ZMJdGxmBLZcDecOl121Z-wlc",
  authDomain: "project-management-tool-6725d.firebaseapp.com",
  projectId: "project-management-tool-6725d",
  storageBucket: "project-management-tool-6725d.firebasestorage.app",
  messagingSenderId: "464562075527",
  appId: "1:464562075527:web:39a7ade02a0002f16dc522",
  databaseURL:
    "https://project-management-tool-6725d-default-rtdb.firebaseio.com", // Added this
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
