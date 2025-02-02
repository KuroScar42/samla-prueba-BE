const express = require("express");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK with your service account credentials
const serviceAccount = require("./firebase-service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<your-database-name>.firebaseio.com",
});

const app = express();
const port = 3000;

app.use(express.json());

// Sample route to test the backend
app.get("/", (req, res) => {
  res.send("Hello from Express and Firebase!");
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
