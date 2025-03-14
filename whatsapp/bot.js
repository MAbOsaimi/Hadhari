import {
  DisconnectReason,
  makeWASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { handleIncomingMessage } from './messageHandler.js';
import logger from '../utils/logger.js';

export const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: logger,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode || 'Unknown';
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      logger.warn(
        { reason, shouldReconnect },
        'Connection closed. Attempting reconnect...',
      );

      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === 'open') {
      logger.info('WhatsApp Web Connected!');
    }
  });

  sock.ev.on('messages.upsert', async (event) => {
    for (const message of event.messages) {
      try {
        await handleIncomingMessage(sock, message);
      } catch (error) {
        logger.error({ error, message }, 'Error handling incoming message');
      }
    }
  });
};
