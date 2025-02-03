import express from "express";
import functions from "firebase-functions";
import { db } from "./config/firebase-settings.js";
import { doc, getDoc } from "firebase/firestore";

// const admin = require("firebase-admin");

// Initialize Firebase Admin SDK with your service account credentials
// const serviceAccount = require("./firebase-service-account.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://<your-database-name>.firebaseio.com",
// });

const app = express();
const port = 3131;

app.use(express.json());

// Sample route to test the backend
app.get("/", (req, res) => {
  res.send("Hello from Express and Firebase!");
});
app.get("/testing", async (req, res) => {
  const ref = doc(db, "test", "KDYoauj6H84w5QfndiCE");
  const result = await getDoc(ref);
  if (result.exists()) {
    res.send(result.data());
  } else {
    res.send("Nel");
  }
});

// Firebase route (example: add data to Firestore)
app.post("/addData", async (req, res) => {
  try {
    const { collection, document, data } = req.body;
    const db = admin.firestore();
    const docRef = db.collection(collection).doc(document);
    await docRef.set(data);
    res.status(200).send("Data added successfully");
  } catch (error) {
    res.status(500).send("Error adding data: " + error.message);
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export const api = functions.https.onRequest(app);
