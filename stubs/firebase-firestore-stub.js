const mockDoc = (id = 'mock') => ({
  get: () => Promise.resolve({ exists: false, data: () => null, id }),
  set: () => Promise.resolve(),
  update: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  onSnapshot: (cb) => { try { cb({ exists: false, data: () => null, id }); } catch(e) {} return () => {}; },
  collection: (name) => mockCollection(name),
});
const mockCollection = (name) => ({
  doc: (id) => mockDoc(id),
  add: () => Promise.resolve({ id: 'mock' }),
  get: () => Promise.resolve({ docs: [], empty: true, forEach: () => {}, size: 0 }),
  where: () => mockCollection(name),
  orderBy: () => mockCollection(name),
  limit: () => mockCollection(name),
  onSnapshot: (cb) => { try { cb({ docs: [], empty: true, forEach: () => {}, size: 0 }); } catch(e) {} return () => {}; },
});
const firestoreInstance = { collection: mockCollection };
const firestore = () => firestoreInstance;
firestore.FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  increment: (n) => n,
  arrayUnion: (...args) => args,
  arrayRemove: (...args) => args,
};
firestore.Timestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Date.now() / 1000 }),
  fromDate: (d) => ({ toDate: () => d, seconds: d.getTime() / 1000 }),
};
module.exports = firestore;
module.exports.default = firestore;
