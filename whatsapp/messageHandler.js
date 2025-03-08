import { analyzeMessage } from '../services/messageService.js';
import { preprocessMessage } from '../utils/preprocessing.js';

const getRawMessage = (message) => {
  const rawText =
    message.message.conversation || // Standard text messages
    message.message.extendedTextMessage?.text || // Extended text messages (e.g., forwarded messages)
    message.message.contactMessage?.displayName || // Contact name when a contact is shared
    message.message.imageMessage?.caption || // Caption from an image message
    '';

  const groupName =
    message.message.extendedTextMessage?.title &&
    message.message.extendedTextMessage.title !== 'WhatsApp Group Invite'
      ? message.message.extendedTextMessage.title
      : '';

  return groupName ? `${groupName}\n${rawText}`.trim() : rawText;
};

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

  const rawMessage = getRawMessage(message);

  if (!rawMessage) {
    return;
  }

  const timestamp = message.messageTimestamp || new Date().getTime();
  const preprocessedMessage = preprocessMessage(rawMessage);

  if (preprocessedMessage.length === 0) {
    return; // Skip messages with no text (e.g., media)
  }

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
