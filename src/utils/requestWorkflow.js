const STORAGE_KEY = "realestateplatform-workflow-requests";
const FILE_DB_NAME = "realestateplatform-request-files";
const FILE_STORE = "files";

export function getWorkflowRequests() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveWorkflowRequest(request) {
  const requests = getWorkflowRequests();
  const index = requests.findIndex((item) => item.id === request.id);
  if (index < 0) requests.unshift(request);
  else requests[index] = request;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return request;
}

export function updateWorkflowRequest(id, changes) {
  const requests = getWorkflowRequests();
  const index = requests.findIndex((item) => item.id === id);
  if (index < 0) return null;
  requests[index] = { ...requests[index], ...changes, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  return requests[index];
}

export function fileMetadata(file, title) {
  return file ? { id: `${title}-${file.name}`, icon: "file", tone: "blue", title, meta: file.name } : null;
}

function openFilesDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB is unavailable"));
    const request = window.indexedDB.open(FILE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWorkflowFiles(requestId, files) {
  if (!files.length) return;
  const db = await openFilesDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, "readwrite");
    const store = transaction.objectStore(FILE_STORE);
    files.forEach(({ key, file }) => store.put({ id: `${requestId}:${key}`, requestId, key, name: file.name, type: file.type, blob: file }));
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  db.close();
}

export async function getWorkflowFiles(requestId) {
  const db = await openFilesDb();
  const files = await new Promise((resolve, reject) => {
    const transaction = db.transaction(FILE_STORE, "readonly");
    const request = transaction.objectStore(FILE_STORE).getAll();
    request.onsuccess = () => resolve(request.result.filter((file) => file.requestId === requestId));
    request.onerror = () => reject(request.error);
  });
  db.close();
  return files;
}
