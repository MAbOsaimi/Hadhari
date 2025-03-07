import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';

export async function blacklistUser(userNumber, moderator, groupId, timestamp) {
  try {
    await setDoc(doc(db, 'blacklist', userNumber), {
      moderator: moderator,
      group: groupId,
      timestamp: timestamp,
    });
    console.log('User blacklisted:', userNumber);
  } catch (e) {
    console.error('Error blacklisting user:', e);
  }
}

export async function whitelistUser(userNumber, moderator, groupId, timestamp) {
  try {
    await setDoc(doc(db, 'whitelist', userNumber), {
      moderator: moderator,
      group: groupId,
      timestamp: timestamp,
    });
    console.log('User whitelisted:', userNumber);
  } catch (e) {
    console.error('Error whitelisting user:', e);
  }
}

export async function unblacklistUser(userNumber) {
  try {
    await deleteDoc(doc(db, 'blacklist', userNumber));
    console.log('User unblacklisted:', userNumber);
  } catch (e) {
    console.error('Error unblacklisting user:', e);
  }
}

export async function unwhitelistUser(userNumber) {
  try {
    await deleteDoc(doc(db, 'whitelist', userNumber));
    console.log('User unwhitelisted:', userNumber);
  } catch (e) {
    console.error('Error unwhitelisting user:', e);
  }
}
