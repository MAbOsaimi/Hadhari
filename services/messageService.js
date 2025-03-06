import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig.js";

const storedMessages = new Set();
const confidenceThreshold = 60; // Messages with confidence below this value will not trigger blacklisting.
let spamCount = 0;
let hamCount = 0;

/**
 * Adds a message to Firestore.
 */
export async function addMessageToFirestore(
  senderNumber,
  groupId,
  timestamp,
  rawMessage,
  preprocessedMessage,
  prediction,
  confidence
) {
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      sender_number: senderNumber,
      group: groupId,
      timestamp: timestamp,
      raw_message: rawMessage,
      preprocessed_message: preprocessedMessage,
      prediction: prediction,
      confidence: confidence,
    });
    console.log("Document written in messages with ID:", docRef.id);
  } catch (e) {
    console.error("Error adding document to messages:", e);
  }
}

/**
 * Sends a message to the spam detection API and processes the response.
 */
export async function analyzeMessage(
  senderNumber,
  groupId,
  rawMessage,
  preprocessedMessage,
  timestamp
) {
  console.log(
    `Processing message from ${senderNumber}: ${preprocessedMessage}`
  );

  try {
    const response = await fetch(process.env.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: preprocessedMessage,
        sender_number: senderNumber,
      }),
    });

    const data = await response.json();
    const prediction = data.prediction;
    const isSpam = prediction === "Spam";

    // Skip ham messages to avoid significant imbalance.
    if (!isSpam && hamCount >= spamCount) {
      console.log("Skipping ham message.");
      return;
    }

    if (storedMessages.has(rawMessage)) {
      console.log("Skipping duplicate message.");
      return;
    }

    const confidence = isSpam ? data.confidence : 1 - data.confidence;
    storedMessages.add(rawMessage);

    if (isSpam) {
      spamCount++;
      if (confidence >= confidenceThreshold) {
        blackListUser(senderNumber, "AUTO", groupId, timestamp);
      }
    } else {
      hamCount++;
    }

    addMessageToFirestore(
      senderNumber,
      groupId,
      timestamp,
      rawMessage,
      preprocessedMessage,
      prediction,
      confidence
    );
  } catch (error) {
    console.error("Error:", error);
  }
}
