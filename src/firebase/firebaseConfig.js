
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyA1Ife1eS6VxnyF79ND_5_xjjl9unV-0xY",
    authDomain: "projectomni-3de5e.firebaseapp.com",
    projectId: "projectomni-3de5e",
    storageBucket: "projectomni-3de5e.firebasestorage.app",
    messagingSenderId: "900473588069",
    appId: "1:900473588069:web:9065c06dd72e8e1d96b98c"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);