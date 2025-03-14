import {
  downloadMediaMessage,
  extensionForMediaMessage,
} from '@whiskeysockets/baileys';
import logger from './logger.js';

export function removeDiacritics(text) {
  return text.replace(/[\u064B-\u065F]/g, '');
}

export function convertArabicNumbers(text) {
  const arabicNumbers = '٠١٢٣٤٥٦٧٨٩';
  const standardNumbers = '0123456789';
  return text.replace(
    /[٠-٩]/g,
    (d) => standardNumbers[arabicNumbers.indexOf(d)],
  );
}

export function preprocessMessage(message) {
  message = message.normalize('NFKC');
  message = message.replace(/ـ+/g, '');
  message = message.replace(/(\S)\1{2,}/g, '$1$1');
  message = message.replace(/(?<!\d)\.(?!\d)/g, '');
  message = message.replace(/\s+/g, ' ').trim();

  message = removeDiacritics(message);
  message = convertArabicNumbers(message);
  return message;
}

export async function extractTextFromImage(message) {
  if (!message.message.imageMessage) return '';

  try {
    const buffer = await downloadMediaMessage(message, 'buffer');
    const imageExtension = extensionForMediaMessage(message.message);
    const base64Image = buffer.toString('base64');
    const apiKey = process.env.OCR_API_KEY;
    const form = new FormData();

    const contentType = `image/${imageExtension}`;
    form.append('language', 'ara');
    form.append('filetype', contentType);
    form.append('base64Image', `data:${contentType};base64,${base64Image}`);
    form.append('isOverlayRequired', 'false');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: apiKey },
      body: form,
    });

    const data = await response.json();
    const extractedText = data?.ParsedResults?.[0]?.ParsedText?.trim() || '';

    if (!extractedText) {
      logger.warn({ imageExtension }, 'OCR returned empty text.');
    } else {
      logger.debug({ extractedText }, 'OCR extracted text.');
    }

    return extractedText;
  } catch (error) {
    logger.error({ error }, 'Error parsing image via OCR API');
    return '';
  }
}
