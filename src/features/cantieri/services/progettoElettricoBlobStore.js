/**
 * Store binario per Progetto elettrico (IndexedDB).
 * NON usa LocalStorage / Preferences — solo blob + chiave.
 *
 * Chiave: `${cantiereId}::${blobId}`
 */

const DB_NAME = "preventivai-progetto-elettrico";
const DB_VERSION = 1;
const STORE = "blobs";

/** Fallback in-memory (test / ambienti senza IndexedDB). */
const memoria = new Map();

function chiaveBlob(cantiereId, blobId) {
  return `${String(cantiereId)}::${String(blobId)}`;
}

function apriDb() {
  if (typeof indexedDB === "undefined" || !indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    let richiesta;
    try {
      richiesta = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (errore) {
      reject(errore);
      return;
    }
    richiesta.onupgradeneeded = () => {
      const db = richiesta.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    richiesta.onsuccess = () => resolve(richiesta.result);
    richiesta.onerror = () =>
      reject(richiesta.error || new Error("indexeddb_open_failed"));
  });
}

/**
 * @param {string|number} cantiereId
 * @param {string} blobId
 * @param {Blob} blob
 */
export async function salvaBlobProgetto(cantiereId, blobId, blob) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error("blob_non_valido");
  }
  const key = chiaveBlob(cantiereId, blobId);

  const db = await apriDb().catch(() => null);
  if (!db) {
    memoria.set(key, blob);
    return { ok: true, backend: "memory" };
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => {
      db.close();
      resolve({ ok: true, backend: "indexeddb" });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("indexeddb_write_failed"));
    };
  });
}

/**
 * @param {string|number} cantiereId
 * @param {string} blobId
 * @returns {Promise<Blob|null>}
 */
export async function leggiBlobProgetto(cantiereId, blobId) {
  const key = chiaveBlob(cantiereId, blobId);

  const db = await apriDb().catch(() => null);
  if (!db) {
    return memoria.get(key) || null;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result instanceof Blob ? req.result : null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error("indexeddb_read_failed"));
    };
  });
}

/**
 * @param {string|number} cantiereId
 * @param {string} blobId
 */
export async function eliminaBlobProgetto(cantiereId, blobId) {
  if (blobId == null || blobId === "") return { ok: true };
  const key = chiaveBlob(cantiereId, blobId);

  memoria.delete(key);

  const db = await apriDb().catch(() => null);
  if (!db) {
    return { ok: true, backend: "memory" };
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve({ ok: true, backend: "indexeddb" });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("indexeddb_delete_failed"));
    };
  });
}

/**
 * Elimina tutti i blob di un cantiere (hard delete).
 * @param {string|number} cantiereId
 */
export async function eliminaBlobProgettoPerCantiere(cantiereId) {
  const prefisso = `${String(cantiereId)}::`;

  for (const key of [...memoria.keys()]) {
    if (key.startsWith(prefisso)) memoria.delete(key);
  }

  const db = await apriDb().catch(() => null);
  if (!db) return { ok: true, backend: "memory" };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if (String(cursor.key).startsWith(prefisso)) {
        cursor.delete();
      }
      cursor.continue();
    };
    tx.oncomplete = () => {
      db.close();
      resolve({ ok: true, backend: "indexeddb" });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("indexeddb_clear_failed"));
    };
  });
}

/** Solo test: svuota fallback memoria. */
export function _resetMemoriaProgettoElettricoPerTest() {
  memoria.clear();
}
