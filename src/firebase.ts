/*----*/

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBajpd-zZh4051BRWpl14WO6q9c6m7aN1M",
  authDomain: "jerjawi2-park.firebaseapp.com",
  databaseURL: "https://jerjawi2-park-default-rtdb.firebaseio.com",
  projectId: "jerjawi2-park",
  storageBucket: "jerjawi2-park.firebasestorage.app",
  messagingSenderId: "857535800294",
  appId: "1:857535800294:web:f70625493b69425d1d6c27"
};
const app = initializeApp(firebaseConfig);

// 👇 هذا هو المهم
export const db = getDatabase(app);
export const auth = getAuth(app);
