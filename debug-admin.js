const { adminDb } = require('./src/lib/firebase-admin');

async function test() {
  try {
    console.log("Attempting to fetch config/theme...");
    const doc = await adminDb.doc('config/theme').get();
    console.log("Success! Data:", doc.data());
  } catch (err) {
    console.error("FAILED to fetch:", err);
  }
}

test();
