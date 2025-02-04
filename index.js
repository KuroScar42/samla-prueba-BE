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
import morgan from "morgan";
import logger from "./logger.js";
import { authenticateToken } from "./auth.js";

const app = express();
const port = 3131;

// use Morgan to log all HTTP request
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// This is for unexpected errors
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.stack });
  res.status(500).send({ error: "Internal Server Error" });
});

app.use(express.json());

app.use(cors());

app.post("/registerUser", authenticateToken, async (req, res) => {
  logger.info("Processing registerUser request", { requestBody: req.body });
  logger.firebase.info("Processing registerUser request", {
    requestBody: req.body,
  });
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
      logger.warn("Validation failed", { details: error.details });
      logger.firebase.warn("Verification failed", { details: error.details });
      return res.status(400).send(error.details);
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

    logger.info("User info saved successfully", { userId: resultRef.id });
    logger.firebase.info("User info saved successfully", {
      userId: resultRef.id,
    });
  } catch (error) {
    logger.error("Error saving data:", { details: error.message });
    logger.firebase.error("Error saving data:", {
      details: error.message,
    });
    res.status(500).send({ error: "Error saving data: " + error.message });
  }
});

app.get("/getAllUsers", authenticateToken, async (req, res) => {
  try {
    logger.info("Processing getAllUsers request");
    logger.firebase.info("Processing getAllUsers request");

    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    const users = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      })
    );

    logger.info("Users info retrieved successfully");
    logger.firebase.info("Users info retrieved successfully");

    res.status(200).send(users);
  } catch (error) {
    logger.error("Error retrieving records", { details: error.message });
    logger.firebase.error("Error retrieving records", {
      details: error.message,
    });
    res
      .status(500)
      .send({ error: "Error retrieving records: " + error.message });
  }
});

app.post(
  "/imageUpload/:userId/:type",
  authenticateToken,
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
  async (req, res) => {
    logger.info("Processing imageUpload request", { requestBody: req.body });
    logger.firebase.info("Processing imageUpload request", {
      requestBody: req.body,
    });
    try {
      const { userId, type } = req.params;
      const contentType = req.headers["content-type"];

      if (!userId) {
        logger.warn("Validation failed", { details: "Missing ID parameter" });
        logger.firebase.warn("Verification failed", {
          details: "Missing ID parameter",
        });
        return res.status(400).send({ error: "Missing ID parameter" });
      }

      if (!req.body || req.body.length === 0) {
        logger.warn("Validation failed", { details: "No image data received" });
        logger.firebase.warn("Verification failed", {
          details: "No image data received",
        });
        return res.status(400).send({ error: "No image data received" });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(contentType)) {
        logger.warn("Validation failed", {
          details: "Invalid file type. Only JPEG and PNG are allowed.",
        });
        logger.firebase.warn("Verification failed", {
          details: "Invalid file type. Only JPEG and PNG are allowed.",
        });
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

      logger.info("Image uploaded successfully", { imageUrl });
      logger.firebase.info("Image uploaded successfully", { imageUrl });
      res
        .status(201)
        .send({ message: "Image uploaded successfully", imageUrl });
    } catch (error) {
      logger.error("Error uploading image", {
        details: error.message,
      });
      logger.firebase.error("Error uploading image", {
        details: error.message,
      });
      res
        .status(500)
        .send({ error: "Error uploading image: " + error.message });
    }
  }
);

app.post(
  "/selfieUpload/:userId",
  authenticateToken,
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
  async (req, res) => {
    logger.info("Processing selfieUpload request", { requestBody: req.body });
    logger.firebase.info("Processing selfieUpload request", {
      requestBody: req.body,
    });
    try {
      const { userId, type } = req.params;
      const contentType = req.headers["content-type"];

      if (!userId) {
        logger.warn("Validation failed", { details: "Missing ID parameter" });
        logger.firebase.warn("Verification failed", {
          details: "Missing ID parameter",
        });
        return res.status(400).send({ error: "Missing ID parameter" });
      }

      if (!req.body || req.body.length === 0) {
        logger.warn("Validation failed", { details: "No image data received" });
        logger.firebase.warn("Verification failed", {
          details: "No image data received",
        });
        return res.status(400).send({ error: "No image data received" });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(contentType)) {
        logger.warn("Validation failed", {
          details: "Invalid file type. Only JPEG and PNG are allowed.",
        });
        logger.firebase.warn("Verification failed", {
          details: "Invalid file type. Only JPEG and PNG are allowed.",
        });
        return res
          .status(400)
          .send({ error: "Invalid file type. Only JPEG and PNG are allowed." });
      }

      const fileName = `ID_Documents/${userId}-selfie`;
      const storageRef = ref(storage, fileName);
      const metadata = { contentType };

      await uploadBytes(storageRef, req.body, metadata);

      const imageUrl = await getDownloadURL(storageRef);

      const userRef = doc(db, "users", userId);
      const user = await getDoc(userRef);

      await updateDoc(userRef, { selfieImage: imageUrl });

      logger.info("Selfie uploaded successfully", { imageUrl });
      logger.firebase.info("Selfie uploaded successfully", { imageUrl });

      res
        .status(201)
        .send({ message: "Selfie uploaded successfully", imageUrl });
    } catch (error) {
      logger.error("Error uploading selfie", {
        details: error.message,
      });
      logger.firebase.error("Error uploading selfie", {
        details: error.message,
      });
      res
        .status(500)
        .send({ error: "Error uploading selfie: " + error.message });
    }
  }
);

const subscriptionKey = process.env.SUSCRIPTION_KEY;
const azureEndpoint = process.env.AZURE_API_URL;

app.post(
  "/detectFace",
  authenticateToken,
  bodyParser.raw({ type: ["image/jpeg", "image/png"], limit: "5mb" }),
  async (req, res) => {
    try {
      logger.info("Processing detectFace request", { requestBody: req.body });
      logger.firebase.info("Processing detectFace request", {
        requestBody: req.body,
      });
      const contentType = req.headers["content-type"];
      if (!req.body || req.body.length === 0) {
        logger.warn("Validation failed", { details: "No image data received" });
        logger.firebase.warn("Verification failed", {
          details: "No image data received",
        });
        return res.status(400).send({ error: "No image data received" });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(contentType)) {
        logger.warn("Validation failed", {
          details: "Invalid file type. Only JPEG and PNG are allowed.",
        });
        logger.firebase.warn("Verification failed", {
          details: "Invalid file type. Only JPEG and PNG are allowed.",
        });
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

      logger.info("Face analysis done successfully", { imageUrl });
      logger.firebase.info("Face analysis done successfully", { imageUrl });

      return res
        .status(200)
        .send({ validFace: response.data && response.data?.length > 0 });
    } catch (error) {
      logger.error("Error during face analysis", {
        details: error.message,
      });
      logger.firebase.error("Error during face analysis", {
        details: error.message,
      });
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
