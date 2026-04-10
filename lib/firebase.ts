let db: any;
let firebase: any;

try {
  const firebaseApp = require('@react-native-firebase/app').default;
  const firestore = require('@react-native-firebase/firestore').default;
  firebase = firebaseApp;
  db = firestore();
} catch (e) {
  console.warn('[Firebase] Native module not available (Expo Go) — using mock');

  const mockDoc = (): any => ({
    get: () => Promise.resolve({ exists: false, data: () => null, id: 'mock' }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    onSnapshot: (cb: any) => {
      cb({ exists: false, data: () => null });
      return () => {};
    },
    collection: (name: string) => mockCollection(name),
  });

  const mockCollection = (name: string): any => ({
    doc: (_id?: string) => mockDoc(),
    add: () => Promise.resolve({ id: 'mock' }),
    get: () => Promise.resolve({ docs: [], empty: true, forEach: () => {} }),
    where: () => mockCollection(name),
    orderBy: () => mockCollection(name),
    limit: () => mockCollection(name),
    onSnapshot: (cb: any) => {
      cb({ docs: [], empty: true, forEach: () => {} });
      return () => {};
    },
  });

  db = { collection: mockCollection };
  firebase = { apps: [] };
}

export { db, firebase };
export default firebase;

export type ArmMessageDoc = {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Subscribe to real-time ARM messages from Firestore.
 * Returns an unsubscribe function.
 */
export function subscribeToArmMessages(
  onUpdate: (messages: ArmMessageDoc[]) => void,
  onError?: (error: Error) => void
) {
  console.log('[Firebase] Subscribing to arm_messages collection');
  return db
    .collection('arm_messages')
    .orderBy('created_at', 'desc')
    .onSnapshot(
      (snapshot: any) => {
        console.log('[Firebase] arm_messages snapshot received, count:', snapshot.docs.length);
        const messages: ArmMessageDoc[] = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<ArmMessageDoc, 'id'>),
        }));
        onUpdate(messages);
      },
      (error: Error) => {
        console.error('[Firebase] arm_messages snapshot error:', error.message);
        if (onError) onError(error);
      }
    );
}

export type MemberDoc = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  region?: string;
  gender?: string;
  status: string;
  membership_number?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Subscribe to real-time member updates from Firestore.
 * Returns an unsubscribe function.
 */
export function subscribeTomembers(
  onUpdate: (members: MemberDoc[]) => void,
  onError?: (error: Error) => void
) {
  console.log('[Firebase] Subscribing to members collection');
  return db
    .collection('members')
    .orderBy('created_at', 'desc')
    .onSnapshot(
      (snapshot: any) => {
        console.log('[Firebase] Members snapshot received, count:', snapshot.docs.length);
        const members: MemberDoc[] = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...(doc.data() as Omit<MemberDoc, 'id'>),
        }));
        onUpdate(members);
      },
      (error: Error) => {
        console.error('[Firebase] Members snapshot error:', error.message);
        if (onError) onError(error);
      }
    );
}

/**
 * Sync a member record to Firestore (upsert by member id).
 */
export async function syncMemberToFirestore(member: MemberDoc): Promise<void> {
  console.log('[Firebase] Syncing member to Firestore:', member.id);
  await db
    .collection('members')
    .doc(member.id)
    .set({ ...member, updated_at: new Date().toISOString() }, { merge: true });
  console.log('[Firebase] Member synced successfully:', member.id);
}
