import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { blacklistUser } from './userService.js';

const confidenceThreshold = 0.6; // Messages with confidence below this value will not trigger blacklisting.
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
  confidence,
) {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      sender_number: senderNumber,
      group: groupId,
      timestamp: timestamp,
      raw_message: rawMessage,
      preprocessed_message: preprocessedMessage,
      prediction: prediction,
      confidence: confidence,
    });
    console.log('Document written in messages with ID:', docRef.id);
  } catch (e) {
    console.error('Error adding document to messages:', e);
  }
}

/**
 * Sends a message to the spam detection API and processes the response.
 */
export async function analyzeMessage(
  sock,
  senderNumber,
  groupJid,
  rawMessage,
  preprocessedMessage,
  timestamp,
  messageKey,
) {
  console.log(
    `Processing message from ${senderNumber}: ${preprocessedMessage}`,
  );

  try {
    const response = await fetch(process.env.API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: preprocessedMessage,
        sender_number: senderNumber,
      }),
    });

    if (!response) return;
    const data = await response.json();
    const prediction = data.prediction;
    const isSpam = prediction === 'Spam';
    const confidence = isSpam ? data.confidence : 1 - data.confidence;
    const highConfidence = confidence >= confidenceThreshold;

    if (isSpam) {
      spamCount++;
      if (highConfidence) {
        blacklistUser(senderNumber, 'AUTO', groupJid, timestamp);
      }
      await sendReaction(
        sock,
        groupJid,
        messageKey,
        highConfidence ? '‼️' : '⚠️',
      );
    } else {
      if (hamCount >= spamCount) {
        console.log('Skipping ham message.');
        return;
      }
      hamCount++;
    }

    addMessageToFirestore(
      senderNumber,
      groupJid,
      timestamp,
      rawMessage,
      preprocessedMessage,
      prediction,
      confidence,
    );
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Reacts to a message.
 */
export async function sendReaction(sock, groupJid, messageKey, reaction) {
  try {
    console.log('Sending reaction with key:', messageKey);
    await sock.sendMessage(groupJid, {
      react: {
        text: reaction,
        key: messageKey,
      },
    });

    console.log(
      `Reaction '${reaction}' successfully sent to message ${messageKey.id}`,
    );
  } catch (error) {
    console.error('Failed to add reaction:', error);
  }
}
