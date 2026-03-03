// IndexedDB Database for PWA Offline Support
// حفظ البيانات محلياً للعمل بدون إنترنت

const DB_NAME = 'jaramana-net-db';
const DB_VERSION = 1;

// أسماء المخازن
export const STORES = {
  SUBSCRIBERS: 'subscribers',
  TICKETS: 'tickets',
  DEBTS: 'debts',
  SETTINGS: 'settings',
  PENDING_SYNC: 'pendingSync', // للتغييرات المنتظرة المزامنة
} as const;

// فتح قاعدة البيانات
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // إنشاء مخزن المشتركين
      if (!db.objectStoreNames.contains(STORES.SUBSCRIBERS)) {
        const subscriberStore = db.createObjectStore(STORES.SUBSCRIBERS, { keyPath: 'id' });
        subscriberStore.createIndex('name', 'name', { unique: false });
        subscriberStore.createIndex('phone', 'phone', { unique: false });
        subscriberStore.createIndex('paymentStatus', 'paymentStatus', { unique: false });
      }

      // إنشاء مخزن الشكاوى
      if (!db.objectStoreNames.contains(STORES.TICKETS)) {
        const ticketStore = db.createObjectStore(STORES.TICKETS, { keyPath: 'id' });
        ticketStore.createIndex('status', 'status', { unique: false });
      }

      // إنشاء مخزن الديون
      if (!db.objectStoreNames.contains(STORES.DEBTS)) {
        db.createObjectStore(STORES.DEBTS, { keyPath: 'id' });
      }

      // إنشاء مخزن الإعدادات
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
      }

      // إنشاء مخزن التغييرات المنتظرة
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('type', 'type', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      console.log('IndexedDB upgraded successfully');
    };
  });
}

// حفظ البيانات في مخزن معين
export async function saveToStore<T>(storeName: string, data: T | T[]): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const items = Array.isArray(data) ? data : [data];
    
    items.forEach(item => {
      store.put(item);
    });

    transaction.oncomplete = () => {
      console.log(`Saved ${items.length} items to ${storeName}`);
      resolve();
    };

    transaction.onerror = () => {
      console.error(`Failed to save to ${storeName}`);
      reject(transaction.error);
    };
  });
}

//获取 جميع البيانات من مخزن معين
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// حذف عنصر من مخزن معين
export async function deleteFromStore(storeName: string, id: number): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.delete(id);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// مسح جميع البيانات من مخزن معين
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();

    transaction.oncomplete = () => {
      console.log(`Cleared ${storeName}`);
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// إضافة عملية للمزامنة لاحقاً
export async function addToPendingSync(operation: {
  type: 'subscriber' | 'ticket' | 'debt' | 'setting';
  action: 'create' | 'update' | 'delete';
  data: any;
}): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_SYNC, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_SYNC);
    
    store.add({
      ...operation,
      timestamp: new Date().toISOString(),
    });

    transaction.oncomplete = () => {
      console.log('Added operation to pending sync');
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

// الحصول على العمليات المنتظرة للمزامنة
export async function getPendingSyncOperations(): Promise<any[]> {
  return getAllFromStore(STORES.PENDING_SYNC);
}

// حذف عملية من قائمة الانتظار بعد المزامنة
export async function removePendingSyncOperation(id: number): Promise<void> {
  return deleteFromStore(STORES.PENDING_SYNC, id);
}

// فحص حالة الاتصال
export function isOnline(): boolean {
  return navigator.onLine;
}

// استماع لتغيرات الاتصال
export function onConnectionChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // إرجاع دالة لإلغاء الاستماع
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

console.log('IndexedDB module loaded - PWA Offline Support');
