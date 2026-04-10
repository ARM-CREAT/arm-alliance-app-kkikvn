// Firebase native modules are not available in Expo Go.
// All data is served from the Specular backend API instead.
// This file provides no-op stubs so existing imports don't break.

const mockDoc = (id = 'mock'): any => ({
  get: () => Promise.resolve({ exists: false, data: () => null, id }),
  set: () => Promise.resolve(),
  update: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  onSnapshot: (cb: any) => {
    try { cb({ exists: false, data: () => null, id }); } catch(e) {}
    return () => {};
  },
  collection: (name: string) => mockCollection(name),
});

const mockCollection = (name: string): any => ({
  doc: (id?: string) => mockDoc(id),
  add: () => Promise.resolve({ id: 'mock' }),
  get: () => Promise.resolve({ docs: [], empty: true, forEach: () => {}, size: 0 }),
  where: () => mockCollection(name),
  orderBy: () => mockCollection(name),
  limit: () => mockCollection(name),
  onSnapshot: (cb: any) => {
    try { cb({ docs: [], empty: true, forEach: () => {}, size: 0 }); } catch(e) {}
    return () => {};
  },
});

export const db: any = { collection: mockCollection };
export const firebase: any = { apps: [] };
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
 * Subscribe to ARM messages — stub for Expo Go.
 * Returns an unsubscribe function.
 */
export function subscribeToArmMessages(
  onUpdate: (messages: ArmMessageDoc[]) => void,
  _onError?: (error: Error) => void
) {
  console.log('[Firebase] subscribeToArmMessages: using stub (Expo Go)');
  onUpdate([]);
  return () => {};
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
 * Subscribe to member updates — stub for Expo Go.
 * Returns an unsubscribe function.
 */
export function subscribeTomembers(
  onUpdate: (members: MemberDoc[]) => void,
  _onError?: (error: Error) => void
) {
  console.log('[Firebase] subscribeTomembers: using stub (Expo Go)');
  onUpdate([]);
  return () => {};
}

/**
 * Sync a member record — stub for Expo Go.
 */
export async function syncMemberToFirestore(_member: MemberDoc): Promise<void> {
  console.log('[Firebase] syncMemberToFirestore: using stub (Expo Go)');
}
