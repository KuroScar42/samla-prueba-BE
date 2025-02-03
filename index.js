import express from "express";
import functions from "firebase-functions";
import { db, storage } from "./config/firebase-settings.js";
import {
  addDoc,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { userSchema } from "./utils/index.js";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import FormData from "form-data";

const app = express();
const port = 3131;

app.use(express.json());

app.use(cors());

app.post("/registerUser", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneCountryCode,
      telephone,
      idType,
      idNumber,
      department,
      municipality,
      direction,
      monthlyEarns,
    } = req.body;

    const { error, value } = userSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.send(error.details);
    }

    const newDocRef = collection(db, "users");
    const resultRef = await addDoc(newDocRef, {
      firstName,
      lastName,
      email,
      phoneCountryCode,
      telephone,
      idType,
      idNumber,
      department,
      municipality,
      direction,
      monthlyEarns,
    });

    res
      .status(201)
      .send({ message: "User info saved successfully", id: resultRef.id });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Error saving data: " + error.message });
  }
});

const getFileDownloadURL = async (fileName) => {
  const storageRef = ref(storage, `ID_Documents/${fileName}`);
  const url = await getDownloadURL(storageRef);
  return url;
};

app.get("/getAllUsers", async (req, res) => {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    const users = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const documentImageUrl = await getFileDownloadURL(doc.id);
        return {
          id: doc.id,
          ...data,
          documentImageUrl,
        };
      })
    );

    res.status(200).send(users);
  } catch (error) {
    res
      .status(500)
      .send({ error: "Error retrieving records: " + error.message });
  }
});

app.post(
  "/imageUpload/:userId/:type",
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
  async (req, res) => {
    try {
      const { userId, type } = req.params;
      const contentType = req.headers["content-type"];

      if (!userId) {
        return res.status(400).send({ error: "Missing ID parameter" });
      }

      if (!req.body || req.body.length === 0) {
        return res.status(400).send({ error: "No image data received" });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(contentType)) {
        return res
          .status(400)
          .send({ error: "Invalid file type. Only JPEG and PNG are allowed." });
      }

      const fileName = `ID_Documents/${userId}-${type}`;
      const storageRef = ref(storage, fileName);
      const metadata = { contentType };

      await uploadBytes(storageRef, req.body, metadata);

      const imageUrl = await getDownloadURL(storageRef);

      const userRef = doc(db, "users", userId);
      const user = await getDoc(userRef);
      const userData = user.data();

      if (userData.documentImageUrl) {
        await updateDoc(userRef, {
          documentImageUrl: [...userData.documentImageUrl, imageUrl],
        });
      } else {
        await updateDoc(userRef, { documentImageUrl: [imageUrl] });
      }

      // await updateDoc(userRef, { documentImageUrl: imageUrl });

      res
        .status(201)
        .send({ message: "Image uploaded successfully", imageUrl });
    } catch (error) {
      console.error("Image upload error:", error);
      res
        .status(500)
        .send({ error: "Error uploading image: " + error.message });
    }
  }
);

const subscriptionKey = process.env.SUSCRIPTION_KEY;
const azureEndpoint = process.env.AZURE_API_URL;

app.post(
  "/detectFace",
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
  async (req, res) => {
    try {
      const contentType = req.headers["content-type"];
      if (!req.body || req.body.length === 0) {
        return res.status(400).send({ error: "No image data received" });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(contentType)) {
        return res
          .status(400)
          .send({ error: "Invalid file type. Only JPEG and PNG are allowed." });
      }

      // Generate a unique filename using timestamp
      const fileName = `temp/temporalImage`;
      const storageRef = ref(storage, fileName);
      const metadata = { contentType };

      await uploadBytes(storageRef, req.body, metadata);

      const imageUrl = await getDownloadURL(storageRef);

      // Azure Face API request
      const response = await axios.post(
        `${azureEndpoint}/face/v1.0/detect`,
        {
          url: imageUrl,
        },
        {
          headers: {
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            "Content-Type": "application/json",
          },
        }
      );

      return res
        .status(200)
        .send({ validFace: response.data && response.data?.length > 0 });
    } catch (error) {
      console.error("Error during face analysis:", error);
      res
        .status(500)
        .json({ message: "Error analyzing the face", error: error.message });
    }
  }
);

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export const api = functions.https.onRequest(app);
