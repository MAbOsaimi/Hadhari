import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import logger from '../utils/logger.js';

export async function blacklistUser(userNumber, moderator, groupId, timestamp) {
  try {
    await setDoc(doc(db, 'blacklist', userNumber), {
      moderator: moderator,
      group: groupId,
      timestamp: timestamp,
    });
    logger.debug('User blacklisted:', userNumber);
  } catch (error) {
    logger.error({ error }, 'Error blacklisting user');
  }
}

export async function whitelistUser(userNumber, moderator, groupId, timestamp) {
  try {
    await setDoc(doc(db, 'whitelist', userNumber), {
      moderator: moderator,
      group: groupId,
      timestamp: timestamp,
    });
    logger.debug('User whitelisted:', userNumber);
  } catch (error) {
    logger.error({ error }, 'Error whitelisting user');
  }
}

export async function unblacklistUser(userNumber) {
  try {
    await deleteDoc(doc(db, 'blacklist', userNumber));
    logger.debug('User unblacklisted:', userNumber);
  } catch (error) {
    logger.error({ error }, 'Error unblacklisting user');
  }
}

export async function unwhitelistUser(userNumber) {
  try {
    await deleteDoc(doc(db, 'whitelist', userNumber));
    logger.debug('User unwhitelisted:', userNumber);
  } catch (error) {
    logger.error({ error }, 'Error unwhitelisting user');
  }
}
