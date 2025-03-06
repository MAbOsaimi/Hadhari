import { analyzeMessage } from "../services/messageService.js";
import { preprocessMessage } from "../utils/preprocessing.js";

export async function handleIncomingMessage(sock, message) {
  if (
    !message.message ||
    message.message.protocolMessage ||
    message.key.fromMe
  ) {
    return; // Skip irrelevant messages
  }

  const senderJid = message.key.participant || message.key.remoteJid;
  const groupId = message.key.remoteJid.split("@")[0];
  const senderNumber = senderJid.split("@")[0];

  const rawMessage =
    message.message.conversation ||
    message.message.extendedTextMessage?.text ||
    message.message.contactMessage?.displayName ||
    "";

  if (!rawMessage) {
    return;
  }

  const timestamp = message.messageTimestamp;
  const preprocessedMessage = preprocessMessage(rawMessage);

  if (preprocessedMessage.length === 0) {
    return; // Skip messages with no text (e.g., media)
  }

  analyzeMessage(
    senderNumber,
    groupId,
    rawMessage,
    preprocessedMessage,
    timestamp
  );
}
