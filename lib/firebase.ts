import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export { firestore };

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
  return firestore()
    .collection('members')
    .orderBy('created_at', 'desc')
    .onSnapshot(
      (snapshot) => {
        console.log('[Firebase] Members snapshot received, count:', snapshot.docs.length);
        const members: MemberDoc[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<MemberDoc, 'id'>),
        }));
        onUpdate(members);
      },
      (error) => {
        console.error('[Firebase] Members snapshot error:', error.code, error.message);
        if (onError) onError(error);
      }
    );
}

/**
 * Sync a member record to Firestore (upsert by member id).
 */
export async function syncMemberToFirestore(member: MemberDoc): Promise<void> {
  console.log('[Firebase] Syncing member to Firestore:', member.id);
  await firestore()
    .collection('members')
    .doc(member.id)
    .set({ ...member, updated_at: new Date().toISOString() }, { merge: true });
  console.log('[Firebase] Member synced successfully:', member.id);
}
