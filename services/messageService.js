import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import { blacklistUser } from './userService.js';
import logger from '../utils/logger.js';

const CONFIDENCE_THRESHOLD = 0.6; // Messages with confidence below this value will not trigger blacklisting.
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
  validated,
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
      validated: validated,
    });

    logger.debug('Document added with ID:', docRef.id);
  } catch (error) {
    logger.error({ error }, 'Error adding message to Firestore');
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
  logger.debug(
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
    const highConfidence = confidence >= CONFIDENCE_THRESHOLD;

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
      false,
    );
  } catch (error) {
    logger.error({ error }, 'Error processing message');
  }
}

/**
 * Reacts to a message.
 */
export async function sendReaction(sock, groupJid, messageKey, reaction) {
  try {
    await sock.sendMessage(groupJid, {
      react: {
        text: reaction,
        key: messageKey,
      },
    });

    logger.debug(`Reacted with ${reaction} to message ${messageKey}`);
  } catch (error) {
    logger.error({ error }, 'Error sending reaction');
  }
}
