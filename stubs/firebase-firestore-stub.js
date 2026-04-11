const mockDoc = (id = 'mock') => ({
  id,
  get: () => Promise.resolve({ exists: false, data: () => null, id }),
  set: () => Promise.resolve(),
  update: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  onSnapshot: (cb) => { try { cb({ exists: false, data: () => null, id }); } catch(e){} return () => {}; },
  collection: (n) => mockCollection(n),
});
const mockCollection = (name) => ({
  id: name,
  doc: (id) => mockDoc(id),
  add: () => Promise.resolve({ id: 'mock' }),
  get: () => Promise.resolve({ docs: [], empty: true, forEach: () => {}, size: 0 }),
  where: () => mockCollection(name),
  orderBy: () => mockCollection(name),
  limit: () => mockCollection(name),
  startAfter: () => mockCollection(name),
  endBefore: () => mockCollection(name),
  onSnapshot: (cb) => { try { cb({ docs: [], empty: true, forEach: () => {}, size: 0 }); } catch(e){} return () => {}; },
});
const mockDb = { collection: mockCollection, doc: mockDoc, batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: () => Promise.resolve() }) };
const firestore = () => mockDb;
firestore.FieldValue = { serverTimestamp: () => new Date().toISOString(), increment: (n) => n, arrayUnion: (...a) => a, arrayRemove: (...a) => a, delete: () => null };
firestore.Timestamp = { now: () => ({ toDate: () => new Date(), seconds: Date.now()/1000, nanoseconds: 0 }), fromDate: (d) => ({ toDate: () => d, seconds: d.getTime()/1000, nanoseconds: 0 }), fromMillis: (ms) => ({ toDate: () => new Date(ms), seconds: ms/1000, nanoseconds: 0 }) };
firestore.Filter = { where: () => ({}) };
// Named exports for modular API
const getFirestore = () => mockDb;
const collection = (db, name) => mockCollection(name);
const doc = (db, ...args) => mockDoc(args[args.length - 1]);
const getDoc = () => Promise.resolve({ exists: () => false, data: () => null, id: 'mock' });
const getDocs = () => Promise.resolve({ docs: [], empty: true, forEach: () => {}, size: 0 });
const setDoc = () => Promise.resolve();
const addDoc = () => Promise.resolve({ id: 'mock' });
const updateDoc = () => Promise.resolve();
const deleteDoc = () => Promise.resolve();
const onSnapshot = (ref, cb) => { try { cb({ exists: false, data: () => null, docs: [], empty: true, forEach: () => {}, size: 0 }); } catch(e){} return () => {}; };
const query = (ref) => ref;
const where = () => ({});
const orderBy = () => ({});
const limit = () => ({});
const serverTimestamp = () => new Date().toISOString();
const Timestamp = firestore.Timestamp;
const FieldValue = firestore.FieldValue;
module.exports = firestore;
module.exports.default = firestore;
module.exports.getFirestore = getFirestore;
module.exports.collection = collection;
module.exports.doc = doc;
module.exports.getDoc = getDoc;
module.exports.getDocs = getDocs;
module.exports.setDoc = setDoc;
module.exports.addDoc = addDoc;
module.exports.updateDoc = updateDoc;
module.exports.deleteDoc = deleteDoc;
module.exports.onSnapshot = onSnapshot;
module.exports.query = query;
module.exports.where = where;
module.exports.orderBy = orderBy;
module.exports.limit = limit;
module.exports.serverTimestamp = serverTimestamp;
module.exports.Timestamp = Timestamp;
module.exports.FieldValue = FieldValue;
