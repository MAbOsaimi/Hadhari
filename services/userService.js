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
    logger.info({ userNumber, moderator, groupId }, 'User blacklisted');
  } catch (error) {
    logger.error({ error, userNumber }, 'Error blacklisting user');
  }
}

export async function whitelistUser(userNumber, moderator, groupId, timestamp) {
  try {
    await setDoc(doc(db, 'whitelist', userNumber), {
      moderator: moderator,
      group: groupId,
      timestamp: timestamp,
    });
    logger.info({ userNumber, moderator, groupId }, 'User whitelisted');
  } catch (error) {
    logger.error({ error, userNumber }, 'Error whitelisting user');
  }
}

export async function unblacklistUser(userNumber) {
  try {
    await deleteDoc(doc(db, 'blacklist', userNumber));
    logger.info({ userNumber }, 'User unblacklisted');
  } catch (error) {
    logger.error({ error, userNumber }, 'Error unblacklisting user');
  }
}

export async function unwhitelistUser(userNumber) {
  try {
    await deleteDoc(doc(db, 'whitelist', userNumber));
    logger.info({ userNumber }, 'User unwhitelisted');
  } catch (error) {
    logger.error({ error, userNumber }, 'Error unwhitelisting user');
  }
}
