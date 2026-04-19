import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB3pPC1xlgLMvrxIUjxseof5NglbwRGPwM",
  authDomain: "flynk-asf-futo.firebaseapp.com",
  projectId: "flynk-asf-futo",
  storageBucket: "flynk-asf-futo.firebasestorage.app",
  messagingSenderId: "82725373050",
  appId: "1:82725373050:web:f7ab22132fc9855ff267c3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});
export const storage = getStorage(app);
