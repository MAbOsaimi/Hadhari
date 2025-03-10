import { analyzeMessage } from '../services/messageService.js';
import {
  extractTextFromImage,
  preprocessMessage,
} from '../utils/preprocessing.js';

const MIN_MESSAGE_LENGTH = 5; 

function getRawMessage(message) {
  const rawText =
    message.message.conversation ||
    message.message.extendedTextMessage?.text ||
    message.message.contactMessage?.displayName ||
    message.message.imageMessage?.caption ||
    '';

  return rawText;
}

export async function handleIncomingMessage(sock, message) {
  if (
    !message.message ||
    message.message.protocolMessage ||
    message.key.fromMe
  ) {
    return; // Skip irrelevant messages
  }

  const senderJid = message.key.participant || message.key.remoteJid;
  const groupJid = message.key.remoteJid;
  const messageKey = message.key;
  const senderNumber = senderJid.split('@')[0];

  const rawMessage = await getRawMessage(message);
  if (rawMessage.length <= MIN_MESSAGE_LENGTH) {
    return;
  }

  const timestamp = new Date(message.messageTimestamp * 1000);

  // Extract OCR text if the message contains an image
  const parsedText = await extractTextFromImage(message);

  const groupName =
    message.message.extendedTextMessage?.title === 'WhatsApp Group Invite'
      ? message.message.extendedTextMessage.title
      : '';

  const messageForProcessing =
    `${groupName}\n${parsedText}\n${rawMessage}`.trim();

  const preprocessedMessage = preprocessMessage(messageForProcessing);

  analyzeMessage(
    sock,
    senderNumber,
    groupJid,
    rawMessage,
    preprocessedMessage,
    timestamp,
    messageKey,
  );
}
