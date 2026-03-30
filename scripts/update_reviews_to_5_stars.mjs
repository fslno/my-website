import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function update() {
  const auth = getAuth(app);
  try {
    await signInAnonymously(auth);
    console.log("Authenticated anonymously.");
  } catch (err) {
    console.error("Authentication failed:", err);
    process.exit(1);
  }

  const reviewsRef = collection(db, "reviews");
  const snapshot = await getDocs(reviewsRef);
  
  console.log(`Checking ${snapshot.size} reviews...`);
  
  let count = 0;
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    if (data.rating !== 5) {
      await updateDoc(doc(db, "reviews", docSnapshot.id), {
        rating: 5
      });
      count++;
      console.log(`[${count}] Updated review ${docSnapshot.id} to 5 stars.`);
    }
  }

  console.log(`Update complete. ${count} reviews were updated to 5 stars!`);
}

update();
