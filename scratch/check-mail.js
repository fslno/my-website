
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json'); // I'll assume it exists or use env

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function checkMail() {
  const snapshot = await db.collection('mail').orderBy('createdAt', 'desc').limit(5).get();
  snapshot.forEach(doc => {
    console.log(`Doc: ${doc.id}`);
    console.log(`To: ${doc.data().to}`);
    console.log(`Status: ${JSON.stringify(doc.data().delivery || doc.data().status || 'N/A')}`);
    if (doc.data().error) console.log(`Error: ${doc.data().error}`);
  });
}

checkMail().catch(console.error);
