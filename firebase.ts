import { initializeApp } from 'firebase/app';
import {getAuth} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAI8eGY0Moe5QvygAZqa2YrfQl1o8ri_Yo",
    authDomain: "studio-8476491672-35ae3.firebaseapp.com",
    projectId: "studio-8476491672-35ae3",
    storageBucket: "studio-8476491672-35ae3.firebasestorage.app",
    messagingSenderId: "446680715260",
    appId: "1:446680715260:web:50a5ce1fa7623c9880ac79"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;