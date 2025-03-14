import logger from './utils/logger.js';
import { connectToWhatsApp } from './whatsapp/bot.js';

logger.info('Starting Hadhari...');
connectToWhatsApp();
