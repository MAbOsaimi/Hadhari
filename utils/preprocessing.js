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
