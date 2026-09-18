import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Profile, Message } from '../types';
import { INITIAL_PROFILES } from '../data/profiles';

const PROFILES_COLLECTION = 'profiles';
const CONVERSATIONS_COLLECTION = 'conversations';

// Initialize profiles in Firestore if collection is empty
export async function seedProfilesIfEmpty(): Promise<Profile[]> {
  try {
    const colRef = collection(db, PROFILES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const batch = writeBatch(db);
      for (const p of INITIAL_PROFILES) {
        const ref = doc(db, PROFILES_COLLECTION, p.id);
        batch.set(ref, p);
      }
      await batch.commit();
      return INITIAL_PROFILES;
    } else {
      return snap.docs.map((d) => d.data() as Profile);
    }
  } catch (error) {
    console.warn('Could not seed profiles to Firestore, using local fallback:', error);
    return INITIAL_PROFILES;
  }
}

// Fetch all profiles
export async function fetchProfiles(): Promise<Profile[]> {
  try {
    const colRef = collection(db, PROFILES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return await seedProfilesIfEmpty();
    }
    return snap.docs.map((d) => d.data() as Profile);
  } catch (error) {
    console.warn('Error fetching profiles from Firestore:', error);
    return INITIAL_PROFILES;
  }
}

// Save sympathy / match in user's subcollection
export async function saveSympathyToFirestore(
  userId: string,
  targetProfile: Profile,
  reaction: string,
  messageText?: string
) {
  try {
    const matchRef = doc(db, 'users', userId, 'matches', targetProfile.id);
    await setDoc(matchRef, {
      userId,
      targetProfileId: targetProfile.id,
      targetProfileName: targetProfile.name,
      targetProfileAvatar: targetProfile.avatarUrl,
      reaction,
      messageText: messageText || '',
      createdAt: new Date().toISOString(),
      isMutual: true
    }, { merge: true });
  } catch (error) {
    console.warn('Error saving sympathy to Firestore:', error);
  }
}

// Subscribe to real-time chat messages
export function subscribeToMessages(
  convId: string,
  onUpdate: (messages: Message[]) => void
) {
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, convId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp,
          createdAt: data.createdAt,
          isVoice: data.isVoice,
          voiceDuration: data.voiceDuration,
          isDateProposal: data.isDateProposal,
          dateVenue: data.dateVenue
        } as Message;
      });
      onUpdate(msgs);
    }, (err) => {
      console.warn('Error in messages snapshot listener:', err);
    });
  } catch (error) {
    console.warn('Error subscribing to messages:', error);
    return () => {};
  }
}

// Send a message to Firestore
export async function sendMessageToFirestore(
  convId: string,
  message: Omit<Message, 'id'>
) {
  try {
    const participants = convId.split('_');
    const convRef = doc(db, CONVERSATIONS_COLLECTION, convId);
    await setDoc(
      convRef,
      {
        id: convId,
        participants,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, convId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.warn('Error saving message to Firestore:', error);
  }
}
