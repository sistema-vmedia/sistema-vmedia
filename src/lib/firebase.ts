import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBdzx4qGKFUC-jIp8p8xHQHNVb0oaaiFMk",
  authDomain: "studio-4347125562-7843a.firebaseapp.com",
  projectId: "studio-4347125562-7843a",
  storageBucket: "studio-4347125562-7843a.firebasestorage.app",
  messagingSenderId: "507781738844",
  appId: "1:507781738844:web:abf8dc14b6c6bbb3b45199"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
