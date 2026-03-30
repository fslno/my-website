import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, addDoc, query, where, doc, limit } from "firebase/firestore";
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

const teams = [
  "Real Madrid",
  "Barcelona",
  "Inter Miami",
  "Manchester United",
  "Arsenal"
];

const reviewerNames = [
  "James R.", "David M.", "Sarah L.", "Michael K.", "Emily W.",
  "Chris B.", "Jessica T.", "Matthew S.", "Ashley H.", "Joshua G."
];

const reviewsTexts = [
  "Incredible quality! The fabric is so breathable and the fit is perfect. Highly recommend!",
  "Best jersey I've ever owned. The details are amazing and it looks even better in person.",
  "Fast shipping and great customer service. The kit is authentic and fits true to size.",
  "Absolutely love it. Wearing it to every match now. 5/5 stars!",
  "Premium feel. You can really tell the difference with the official fan versions. Great buy.",
  "The crest is beautiful and the material feels very high-end. Definitely worth the price.",
  "Bought this as a gift and they loved it! Stitched perfectly.",
  "Great collection addition. The colors are vibrant and it washes well.",
  "Super comfortable for playing or just lounging. A must-have for any fan.",
  "Five stars! Everything from ordering to delivery was seamless."
];

async function seed() {
  const auth = getAuth(app);
  try {
    await signInAnonymously(auth);
    console.log("Authenticated anonymously.");
  } catch (err) {
    console.error("Authentication failed:", err);
    process.exit(1);
  }

  for (const team of teams) {
    console.log(`\nProcessing team: ${team}`);
    
    // Find the product
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("status", "==", "active"));
    const snapshot = await getDocs(q);
    
    const product = snapshot.docs.find(d => d.data().name.toLowerCase().includes(team.toLowerCase()));
    
    if (!product) {
      console.log(`Could not find active product for ${team}. Skipping.`);
      continue;
    }
    
    const productId = product.id;
    console.log(`Found product: ${product.data().name} (ID: ${productId})`);
    
    // Clear existing reviews for this product
    const reviewsRef = collection(db, "reviews");
    const reviewsQuery = query(reviewsRef, where("productId", "==", productId));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    console.log(`Deleting ${reviewsSnapshot.size} existing reviews for this product...`);
    for (const rDoc of reviewsSnapshot.docs) {
      await deleteDoc(doc(db, "reviews", rDoc.id));
    }
    
    // Add exactly 2 reviews
    for (let i = 0; i < 2; i++) {
      const name = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
      const text = reviewsTexts[Math.floor(Math.random() * reviewsTexts.length)];
      
      // Generate a date between May 2020 and now
      const start = new Date(2020, 4, 1);
      const end = new Date();
      const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      
      const newReview = {
        productId: productId,
        productName: product.data().name,
        userName: name,
        rating: 5,
        comment: text,
        createdAt: randomDate.toISOString(),
        published: true,
        status: "approved"
      };
      
      await addDoc(reviewsRef, newReview);
      console.log(`Added Review ${i+1} by ${name}`);
    }
  }

  console.log("\nTargeted seeding complete!");
  process.exit(0);
}

seed();
