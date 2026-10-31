// ─── Local Storage Keys ─────────────────────────────────────────────────────
const USERS_KEY = "realestateplatform-users";
const UNITS_KEY = "realestateplatform-units";
const MORTGAGE_REQUESTS_KEY = "realestateplatform-mortgage-requests";
const CLIENTS_KEY = "realestateplatform-clients";

// ─── Users Management ───────────────────────────────────────────────────────
export function getUsers() {
  if (typeof window === "undefined") return [];
  try {
    const data = window.localStorage.getItem(USERS_KEY);
    const users = data ? JSON.parse(data) : [];
    return Array.isArray(users) ? users.filter((user) => user && typeof user === "object") : [];
  } catch {
    return [];
  }
}

const normalizeUsername = (username) => String(username || "").trim().toLocaleLowerCase();

export function saveUser(user) {
  const users = getUsers();
  const existingIndex = users.findIndex((u) => normalizeUsername(u.username) === normalizeUsername(user.username));
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
}

export function updateUser(user, originalUsername) {
  const users = getUsers();
  const existingIndex = users.findIndex((savedUser) =>
    user.id
      ? savedUser.id === user.id
      : normalizeUsername(savedUser.username) === normalizeUsername(originalUsername)
  );

  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
}

export function findUserByUsername(username) {
  const users = getUsers();
  const normalizedUsername = normalizeUsername(username);
  return users.find((u) => normalizeUsername(u.username) === normalizedUsername);
}

export function findUserByEmail(email) {
  const users = getUsers();
  return users.find((u) => u.email === email);
}

export function authenticateUser(username, password) {
  const user = findUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

// ─── Units Management ────────────────────────────────────────────────────────
export function getUnits() {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(UNITS_KEY);
  if (data) return JSON.parse(data);
  
  // Initialize with default data if empty
  const defaultUnits = [
    {
      id: '1',
      name: 'شقة 3 غرف — كمبوند النيل',
      type: 'شقة',
      area: 'القاهرة الجديدة',
      compound: 'كمبوند النيل',
      price: 2400000,
      size: 180,
      rooms: '3 غرف',
      status: 'متاح',
      lat: 30.044276,
      lng: 31.935553,
      createdAt: new Date('2024-04-01').toISOString(),
    },
    {
      id: '2',
      name: 'شقة غرفتين - المعادي',
      type: 'شقة',
      area: 'المعادي',
      compound: '',
      price: 1800000,
      size: 110,
      rooms: '2',
      status: 'معلق',
      lat: 29.97,
      lng: 30.93,
      createdAt: new Date('2024-03-15').toISOString(),
    },
    {
      id: '3',
      name: 'شقة 4 غرف — الهرم',
      type: 'شقة',
      area: ' الهرم',
      compound: 'الهرم',
      price: 1450000,
      size: 170,
      rooms: '4 غرفة',
      status: 'مباع',
      lat: 30.144276,
      lng: 31.539553,
      createdAt: new Date('2024-03-01').toISOString(),
    },
    {
      id: '4',
      name: 'شقة 3 غرف  — الشيخ زايد',
      type: 'شقة',
      area: 'الشيخ زايد',
      compound: '',
      price: 2200000,
      size: 180,
      rooms: '3 غرف',
      status: 'متاح',
      lat: 30.044276,
      lng: 30.935553,
      createdAt: new Date('2024-02-20').toISOString(),
    },
  ];
  localStorage.setItem(UNITS_KEY, JSON.stringify(defaultUnits));
  return defaultUnits;
}

export function saveUnit(unit) {
  const units = getUnits();
  const existingIndex = units.findIndex((u) => u.id === unit.id);
  
  if (existingIndex >= 0) {
    units[existingIndex] = unit;
  } else {
    units.push(unit);
  }
  
  localStorage.setItem(UNITS_KEY, JSON.stringify(units));
  return unit;
}

export function deleteUnit(id) {
  const units = getUnits();
  const filtered = units.filter((u) => u.id !== id);
  localStorage.setItem(UNITS_KEY, JSON.stringify(filtered));
}

// ─── Mortgage Requests Management ────────────────────────────────────────────
export function getMortgageRequests() {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(MORTGAGE_REQUESTS_KEY);
  if (data) return JSON.parse(data);
  
  // Initialize with default data if empty
  const defaultRequests = [
    { id: '1', refNumber: 'TF-2024-089', clientName: 'محمد علي حسن', amount: 1200000, status: 'موافق عليه', createdAt: new Date().toISOString() },
    { id: '2', refNumber: 'TF-2024-090', clientName: 'سارة أحمد محمود', amount: 850000, status: 'قيد المراجعة', createdAt: new Date().toISOString() },
    { id: '3', refNumber: 'TF-2024-091', clientName: 'خالد إبراهيم عمر', amount: 3500000, status: 'قيد المراجعة', createdAt: new Date().toISOString() },
    { id: '4', refNumber: 'TF-2024-092', clientName: 'نور الدين فاروق', amount: 2100000, status: 'مرفوض', createdAt: new Date().toISOString() },
  ];
  localStorage.setItem(MORTGAGE_REQUESTS_KEY, JSON.stringify(defaultRequests));
  return defaultRequests;
}

export function saveMortgageRequest(request) {
  const requests = getMortgageRequests();
  const existingIndex = requests.findIndex((r) => r.id === request.id);
  
  if (existingIndex >= 0) {
    requests[existingIndex] = request;
  } else {
    requests.push(request);
  }
  
  localStorage.setItem(MORTGAGE_REQUESTS_KEY, JSON.stringify(requests));
  return request;
}

export function deleteMortgageRequest(id) {
  const requests = getMortgageRequests();
  const filtered = requests.filter((r) => r.id !== id);
  localStorage.setItem(MORTGAGE_REQUESTS_KEY, JSON.stringify(filtered));
}

// ─── Clients Management ─────────────────────────────────────────────────────
export function getClients() {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(CLIENTS_KEY);
  if (data) return JSON.parse(data);
  
  // Initialize with default data if empty
  const defaultClients = [
    { id: '1', name: 'معتز حمدي', interest: 'مهتم بشقة 3 غرف · القاهرة الجديدة', status: 'عميل نشط', createdAt: new Date().toISOString() },
    { id: '2', name: 'هبة منصور', interest: 'مهتمة بشقة 4 غرف · 6 أكتوبر', status: 'في المفاوضات', createdAt: new Date().toISOString() },
    { id: '3', name: 'عمرو طارق', interest: 'أتم شراء شقة 2 غرف · المعادي', status: 'مكتمل', createdAt: new Date().toISOString() },
  ];
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(defaultClients));
  return defaultClients;
}

export function saveClient(client) {
  const clients = getClients();
  const existingIndex = clients.findIndex((c) => c.id === client.id);
  
  if (existingIndex >= 0) {
    clients[existingIndex] = client;
  } else {
    clients.push(client);
  }
  
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  return client;
}

export function deleteClient(id) {
  const clients = getClients();
  const filtered = clients.filter((c) => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
}

// ─── Clear All Data (for testing) ────────────────────────────────────────────
export function clearAllData() {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(UNITS_KEY);
  localStorage.removeItem(MORTGAGE_REQUESTS_KEY);
  localStorage.removeItem(CLIENTS_KEY);
}
