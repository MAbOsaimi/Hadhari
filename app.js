import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import { db } from "./firebaseConfig.js";
import { collection, addDoc } from "firebase/firestore";

const storedMessages = new Set();
let spamCount = 0;
let hamCount = 0;

const removeDiacritics = (text) => text.replace(/[\u064B-\u065F]/g, "");

const convertArabicNumbers = (text) => {
  const arabicNumbers = "٠١٢٣٤٥٦٧٨٩";
  const standardNumbers = "0123456789";
  return text.replace(
    /[٠-٩]/g,
    (d) => standardNumbers[arabicNumbers.indexOf(d)]
  );
};

const preprocessMessage = (message) => {
  message = message.normalize("NFKC");
  message = message.replace(/ـ+/g, "");
  message = message.replace(/(\S)\1{2,}/g, "$1$1");
  message = message.replace(/(?<!\d)\.(?!\d)/g, "");
  message = message.replace(/\s+/g, " ").trim();

  message = removeDiacritics(message);
  message = convertArabicNumbers(message);
  return message;
};

async function addMessageToFirestore(
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
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });

  sock.ev.on("messages.upsert", async (event) => {
    for (const message of event.messages) {
      if (
        !message.message ||
        message.message.protocolMessage ||
        message.key.fromMe
      ) {
        // Skip irrelevant messages
        continue;
      }
      const senderJid = message.key.participant;
      const groupId = message.key.remoteJid.split("@")[0];
      const senderNumber = senderJid.split("@")[0];
      const rawMessage =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";
      const preprocessedMessage = preprocessMessage(rawMessage);
      if (preprocessedMessage.length === 0) {
        continue;
      }

      console.log(
        `Received message from ${senderNumber}: ${preprocessedMessage}`
      );
      fetch(process.env.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: preprocessedMessage,
          sender_number: senderNumber,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          const prediction = data.prediction;
          const isSpam = prediction === "Spam";
          // Skip ham messages to avoid a significant imbalance in the data.
          if (!isSpam && hamCount >= spamCount) {
            console.log("Skipping ham message.");
            return;
          }

          const confidence = isSpam ? data.confidence : 1 - data.confidence;

          if (storedMessages.has(rawMessage)) {
            console.log("Skipping duplicate message.");
            return;
          }

          storedMessages.add(rawMessage);

          if (isSpam) {
            spamCount++;
          } else {
            hamCount++;
          }

          addMessageToFirestore(
            senderNumber,
            groupId,
            message.messageTimestamp,
            rawMessage,
            preprocessedMessage,
            prediction,
            confidence
          );
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  });
};

connectToWhatsApp();
