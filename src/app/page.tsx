'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// PWA Offline Support - IndexedDB Functions
const DB_NAME = 'jaramana-net-db';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('subscribers')) db.createObjectStore('subscribers', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('tickets')) db.createObjectStore('tickets', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('debts')) db.createObjectStore('debts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('mikrotikDevices')) db.createObjectStore('mikrotikDevices', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('pendingSync')) {
        const store = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function saveToStore(storeName: string, data: any | any[]) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const items = Array.isArray(data) ? data : [data];
    items.forEach(item => store.put(item));
    console.log(`[PWA] Saved ${items.length} items to ${storeName}`);
  } catch (e) {
    console.error('[PWA] Save error:', e);
  }
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[PWA] Load error:', e);
    return [];
  }
}

// PWA: إضافة عملية للمزامنة لاحقاً
async function addToPendingSync(operation: { type: 'subscriber' | 'ticket' | 'debt'; action: 'create' | 'update' | 'delete'; data: any }) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction('pendingSync', 'readwrite');
    const store = transaction.objectStore('pendingSync');
    store.add({ ...operation, timestamp: new Date().toISOString() });
    console.log('[PWA] Added to pending sync:', operation.action, operation.type);
  } catch (e) {
    console.error('[PWA] Failed to add to pending sync:', e);
  }
}

// PWA: الحصول على عدد العمليات المنتظرة
async function getPendingSyncCount(): Promise<number> {
  try {
    const items = await getAllFromStore<any>('pendingSync');
    return items.length;
  } catch {
    return 0;
  }
}

// PWA: مسح عملية من قائمة الانتظار
async function removePendingSyncItem(id: number) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction('pendingSync', 'readwrite');
    const store = transaction.objectStore('pendingSync');
    store.delete(id);
  } catch (e) {
    console.error('[PWA] Failed to remove pending sync item:', e);
  }
}

// Types
interface Subscriber {
  id: number;
  name: string;
  phone: string;
  address?: string;
  pppoeUser?: string;
  pppoePassword?: string;
  plan?: string;
  monthlyFee?: number;
  balance?: number;
  status?: string;
  paymentStatus?: string;
  lastRenewalDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt?: string;
}

interface Ticket {
  id: number;
  name: string;
  phone: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Debt {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  reason?: string;
  amount: number;
  createdAt?: string;
}

interface Settings {
  id?: number;
  adminPassword: string;
  adminPin: string;
  supportName1: string;
  supportPhone1: string;
  supportName2: string;
  supportPhone2: string;
}

// MikroTik Config
interface MikroTikConfig {
  id?: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  isDefault: boolean;
  isActive: boolean;
}

// Supabase Config
const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';

// Available Plans (1MB to 20MB)
const PLANS = [
  { value: '1 ميغا', label: '1 ميغا' },
  { value: '2 ميغا', label: '2 ميغا' },
  { value: '3 ميغا', label: '3 ميغا' },
  { value: '4 ميغا', label: '4 ميغا' },
  { value: '5 ميغا', label: '5 ميغا' },
  { value: '6 ميغا', label: '6 ميغا' },
  { value: '7 ميغا', label: '7 ميغا' },
  { value: '8 ميغا', label: '8 ميغا' },
  { value: '9 ميغا', label: '9 ميغا' },
  { value: '10 ميغا', label: '10 ميغا' },
  { value: '11 ميغا', label: '11 ميغا' },
  { value: '12 ميغا', label: '12 ميغا' },
  { value: '13 ميغا', label: '13 ميغا' },
  { value: '14 ميغا', label: '14 ميغا' },
  { value: '15 ميغا', label: '15 ميغا' },
  { value: '16 ميغا', label: '16 ميغا' },
  { value: '17 ميغا', label: '17 ميغا' },
  { value: '18 ميغا', label: '18 ميغا' },
  { value: '19 ميغا', label: '19 ميغا' },
  { value: '20 ميغا', label: '20 ميغا' },
];

// Payment Status Options
const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'دافع', color: 'bg-green-100 text-green-700' },
  { value: 'grace_1day', label: 'مهلة يوم واحد', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'expired', label: 'منتهي الصلاحية', color: 'bg-red-100 text-red-700' },
];

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    name: string;
    role: string;
    permissions: Record<string, boolean>;
  } | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [requirePin, setRequirePin] = useState(false);
  
  // PWA Offline State
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Customer search
  const [searchName, setSearchName] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  // Subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [searchSubscriber, setSearchSubscriber] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [showSubscriberForm, setShowSubscriberForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<number | null>(null);
  const [subscriberForm, setSubscriberForm] = useState<Partial<Subscriber>>({ 
    status: 'active', 
    balance: 0, 
    monthlyFee: 0,
    paymentStatus: 'paid'
  });
  const [selectedSubscriberDetails, setSelectedSubscriberDetails] = useState<Subscriber | null>(null);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketForm, setTicketForm] = useState({ name: '', phone: '', subject: '', description: '' });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Debts
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<number | null>(null);
  const [debtForm, setDebtForm] = useState<Partial<Debt>>({ amount: 0 });

  // Inventory
  const [inventory, setInventory] = useState<any>({ products: [], categories: [], transactions: [], stats: {} });
  const [inventoryCategory, setInventoryCategory] = useState<string>('all');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [inventoryForm, setInventoryForm] = useState<any>({ name: '', category: 'راوتر', quantity: 0, minStock: 5, price: 0 });
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Settings
  const [settings, setSettings] = useState<Settings>({
    adminPassword: '1998',
    adminPin: '1998',
    supportName1: 'Eng. Ramzi',
    supportPhone1: '963959128944',
    supportName2: 'Mr. Gassan',
    supportPhone2: '963998417870'
  });

  // Notifications
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', url: '' });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [targetSubscriber, setTargetSubscriber] = useState<string>('all'); // 'all' or phone number
  const [searchSubscribers, setSearchSubscribers] = useState('');

  // MikroTik
  const [mikrotikConfig, setMikrotikConfig] = useState<MikroTikConfig>({
    name: 'السيرفر الرئيسي',
    host: '',
    port: 8728,
    username: '',
    password: '',
    isDefault: true,
    isActive: true
  });
  const [mikrotikStatus, setMikrotikStatus] = useState<{ connected: boolean; message: string } | null>(null);
  
  // MikroTik Multi-Server Support
  const [mikrotikDevices, setMikrotikDevices] = useState<MikroTikConfig[]>([]);
  const [editingDevice, setEditingDevice] = useState<number | null>(null);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [deviceForm, setDeviceForm] = useState<MikroTikConfig>({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: '',
    isDefault: false,
    isActive: true
  });
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState<Record<number, { connected: boolean; message: string }>>({});

  // PPPoE Users
  const [pppoeUsers, setPppoeUsers] = useState<any[]>([]);
  const [loadingPPPoE, setLoadingPPPoE] = useState(false);
  const [pppoeStats, setPppoeStats] = useState({ total: 0, online: 0, offline: 0 });
  const [pppoeFilter, setPppoeFilter] = useState<'all' | 'online' | 'offline' | 'unlinked'>('all');
  const [pppoeSearch, setPppoeSearch] = useState('');
  const [pppoeProfiles, setPppoeProfiles] = useState<string[]>([]);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);

  // Load theme & session
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) setDarkMode(savedTheme === 'true');
    const token = localStorage.getItem('adminSession');
    const savedUser = localStorage.getItem('currentUser');
    if (token) {
      setIsAdmin(true);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user session');
        }
      }
    }
    
    // PWA Online/Offline Detection
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); console.log('[PWA] Back online!'); };
    const handleOffline = () => { setIsOnline(false); console.log('[PWA] Gone offline!'); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // PWA Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // تحديث عدد العمليات المنتظرة
    getPendingSyncCount().then(setPendingSyncCount);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // PWA: مزامنة تلقائية عند عودة الإنترنت
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      syncPendingChanges();
    }
  }, [isOnline]);

  // PWA: دالة المزامنة
  const syncPendingChanges = async () => {
    const pendingItems = await getAllFromStore<any>('pendingSync');
    if (pendingItems.length === 0) return;
    
    console.log('[PWA] Syncing', pendingItems.length, 'pending changes...');
    
    for (const item of pendingItems) {
      try {
        if (item.type === 'subscriber') {
          if (item.action === 'create') {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(item.data)
            });
            if (res.ok) removePendingSyncItem(item.id);
          } else if (item.action === 'update') {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${item.data.id}`, {
              method: 'PATCH',
              headers: getHeaders(),
              body: JSON.stringify(item.data)
            });
            if (res.ok) removePendingSyncItem(item.id);
          } else if (item.action === 'delete') {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${item.data.id}`, {
              method: 'DELETE',
              headers: getHeaders()
            });
            if (res.ok) removePendingSyncItem(item.id);
          }
        } else if (item.type === 'debt') {
          if (item.action === 'create') {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify(item.data)
            });
            if (res.ok) removePendingSyncItem(item.id);
          } else if (item.action === 'update') {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts?id=eq.${item.data.id}`, {
              method: 'PATCH',
              headers: getHeaders(),
              body: JSON.stringify(item.data)
            });
            if (res.ok) removePendingSyncItem(item.id);
          } else if (item.action === 'delete') {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts?id=eq.${item.data.id}`, {
              method: 'DELETE',
              headers: getHeaders()
            });
            if (res.ok) removePendingSyncItem(item.id);
          }
        }
      } catch (e) {
        console.error('[PWA] Failed to sync item:', e);
      }
    }
    
    const newCount = await getPendingSyncCount();
    setPendingSyncCount(newCount);
    
    if (newCount === 0) {
      alert('✅ تمت مزامنة جميع التغييرات!');
      loadSubscribers();
      loadDebts();
    }
  };

  // Load data when admin
  useEffect(() => {
    if (isAdmin) {
      loadSubscribers();
      loadTickets();
      loadDebts();
      loadInventory();
      loadSettings();
      loadMikrotikDevices();
      loadPPPoEUsers(); // تحميل حسابات PPPoE تلقائياً
    }
  }, [isAdmin]);

  // API Headers
  const getHeaders = () => ({
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  });

  // Load Subscribers
  const loadSubscribers = async () => {
    try {
      if (navigator.onLine) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&order=id.desc`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setSubscribers(Array.isArray(data) ? data : []);
        // Save to IndexedDB for offline
        saveToStore('subscribers', data);
      } else {
        // Load from IndexedDB
        const offlineData = await getAllFromStore<Subscriber>('subscribers');
        setSubscribers(offlineData);
        console.log('[PWA] Loaded subscribers from offline storage');
      }
    } catch (e) { 
      console.error('Load subscribers error:', e);
      // Try offline data
      const offlineData = await getAllFromStore<Subscriber>('subscribers');
      if (offlineData.length > 0) {
        setSubscribers(offlineData);
      }
    }
  };

  // Load Tickets
  const loadTickets = async () => {
    try {
      if (navigator.onLine) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket?select=*&order=id.desc`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : []);
        saveToStore('tickets', data);
      } else {
        const offlineData = await getAllFromStore<Ticket>('tickets');
        setTickets(offlineData);
      }
    } catch (e) { 
      console.error('Load tickets error:', e);
      const offlineData = await getAllFromStore<Ticket>('tickets');
      if (offlineData.length > 0) setTickets(offlineData);
    }
  };

  // Load Debts
  const loadDebts = async () => {
    try {
      if (navigator.onLine) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts?select=*&order=id.desc`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setDebts(Array.isArray(data) ? data : []);
        saveToStore('debts', data);
      } else {
        const offlineData = await getAllFromStore<Debt>('debts');
        setDebts(offlineData);
      }
    } catch (e) { 
      console.error('Load debts error:', e);
      const offlineData = await getAllFromStore<Debt>('debts');
      if (offlineData.length > 0) setDebts(offlineData);
    }
  };

  // Load Inventory
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventory(data);
    } catch (e) {
      console.error('Load inventory error:', e);
    }
    setLoadingInventory(false);
  };

  // Add Inventory Product
  const handleAddInventoryProduct = async () => {
    if (!inventoryForm.name) return;
    setLoadingInventory(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-product', data: inventoryForm }),
      });
      const data = await res.json();
      if (data.success) {
        setShowInventoryForm(false);
        setInventoryForm({ name: '', category: 'راوتر', quantity: 0, minStock: 5, price: 0 });
        loadInventory();
      } else {
        alert('خطأ: ' + data.error);
      }
    } catch (e) {
      alert('حدث خطأ');
    }
    setLoadingInventory(false);
  };

  // Update Stock
  const handleUpdateStock = async (productId: number, type: 'in' | 'out', quantity: number, reason?: string, recipient?: string) => {
    setLoadingInventory(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-stock', data: { id: productId, quantity, type, reason, recipient } }),
      });
      const data = await res.json();
      if (data.success) {
        loadInventory();
      } else {
        alert('خطأ: ' + data.error);
      }
    } catch (e) {
      alert('حدث خطأ');
    }
    setLoadingInventory(false);
  };

  // Delete Product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setLoadingInventory(true);
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-product', data: { id } }),
      });
      loadInventory();
    } catch (e) {
      alert('حدث خطأ');
    }
    setLoadingInventory(false);
  };

  // Load Settings
  const loadSettings = async () => {
    try {
      if (navigator.onLine) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Setting?select=*&limit=1`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (data && data[0]) {
          setSettings(prev => ({ ...prev, ...data[0] }));
          saveToStore('settings', data[0]);
        }
      } else {
        const offlineData = await getAllFromStore<Settings>('settings');
        if (offlineData.length > 0) setSettings(prev => ({ ...prev, ...offlineData[0] }));
      }
    } catch (e) { 
      console.error('Load settings error:', e);
      const offlineData = await getAllFromStore<Settings>('settings');
      if (offlineData.length > 0) setSettings(prev => ({ ...prev, ...offlineData[0] }));
    }
  };

  // ===== MIKROTIK DEVICES CRUD =====
  
  // Load MikroTik Devices
  const loadMikrotikDevices = async () => {
    try {
      if (navigator.onLine) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?select=*&order=id.desc`, {
          headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setMikrotikDevices(Array.isArray(data) ? data : []);
        saveToStore('mikrotikDevices', data);
      } else {
        const offlineData = await getAllFromStore<MikroTikConfig>('mikrotikDevices');
        setMikrotikDevices(offlineData);
      }
    } catch (e) {
      console.error('Load MikroTik devices error:', e);
      const offlineData = await getAllFromStore<MikroTikConfig>('mikrotikDevices');
      if (offlineData.length > 0) setMikrotikDevices(offlineData);
    }
  };

  // Save MikroTik Device (Add/Update)
  const handleSaveDevice = async () => {
    if (!deviceForm.name || !deviceForm.host) {
      alert('الاسم والـ Host مطلوبان');
      return;
    }
    
    setLoading(true);
    
    try {
      if (editingDevice) {
        // Update existing device
        const res = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?id=eq.${editingDevice}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            name: deviceForm.name,
            host: deviceForm.host,
            port: deviceForm.port || 8728,
            username: deviceForm.username,
            password: deviceForm.password,
            isDefault: deviceForm.isDefault,
            isActive: deviceForm.isActive,
            updatedAt: new Date().toISOString()
          })
        });
        
        if (!res.ok) throw new Error('فشل التحديث');
        
        alert('✅ تم تحديث السيرفر بنجاح!');
      } else {
        // Add new device
        const res = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            name: deviceForm.name,
            host: deviceForm.host,
            port: deviceForm.port || 8728,
            username: deviceForm.username,
            password: deviceForm.password,
            isDefault: deviceForm.isDefault,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          console.error('Add device error:', errData);
          throw new Error(errData.message || errData.error || JSON.stringify(errData) || 'فشل الإضافة');
        }
        
        alert('✅ تمت إضافة السيرفر بنجاح!');
      }
      
      setShowDeviceForm(false);
      setDeviceForm({ name: '', host: '', port: 8728, username: '', password: '', isDefault: false, isActive: true });
      setEditingDevice(null);
      await loadMikrotikDevices();
      
    } catch (e: any) {
      console.error('Save device error:', e);
      alert('❌ ' + (e.message || 'حدث خطأ'));
    }
    
    setLoading(false);
  };

  // Edit MikroTik Device
  const handleEditDevice = (device: MikroTikConfig) => {
    setDeviceForm({
      name: device.name,
      host: device.host,
      port: device.port,
      username: device.username,
      password: device.password,
      isDefault: device.isDefault,
      isActive: device.isActive
    });
    setEditingDevice(device.id || null);
    setShowDeviceForm(true);
  };

  // Delete MikroTik Device
  const handleDeleteDevice = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا السيرفر؟')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!res.ok) throw new Error('فشل الحذف');
      
      await loadMikrotikDevices();
      alert('✅ تم حذف السيرفر بنجاح!');
    } catch (e) {
      console.error('Delete device error:', e);
      alert('❌ حدث خطأ أثناء الحذف');
    }
    setLoading(false);
  };

  // Set Default Device
  const handleSetDefaultDevice = async (id: number) => {
    setLoading(true);
    try {
      // First, remove default from all devices
      await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?isDefault=eq.true`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isDefault: false })
      });
      
      // Then set the selected device as default
      const res = await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isDefault: true })
      });
      
      if (!res.ok) throw new Error('فشل التعيين');
      
      await loadMikrotikDevices();
      alert('✅ تم تعيين السيرفر كافتراضي!');
    } catch (e) {
      console.error('Set default device error:', e);
      alert('❌ حدث خطأ');
    }
    setLoading(false);
  };

  // Test Device Connection
  const handleTestDeviceConnection = async (device: MikroTikConfig) => {
    if (!device.id) return;
    
    setDeviceConnectionStatus(prev => ({ ...prev, [device.id!]: { connected: false, message: 'جاري الاختبار...' } }));
    
    try {
      const res = await fetch('/api/mikrotik?action=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: device.host,
          port: device.port,
          username: device.username,
          password: device.password
        })
      });
      
      const data = await res.json();
      setDeviceConnectionStatus(prev => ({ 
        ...prev, 
        [device.id!]: { connected: data.success, message: data.message } 
      }));
      
      // Update isActive status based on connection
      if (device.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/MikroTikDevice?id=eq.${device.id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ isActive: data.success })
        });
        await loadMikrotikDevices();
      }
      
    } catch (e) {
      setDeviceConnectionStatus(prev => ({ 
        ...prev, 
        [device.id!]: { connected: false, message: 'فشل الاتصال' } 
      }));
    }
  };

  // Auth - تسجيل دخول محدث مع دعم الأدوار
  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, pin }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAdmin(true);
        setCurrentUser(data.user);
        setLoginOpen(false);
        localStorage.setItem('adminSession', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        setUsername('');
        setPassword('');
        setPin('');
        setError('');
        setRequirePin(false);
      } else if (data.requirePin) {
        setRequirePin(true);
        setError('أدخل رمز PIN');
      } else {
        setError(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch (e) {
      setError('حدث خطأ في الاتصال');
    }

    setLoading(false);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('adminSession');
    localStorage.removeItem('currentUser');
  };

  // التحقق من الصلاحية
  const hasPermission = (tab: string): boolean => {
    if (!currentUser) return true; // للتوافق مع النظام القديم
    return currentUser.permissions[tab] !== false;
  };

  // Theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', String(!darkMode));
  };

  // Customer Search
  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?select=*&or=(name.ilike.%25${encodeURIComponent(searchName)}%25,phone.ilike.%25${encodeURIComponent(searchName)}%25)&limit=10`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.length === 1) {
        const subscriber = data[0];
        
        // حساب المبلغ المستحق
        let totalDue = subscriber.balance || 0;
        
        // إذا منتهي الصلاحية، نضيف رسوم الاشتراك
        if (subscriber.paymentStatus === 'expired' || subscriber.status === 'expired') {
          const monthlyFee = subscriber.monthlyFee || 0;
          // نحسب عدد الأشهر المتأخرة من تاريخ الانتهاء
          if (subscriber.expiryDate) {
            const expiryDate = new Date(subscriber.expiryDate);
            const today = new Date();
            const daysDiff = Math.floor((today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
            const monthsLate = Math.ceil(daysDiff / 30);
            if (monthsLate > 0) {
              totalDue += monthlyFee * monthsLate;
            } else {
              totalDue += monthlyFee; // شهر واحد على الأقل
            }
          } else {
            totalDue += monthlyFee;
          }
        }
        
        setSearchResult({ subscriber, totalDue });
        
        // ربط رقم الهاتف مع OneSignal للإشعارات المستقبلية
        const subscriberPhone = data[0].phone;
        if (subscriberPhone && typeof window !== 'undefined' && (window as any).OneSignal) {
          try {
            const OneSignal = (window as any).OneSignal;
            // إضافة tag برقم الهاتف للتمييز بين المشتركين
            await OneSignal.User.addTag('phone', subscriberPhone);
            await OneSignal.User.addTag('name', data[0].name);
            console.log('[OneSignal] Tagged user with phone:', subscriberPhone);
          } catch (e) {
            console.log('[OneSignal] Could not tag user:', e);
          }
        }
      } else if (data.length > 1) {
        setSearchResult({ multipleResults: data, error: `تم العثور على ${data.length} نتائج` });
      } else {
        setSearchResult({ error: 'لا يوجد مشترك بهذا الاسم أو الرقم' });
      }
    } catch (e) {
      setSearchResult({ error: 'خطأ في البحث' });
    }
    setLoading(false);
  };

  // Calculate expiry date
  const calculateExpiryDate = (renewalDate: string) => {
    const date = new Date(renewalDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  };

  // ===== SUBSCRIBERS CRUD =====
  
  // Add/Update Subscriber
  const handleSaveSubscriber = async () => {
    if (!subscriberForm.name || !subscriberForm.phone) {
      setError('الاسم والهاتف مطلوبان');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const now = new Date().toISOString();
    const dataToSave: any = {
      name: subscriberForm.name,
      phone: subscriberForm.phone,
      address: subscriberForm.address || '',
      pppoeUser: subscriberForm.pppoeUser || '',
      pppoePassword: subscriberForm.pppoePassword || '',
      plan: subscriberForm.plan || '',
      monthlyFee: Number(subscriberForm.monthlyFee) || 0,
      balance: Number(subscriberForm.balance) || 0,
      status: subscriberForm.status || 'active',
      paymentStatus: subscriberForm.paymentStatus || 'paid',
      notes: subscriberForm.notes || ''
    };

    // PWA: إذا غير متصل، احفظ محلياً وأضف للمزامنة
    if (!navigator.onLine) {
      if (editingSubscriber) {
        dataToSave.id = editingSubscriber;
        // تحديث محلي
        const updatedSubscribers = subscribers.map(s => s.id === editingSubscriber ? { ...s, ...dataToSave } : s);
        setSubscribers(updatedSubscribers);
        saveToStore('subscribers', updatedSubscribers);
        // إضافة للمزامنة لاحقاً
        await addToPendingSync({ type: 'subscriber', action: 'update', data: dataToSave });
        alert('✅ تم الحفظ محلياً - سيتم المزامنة عند عودة الإنترنت');
      } else {
        // إنشاء ID مؤقت
        const tempId = Date.now();
        dataToSave.id = tempId;
        dataToSave.lastRenewalDate = now;
        dataToSave.expiryDate = calculateExpiryDate(now);
        // إضافة محلياً
        const newSubscribers = [{ ...dataToSave, id: tempId }, ...subscribers];
        setSubscribers(newSubscribers);
        saveToStore('subscribers', newSubscribers);
        // إضافة للمزامنة لاحقاً
        await addToPendingSync({ type: 'subscriber', action: 'create', data: dataToSave });
        alert('✅ تم الحفظ محلياً - سيتم المزامنة عند عودة الإنترنت');
      }
      setPendingSyncCount(await getPendingSyncCount());
      setShowSubscriberForm(false);
      setSubscriberForm({ status: 'active', balance: 0, monthlyFee: 0, paymentStatus: 'paid' });
      setEditingSubscriber(null);
      setLoading(false);
      return;
    }
    
    try {
      if (editingSubscriber) {
        // Update existing
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${editingSubscriber}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(dataToSave)
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'فشل التحديث');
        }
        
        alert('✅ تم التحديث بنجاح!');
      } else {
        // Add new
        dataToSave.lastRenewalDate = now;
        dataToSave.expiryDate = calculateExpiryDate(now);
        
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(dataToSave)
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'فشل الإضافة');
        }
        
        alert('✅ تمت الإضافة بنجاح!');
      }
      
      setShowSubscriberForm(false);
      setSubscriberForm({ status: 'active', balance: 0, monthlyFee: 0, paymentStatus: 'paid' });
      setEditingSubscriber(null);
      await loadSubscribers();
      
    } catch (e: any) {
      console.error('Save subscriber error:', e);
      setError(e.message || 'حدث خطأ');
      alert('❌ ' + (e.message || 'حدث خطأ'));
    }
    
    setLoading(false);
  };

  // Edit Subscriber
  const handleEditSubscriber = (sub: Subscriber) => {
    setSubscriberForm({
      name: sub.name,
      phone: sub.phone,
      address: sub.address || '',
      pppoeUser: sub.pppoeUser || '',
      pppoePassword: sub.pppoePassword || '',
      plan: sub.plan || '',
      monthlyFee: sub.monthlyFee || 0,
      balance: sub.balance || 0,
      status: sub.status || 'active',
      paymentStatus: sub.paymentStatus || 'paid',
      notes: sub.notes || ''
    });
    setEditingSubscriber(sub.id);
    setShowSubscriberForm(true);
  };

  // Delete Subscriber
  const handleDeleteSubscriber = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشترك؟')) return;
    
    // PWA: إذا غير متصل، احذف محلياً وأضف للمزامنة
    if (!navigator.onLine) {
      const updatedSubscribers = subscribers.filter(s => s.id !== id);
      setSubscribers(updatedSubscribers);
      saveToStore('subscribers', updatedSubscribers);
      await addToPendingSync({ type: 'subscriber', action: 'delete', data: { id } });
      setPendingSyncCount(await getPendingSyncCount());
      alert('✅ تم الحذف محلياً - سيتم المزامنة عند عودة الإنترنت');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!res.ok) throw new Error('فشل الحذف');
      
      await loadSubscribers();
      alert('✅ تم الحذف بنجاح!');
    } catch (e) {
      console.error('Delete subscriber error:', e);
      alert('❌ حدث خطأ أثناء الحذف');
    }
    setLoading(false);
  };

  // Renew Subscription (مع تفعيل PPPoE تلقائياً)
  const handleRenewSubscription = async (sub: Subscriber) => {
    if (!confirm(`تجديد اشتراك ${sub.name}؟\n\nسيتم إضافة 30 يوم وتفعيل الخدمة.`)) return;
    
    setLoading(true);
    try {
      // استخدام API التجديد الجديد
      const res = await fetch('/api/cron/radius-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'renew', 
          subscriberId: sub.id 
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        await loadSubscribers();
      } else {
        alert('❌ ' + (data.error || 'فشل التجديد'));
      }
    } catch (e) {
      alert('❌ حدث خطأ');
    }
    setLoading(false);
  };

  // ===== TICKETS CRUD =====
  
  // Add Ticket (Customer)
  const handleAddTicket = async () => {
    if (!ticketForm.subject || !ticketForm.description) {
      setError('الموضوع والتفاصيل مطلوبان');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // استخدام API الشكاوى
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticketForm.subject,
          phone: ticketForm.phone || '',
          details: ticketForm.description,
          name: ticketForm.name || 'زائر'
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTicketForm({ name: '', phone: '', subject: '', description: '' });
        alert('✅ تم إرسال الشكوى بنجاح!');
      } else {
        setError(data.error || 'حدث خطأ أثناء الإرسال');
        alert('❌ ' + (data.error || 'حدث خطأ'));
      }
    } catch (e: any) {
      console.error('Ticket error:', e);
      setError('حدث خطأ في الاتصال');
      alert('❌ حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (id: number, status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, updatedAt: new Date().toISOString() })
      });
      
      if (!res.ok) throw new Error('فشل التحديث');
      
      await loadTickets();
      setSelectedTicket(null);
      alert('✅ تم تحديث الحالة!');
    } catch (e) {
      alert('❌ حدث خطأ');
    }
    setLoading(false);
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشكوى؟')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Ticket?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!res.ok) throw new Error('فشل الحذف');
      
      await loadTickets();
      alert('✅ تم الحذف بنجاح!');
    } catch (e) {
      alert('❌ حدث خطأ');
    }
    setLoading(false);
  };

  // ===== DEBTS CRUD =====
  
  // Add/Update Debt
  const handleSaveDebt = async () => {
    if (!debtForm.name || !debtForm.amount) {
      setError('الاسم والمبلغ مطلوبان');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const dataToSave = {
      name: debtForm.name,
      phone: debtForm.phone || '',
      address: debtForm.address || '',
      reason: debtForm.reason || '',
      amount: Number(debtForm.amount) || 0
    };

    // PWA: إذا غير متصل، احفظ محلياً
    if (!navigator.onLine) {
      if (editingDebt) {
        dataToSave.id = editingDebt;
        const updatedDebts = debts.map(d => d.id === editingDebt ? { ...d, ...dataToSave } : d);
        setDebts(updatedDebts);
        saveToStore('debts', updatedDebts);
        await addToPendingSync({ type: 'debt', action: 'update', data: dataToSave });
      } else {
        const tempId = Date.now();
        const newDebt = { ...dataToSave, id: tempId, createdAt: new Date().toISOString() };
        const newDebts = [newDebt, ...debts];
        setDebts(newDebts);
        saveToStore('debts', newDebts);
        await addToPendingSync({ type: 'debt', action: 'create', data: newDebt });
      }
      setPendingSyncCount(await getPendingSyncCount());
      alert('✅ تم الحفظ محلياً - سيتم المزامنة عند عودة الإنترنت');
      setShowDebtForm(false);
      setDebtForm({ amount: 0 });
      setEditingDebt(null);
      setLoading(false);
      return;
    }
    
    try {
      if (editingDebt) {
        // Update
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts?id=eq.${editingDebt}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(dataToSave)
        });
        
        if (!res.ok) throw new Error('فشل التحديث');
        
        alert('✅ تم التحديث بنجاح!');
      } else {
        // Add
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ ...dataToSave, createdAt: new Date().toISOString() })
        });
        
        if (!res.ok) throw new Error('فشل الإضافة');
        
        alert('✅ تمت الإضافة بنجاح!');
      }
      
      setShowDebtForm(false);
      setDebtForm({ amount: 0 });
      setEditingDebt(null);
      await loadDebts();
      
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
      alert('❌ ' + e.message);
    }
    
    setLoading(false);
  };

  // Edit Debt
  const handleEditDebt = (debt: Debt) => {
    setDebtForm({
      name: debt.name,
      phone: debt.phone || '',
      address: debt.address || '',
      reason: debt.reason || '',
      amount: debt.amount
    });
    setEditingDebt(debt.id);
    setShowDebtForm(true);
  };

  // Delete Debt
  const handleDeleteDebt = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدين؟')) return;
    
    // PWA: إذا غير متصل، احذف محلياً
    if (!navigator.onLine) {
      const updatedDebts = debts.filter(d => d.id !== id);
      setDebts(updatedDebts);
      saveToStore('debts', updatedDebts);
      await addToPendingSync({ type: 'debt', action: 'delete', data: { id } });
      setPendingSyncCount(await getPendingSyncCount());
      alert('✅ تم الحذف محلياً - سيتم المزامنة عند عودة الإنترنت');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Debts?id=eq.${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!res.ok) throw new Error('فشل الحذف');
      
      await loadDebts();
      alert('✅ تم الحذف بنجاح!');
    } catch (e) {
      alert('❌ حدث خطأ');
    }
    setLoading(false);
  };

  // ===== PPPOE USERS =====

  // Load PPPoE Users from MikroTik
  const loadPPPoEUsers = async () => {
    setLoadingPPPoE(true);
    try {
      const res = await fetch('/api/mikrotik/pppoe');
      const data = await res.json();
      
      if (data.error) {
        console.error('PPPoE load error:', data.error);
        alert('❌ ' + data.error);
        return;
      }
      
      setPppoeUsers(data.users || []);
      setPppoeStats({
        total: data.total || 0,
        online: data.online || 0,
        offline: data.offline || 0,
      });
      
      // Load profiles
      const profilesRes = await fetch('/api/mikrotik/pppoe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-profiles' }),
      });
      const profilesData = await profilesRes.json();
      if (profilesData.profiles) {
        setPppoeProfiles(profilesData.profiles.map((p: any) => p.name));
      }
    } catch (e) {
      console.error('Load PPPoE error:', e);
      alert('❌ فشل تحميل مستخدمي PPPoE');
    }
    setLoadingPPPoE(false);
  };

  // Change PPPoE Profile (Speed)
  const handleChangeProfile = async (username: string, newProfile: string) => {
    if (!confirm(`تغيير سرعة ${username} إلى ${newProfile}؟\nسيتم قطع الاتصال لتطبيق السرعة الجديدة.`)) return;
    
    try {
      const res = await fetch('/api/mikrotik/pppoe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-profile', username, profile: newProfile }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        await loadPPPoEUsers();
      } else {
        alert('❌ ' + (data.error || 'فشل تغيير السرعة'));
      }
    } catch (e) {
      alert('❌ حدث خطأ');
    }
  };

  // PPPoE Action (disconnect/enable/disable)
  const handlePPPoEAction = async (action: 'disconnect' | 'enable' | 'disable', username: string) => {
    if (!confirm(`هل أنت متأكد من ${action === 'disconnect' ? 'قطع الاتصال' : action === 'disable' ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}؟`)) return;
    
    try {
      const res = await fetch('/api/mikrotik/pppoe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        await loadPPPoEUsers();
      } else {
        alert('❌ ' + (data.error || 'فشل العملية'));
      }
    } catch (e) {
      alert('❌ حدث خطأ');
    }
  };

  // Link PPPoE to Subscriber
  const handleLinkPPPoE = async (pppoeUsername: string, subscriberId: number) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ pppoeUser: pppoeUsername }),
      });
      
      if (!res.ok) throw new Error('فشل الربط');
      
      alert('✅ تم ربط الحساب بنجاح!');
      await loadPPPoEUsers();
      await loadSubscribers();
    } catch (e) {
      alert('❌ فشل ربط الحساب');
    }
  };

  // Unlink PPPoE from Subscriber
  const handleUnlinkPPPoE = async (subscriberId: number) => {
    if (!confirm('هل أنت متأكد من إلغاء ربط هذا الحساب؟')) return;
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Subscriber?id=eq.${subscriberId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ pppoeUser: null }),
      });
      
      if (!res.ok) throw new Error('فشل إلغاء الربط');
      
      alert('✅ تم إلغاء الربط!');
      await loadPPPoEUsers();
      await loadSubscribers();
    } catch (e) {
      alert('❌ فشل إلغاء الربط');
    }
  };

  // Filtered PPPoE Users
  const filteredPPPoEUsers = pppoeUsers.filter(user => {
    const matchesSearch = !pppoeSearch || 
      user.name?.toLowerCase().includes(pppoeSearch.toLowerCase()) ||
      user.subscriber?.name?.toLowerCase().includes(pppoeSearch.toLowerCase());
    
    if (pppoeFilter === 'online') return matchesSearch && user.isOnline;
    if (pppoeFilter === 'offline') return matchesSearch && !user.isOnline;
    if (pppoeFilter === 'unlinked') return matchesSearch && !user.subscriber;
    return matchesSearch;
  });

  // ===== SETTINGS =====
  
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // أولاً جلب الإعدادات الحالية لمعرفة ID
      const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/Setting?select=*&limit=1`, {
        headers: getHeaders()
      });
      const existingSettings = await checkRes.json();
      
      const settingsData = {
        adminPassword: settings.adminPassword,
        adminPin: settings.adminPin,
        supportName1: settings.supportName1,
        supportPhone1: settings.supportPhone1,
        supportName2: settings.supportName2,
        supportPhone2: settings.supportPhone2
      };
      
      if (existingSettings && existingSettings.length > 0) {
        // تحديث موجود
        const existingId = existingSettings[0].id;
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Setting?id=eq.${existingId}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(settingsData)
        });
        if (!res.ok) throw new Error('فشل التحديث');
      } else {
        // إنشاء جديد
        const res = await fetch(`${SUPABASE_URL}/rest/v1/Setting`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(settingsData)
        });
        if (!res.ok) throw new Error('فشل الإنشاء');
      }
      
      // مسح localStorage ليأخذ الإعدادات الجديدة
      localStorage.removeItem('adminSession');
      
      alert('✅ تم حفظ الإعدادات! سجل خروج ودخول مجدداً.');
    } catch (e: any) {
      console.error('Save settings error:', e);
      alert('❌ ' + (e.message || 'حدث خطأ'));
    }
    setLoading(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['الاسم', 'الهاتف', 'العنوان', 'الباقة', 'الرصيد المستحق', 'سعر الباقة', 'PPPoE User', 'PPPoE Password', 'حالة الدفع'];
    const rows = subscribers.map(s => [
      s.name, s.phone, s.address || '', s.plan || '', 
      s.balance || 0, s.monthlyFee || 0, 
      s.pppoeUser || '', s.pppoePassword || '', s.paymentStatus || 'paid'
    ]);
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(r => csv += r.map(c => `"${c}"`).join(',') + '\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `مشتركين_${new Date().toLocaleDateString('ar')}.csv`;
    a.click();
  };

  // Send Push Notification
  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('العنوان والرسالة مطلوبان');
      return;
    }
    
    setSendingNotification(true);
    try {
      const body: any = {
        title: notificationForm.title,
        message: notificationForm.message,
        url: notificationForm.url || 'https://jaramanaramzy.vercel.app'
      };
      
      // إرسال لزبون محدد
      if (targetSubscriber !== 'all') {
        body.targetPhone = targetSubscriber;
      }
      
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (data.success) {
        const recipientText = targetSubscriber === 'all' 
          ? 'الجميع' 
          : `المشترك المحدد`;
        alert(`✅ تم إرسال الإشعار إلى ${recipientText}!`);
        setNotificationForm({ title: '', message: '', url: '' });
      } else {
        alert('❌ ' + (data.error || 'فشل الإرسال'));
      }
    } catch (e) {
      alert('❌ حدث خطأ أثناء الإرسال');
    }
    setSendingNotification(false);
  };

  // Export Debts CSV
  const handleExportDebtsCSV = () => {
    const headers = ['الاسم', 'الهاتف', 'العنوان', 'السبب', 'المبلغ'];
    const rows = debts.map(d => [d.name, d.phone || '', d.address || '', d.reason || '', d.amount]);
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(r => csv += r.map(c => `"${c}"`).join(',') + '\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ديون_${new Date().toLocaleDateString('ar')}.csv`;
    a.click();
  };

  // WhatsApp & SMS
  const sendWhatsApp = (phone: string, msg: string) => {
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const sendSMS = (phone: string, msg: string) => {
    window.location.href = `sms:${phone.replace(/\D/g, '')}?body=${encodeURIComponent(msg)}`;
  };

  // Print Invoice
  const printInvoice = (sub: Subscriber) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
        <head><title>فاتورة - ${sub.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
        </style>
        </head>
        <body>
          <div class="header">
            <h2>Jaramana Net</h2>
            <p>فاتورة اشتراك إنترنت</p>
          </div>
          <div class="info"><span class="label">المشترك:</span> ${sub.name}</div>
          <div class="info"><span class="label">الهاتف:</span> ${sub.phone}</div>
          <div class="info"><span class="label">العنوان:</span> ${sub.address || '-'}</div>
          <div class="info"><span class="label">الباقة:</span> ${sub.plan || '-'}</div>
          <div class="info"><span class="label">حساب PPPoE:</span> ${sub.pppoeUser || '-'}</div>
          <div class="info"><span class="label">كلمة سر PPPoE:</span> ${sub.pppoePassword || '-'}</div>
          <div class="info"><span class="label">سعر الباقة:</span> ${(sub.monthlyFee || 0).toLocaleString()} ل.س</div>
          <div class="info"><span class="label">الرصيد المستحق:</span> <strong style="color: red">${(sub.balance || 0).toLocaleString()} ل.س</strong></div>
          <div class="footer">
            <p>للتواصل: ${settings.supportPhone1}</p>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar')}</p>
            <p>جميع الحقوق محفوظة © Eng Ramzy Company 2026</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Print Ticket
  const printTicket = (ticket: Ticket) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
        <head><title>شكوى - ${ticket.subject}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .info { margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
        </head>
        <body>
          <div class="header"><h2>شكوى / اقتراح</h2></div>
          <div class="info"><span class="label">الاسم:</span> ${ticket.name || '-'}</div>
          <div class="info"><span class="label">الهاتف:</span> ${ticket.phone || '-'}</div>
          <div class="info"><span class="label">الموضوع:</span> ${ticket.subject}</div>
          <div class="info"><span class="label">التفاصيل:</span> ${ticket.description}</div>
          <div class="info"><span class="label">الحالة:</span> ${ticket.status === 'open' ? 'مفتوح' : 'مغلق'}</div>
          <div class="info"><span class="label">التاريخ:</span> ${new Date(ticket.createdAt).toLocaleDateString('ar')}</div>
          <div class="footer">جميع الحقوق محفوظة © Eng Ramzy Company 2026</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Parse MikroTik uptime format (e.g., "1d2h3m4s" or "2h30m")
  const parseUptime = (uptime: string | null): string => {
    if (!uptime) return '';
    
    let days = 0, hours = 0, minutes = 0, seconds = 0;
    
    const dayMatch = uptime.match(/(\d+)d/);
    const hourMatch = uptime.match(/(\d+)h/);
    const minMatch = uptime.match(/(\d+)m/);
    const secMatch = uptime.match(/(\d+)s/);
    
    if (dayMatch) days = parseInt(dayMatch[1]);
    if (hourMatch) hours = parseInt(hourMatch[1]);
    if (minMatch) minutes = parseInt(minMatch[1]);
    if (secMatch) seconds = parseInt(secMatch[1]);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} يوم`);
    if (hours > 0) parts.push(`${hours} ساعة`);
    if (minutes > 0) parts.push(`${minutes} دقيقة`);
    if (seconds > 0 && parts.length === 0) parts.push(`${seconds} ثانية`);
    
    return parts.join(' و ');
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Payment Status Badge
  const getPaymentStatusBadge = (status?: string) => {
    const statusOption = PAYMENT_STATUS_OPTIONS.find(s => s.value === status) || PAYMENT_STATUS_OPTIONS[0];
    return (
      <span className={`px-2 py-1 rounded text-xs ${statusOption.color}`}>
        {statusOption.label}
      </span>
    );
  };

  // Filter Subscribers
  const filteredSubscribers = subscribers.filter(s => {
    const matchSearch = !searchSubscriber || s.name?.includes(searchSubscriber) || s.phone?.includes(searchSubscriber);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchPaymentStatus = filterPaymentStatus === 'all' || s.paymentStatus === filterPaymentStatus;
    return matchSearch && matchStatus && matchPaymentStatus;
  });

  // Statistics
  const totalRevenue = subscribers.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
  const totalBalance = subscribers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.amount, 0);
  const paidCount = subscribers.filter(s => s.paymentStatus === 'paid').length;
  const expiredCount = subscribers.filter(s => s.paymentStatus === 'expired').length;
  const graceCount = subscribers.filter(s => s.paymentStatus === 'grace_1day').length;

  // Classes
  const bgClass = darkMode ? 'bg-[#0f172a]' : 'bg-gray-100';
  const textClass = darkMode ? 'text-white' : 'text-slate-800';
  const cardClass = darkMode ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white shadow';
  const inputClass = darkMode ? 'bg-[#334155] border-[#475569] text-white' : 'bg-white border-gray-300 text-slate-800';

  // PWA Install Handler
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Install outcome:', outcome);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass}`} dir="rtl">
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <span className="text-sm">ثبّت التطبيق على جهازك للوصول السريع!</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleInstallPWA} className="bg-white text-indigo-600 px-3 py-1 rounded text-sm font-bold">تثبيت</button>
            <button onClick={() => setShowInstallPrompt(false)} className="text-white/80 hover:text-white text-sm">✕</button>
          </div>
        </div>
      )}
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 flex items-center justify-center gap-2 z-50 animate-pulse">
          <span className="text-lg">📡</span>
          <span className="text-sm font-medium">أنت غير متصل بالإنترنت - البيانات من الذاكرة المحلية</span>
        </div>
      )}
      
      {/* Header */}
      <header className={`${darkMode ? 'bg-[#1e3a5f] border-b border-[#334155]' : 'bg-white shadow'} py-3 ${!isOnline || showInstallPrompt ? 'mt-10' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 relative">
              <Image src="/logo-jaramana.jpg" alt="Logo" fill className="object-cover" priority />
            </div>
            <span className={`text-xl font-bold ${textClass}`}>Jaramana Net</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span>{isOnline ? 'متصل' : 'غير متصل'}</span>
              {pendingSyncCount > 0 && (
                <span className="bg-orange-500 text-white px-1 rounded ml-1">{pendingSyncCount}</span>
              )}
            </div>
            <button onClick={toggleTheme} className={`p-2 rounded-lg ${darkMode ? 'bg-[#334155] text-yellow-400' : 'bg-gray-100'}`}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            {isAdmin ? (
              <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg">خروج</button>
            ) : (
              <button onClick={() => setLoginOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">دخول</button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {loginOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'bg-[#1e293b] border border-[#475569]' : 'bg-white'} p-6 rounded-xl w-80 shadow-2xl`}>
            <h2 className={`text-xl font-bold mb-4 ${textClass}`}>تسجيل الدخول</h2>
            {error && <p className="text-red-400 text-center mb-2 text-sm">{error}</p>}
            <input 
              type="text" 
              placeholder="اسم المستخدم" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className={`w-full border p-3 rounded-lg mb-3 ${inputClass}`} 
            />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className={`w-full border p-3 rounded-lg mb-3 ${inputClass}`} 
            />
            {requirePin && (
              <input 
                type="password" 
                placeholder="PIN (للأدمن فقط)" 
                value={pin} 
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                className={`w-full border p-3 rounded-lg mb-3 ${inputClass}`} 
                maxLength={4} 
              />
            )}
            <div className="flex gap-2">
              <button onClick={handleLogin} disabled={loading} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg disabled:opacity-50">
                {loading ? '...' : 'دخول'}
              </button>
              <button onClick={() => { setLoginOpen(false); setRequirePin(false); setError(''); }} className={`px-4 rounded-lg ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}>إلغاء</button>
            </div>
            <p className={`text-xs mt-3 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              الأدمن: admin | المحاسب: accountant | الدعم: support
            </p>
          </div>
        </div>
      )}

      {/* Customer Interface */}
      {!isAdmin && (
        <section className="max-w-xl mx-auto mt-6 px-4">
          {/* Search */}
          <div className={`${cardClass} rounded-xl p-6 mb-6`}>
            <h3 className={`text-lg font-bold mb-4 ${textClass}`}>🔍 البحث عن الفاتورة</h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>أدخل اسمك أو رقم الهاتف</p>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="الاسم أو رقم الهاتف" 
                value={searchName} 
                onChange={e => setSearchName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSearch()} 
                className={`flex-1 border p-3 rounded-lg ${inputClass}`} 
              />
              <button 
                onClick={handleSearch} 
                disabled={loading} 
                className="bg-indigo-600 text-white px-6 rounded-lg disabled:opacity-50"
              >
                {loading ? '...' : 'بحث'}
              </button>
            </div>
            {searchResult?.subscriber && (
              <div className={`${darkMode ? 'bg-[#334155]' : 'bg-gray-50'} rounded-xl p-4 border ${darkMode ? 'border-[#475569]' : 'border-gray-200'}`}>
                <p className={`font-bold ${textClass}`}>{searchResult.subscriber.name}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{searchResult.subscriber.phone}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>الباقة: {searchResult.subscriber.plan || '-'}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>حساب PPPoE: {searchResult.subscriber.pppoeUser || '-'}</p>
                <div className="mt-2">{getPaymentStatusBadge(searchResult.subscriber.paymentStatus)}</div>
                <p className={`mt-2 font-bold ${searchResult.totalDue > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {searchResult.totalDue > 0 ? `💵 الرصيد المستحق: ${searchResult.totalDue.toLocaleString()} ل.س` : '✓ لا يوجد رصيد مستحق'}
                </p>
              </div>
            )}
            {searchResult?.error && <p className="text-yellow-400 text-center p-2">{searchResult.error}</p>}
          </div>

          {/* WhatsApp Support */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl shadow-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl">💬</div>
              <div className="flex-1">
                <p className="font-bold text-white">WhatsApp</p>
                <p className="text-white/90 text-sm">{settings.supportName1}</p>
              </div>
              <a href={`https://wa.me/${settings.supportPhone1}`} target="_blank" className="bg-white text-green-600 px-4 py-2 rounded font-bold text-sm">تواصل</a>
            </div>
          </div>

          {/* Support Numbers */}
          <div className={`${cardClass} rounded-xl p-4 mb-4`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>👤</div>
              <div className="flex-1">
                <p className={`font-medium ${textClass}`}>{settings.supportName1}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{settings.supportPhone1}</p>
              </div>
              <a href={`tel:${settings.supportPhone1}`} className="text-indigo-400 text-sm">اتصال</a>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>👤</div>
              <div className="flex-1">
                <p className={`font-medium ${textClass}`}>{settings.supportName2}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{settings.supportPhone2}</p>
              </div>
              <a href={`tel:${settings.supportPhone2}`} className="text-indigo-400 text-sm">اتصال</a>
            </div>
          </div>

          {/* Complaint Form */}
          <div className={`${cardClass} rounded-xl p-6 mb-8`}>
            <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📝 إرسال شكوى / اقتراح</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="الاسم" 
                value={ticketForm.name} 
                onChange={e => setTicketForm({ ...ticketForm, name: e.target.value })} 
                className={`w-full border p-3 rounded-lg ${inputClass}`} 
              />
              <input 
                type="text" 
                placeholder="رقم الهاتف" 
                value={ticketForm.phone} 
                onChange={e => setTicketForm({ ...ticketForm, phone: e.target.value })} 
                className={`w-full border p-3 rounded-lg ${inputClass}`} 
              />
              <input 
                type="text" 
                placeholder="الموضوع" 
                value={ticketForm.subject} 
                onChange={e => setTicketForm({ ...ticketForm, subject: e.target.value })} 
                className={`w-full border p-3 rounded-lg ${inputClass}`} 
              />
              <textarea 
                placeholder="تفاصيل الشكوى أو الاقتراح" 
                value={ticketForm.description} 
                onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })} 
                className={`w-full border p-3 rounded-lg h-24 ${inputClass}`} 
              />
              <button 
                onClick={handleAddTicket} 
                disabled={loading} 
                className="w-full bg-indigo-600 text-white py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? '...' : 'إرسال الشكوى'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Admin Dashboard */}
      {isAdmin && (
        <section className="max-w-7xl mx-auto mt-4 px-4 pb-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
              { id: 'subscribers', label: 'المشتركين', icon: '👥' },
              { id: 'debts', label: 'الديون', icon: '💰' },
              { id: 'inventory', label: 'المخزون', icon: '📦' },
              { id: 'tickets', label: 'الشكاوى', icon: '🎫' },
              { id: 'notifications', label: 'الإشعارات', icon: '🔔' },
              { id: 'reports', label: 'التقارير', icon: '📊' },
              { id: 'monitor', label: 'المراقبة', icon: '🔧' },
              { id: 'whatsapp', label: 'واتساب', icon: '💬' },
              { id: 'users', label: 'المستخدمين', icon: '👤' },
              { id: 'mikrotik', label: 'MikroTik', icon: '📡' },
              { id: 'pppoe', label: 'PPPoE', icon: '🔌' },
              { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
            ].filter(tab => hasPermission(tab.id)).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100 text-slate-600'}`}
              >
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* User Info Bar */}
          {currentUser && currentUser.role !== 'admin' && (
            <div className={`mb-4 px-4 py-2 rounded-lg ${darkMode ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    👤 {currentUser.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    currentUser.role === 'accountant' ? 'bg-green-100 text-green-700' :
                    currentUser.role === 'support' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {currentUser.role === 'accountant' ? 'محاسب' :
                     currentUser.role === 'support' ? 'دعم فني' : 'مدير'}
                  </span>
                </div>
                <button onClick={handleLogout} className="text-red-500 text-sm">تسجيل خروج</button>
              </div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${cardClass} rounded-xl p-6`}>
                  <p className="text-3xl mb-2">👥</p>
                  <p className={`text-2xl font-bold ${textClass}`}>{subscribers.length}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>مشتركين</p>
                </div>
                <div className={`${darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'} rounded-xl p-6 border`}>
                  <p className="text-3xl mb-2">✅</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{paidCount}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>دافعين</p>
                </div>
                <div className={`${darkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} rounded-xl p-6 border`}>
                  <p className="text-3xl mb-2">⏰</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{graceCount}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>مهلة يوم</p>
                </div>
                <div className={`${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200'} rounded-xl p-6 border`}>
                  <p className="text-3xl mb-2">🚫</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{expiredCount}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>منتهي</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className={`${cardClass} rounded-xl p-6`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي الفواتير الشهرية</p>
                  <p className="text-2xl font-bold text-green-500">{totalRevenue.toLocaleString()} ل.س</p>
                </div>
                <div className={`${cardClass} rounded-xl p-6`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي المديونية</p>
                  <p className="text-2xl font-bold text-red-500">{totalBalance.toLocaleString()} ل.س</p>
                </div>
                <div className={`${cardClass} rounded-xl p-6`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي الاستدانات</p>
                  <p className="text-2xl font-bold text-orange-500">{totalDebts.toLocaleString()} ل.س</p>
                </div>
              </div>

              {/* RADIUS Auto-Sync */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>🔄 مزامنة RADIUS التلقائية</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      قطع تلقائي للمنتهية اشتراكاتهم + مهلة 3 أيام قبل القطع
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch('/api/cron/radius-sync');
                        const data = await res.json();
                        if (data.success) {
                          alert(`✅ تمت المزامنة!\n\nتم فحص: ${data.results.checked}\nتم تعليق: ${data.results.suspended}\nفي المهلة: ${data.results.grace}\nتم إعادة تفعيل: ${data.results.reactivated}`);
                          await loadSubscribers();
                        } else {
                          alert('❌ ' + (data.error || 'فشل المزامنة'));
                        }
                      } catch (e) {
                        alert('❌ حدث خطأ');
                      }
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {loading ? '⏳ جاري...' : '🔄 تشغيل المزامنة'}
                  </button>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p>• <strong>الدافعين:</strong> الخدمة مفعلة</p>
                  <p>• <strong>المهلة (1-3 أيام):</strong> الخدمة مفعلة لكن مُعلّمة</p>
                  <p>• <strong>المنتهي (+3 أيام):</strong> الخدمة معطلة تلقائياً</p>
                </div>
              </div>

              {/* Recent Open Tickets */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>🎫 الشكاوى المفتوحة ({tickets.filter(t => t.status === 'open').length})</h3>
                <div className="space-y-2">
                  {tickets.filter(t => t.status === 'open').slice(0, 5).map(ticket => (
                    <div key={ticket.id} className={`p-3 rounded-lg ${darkMode ? 'bg-[#334155]' : 'bg-gray-50'} flex justify-between items-center`}>
                      <div>
                        <p className={`font-medium ${textClass}`}>{ticket.subject}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{ticket.name} - {ticket.phone}</p>
                      </div>
                      <button onClick={() => setSelectedTicket(ticket)} className="text-indigo-400 text-sm">عرض</button>
                    </div>
                  ))}
                  {tickets.filter(t => t.status === 'open').length === 0 && (
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>لا توجد شكاوى مفتوحة</p>
                  )}
                </div>
              </div>

              {/* قسم التنبيهات التلقائية */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>🔔 التنبيهات التلقائية</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      مشتركين ينتهي اشتراكهم خلال 3 أيام أو منتهية صلاحيتهم
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch('/api/cron/notifications');
                        const data = await res.json();
                        if (data.success) {
                          alert(`✅ تم فحص التنبيهات!\n\nالمنتهية صلاحيتهم خلال 3 أيام: ${data.summary.expiringIn3Days}\nالمنتهية صلاحيتهم: ${data.summary.expired}`);
                        }
                      } catch (e) {
                        alert('❌ حدث خطأ');
                      }
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading ? '⏳...' : '🔍 فحص التنبيهات'}
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900/30 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className="text-2xl mb-1">⚠️</p>
                    <p className={`text-xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {subscribers.filter(s => {
                        if (!s.expiryDate) return false;
                        const days = Math.ceil((new Date(s.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return days > 0 && days <= 3;
                      }).length}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ينتهي خلال 3 أيام</p>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                    <p className="text-2xl mb-1">🚨</p>
                    <p className={`text-xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {subscribers.filter(s => {
                        if (!s.expiryDate) return false;
                        return new Date(s.expiryDate) < new Date();
                      }).length}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>منتهي الصلاحية</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex gap-2 flex-1 min-w-0">
                    <input 
                      type="text" 
                      placeholder="بحث..." 
                      value={searchSubscriber} 
                      onChange={e => setSearchSubscriber(e.target.value)} 
                      className={`border p-2 rounded-lg flex-1 min-w-32 ${inputClass}`} 
                    />
                    <select 
                      value={filterStatus} 
                      onChange={e => setFilterStatus(e.target.value)} 
                      className={`border p-2 rounded-lg ${inputClass}`}
                    >
                      <option value="all">الكل</option>
                      <option value="active">نشط</option>
                      <option value="suspended">موقوف</option>
                    </select>
                    <select 
                      value={filterPaymentStatus} 
                      onChange={e => setFilterPaymentStatus(e.target.value)} 
                      className={`border p-2 rounded-lg ${inputClass}`}
                    >
                      <option value="all">كل الحالات</option>
                      <option value="paid">دافع</option>
                      <option value="grace_1day">مهلة يوم</option>
                      <option value="expired">منتهي</option>
                    </select>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleExportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">📥 تصدير</button>
                    <label className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                      📤 استيراد Excel
                      <input 
                        type="file" 
                        accept=".xlsx,.xls" 
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('type', 'subscribers');
                            try {
                              const res = await fetch('/api/import', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await res.json();
                              if (data.success) {
                                alert(`✅ ${data.message}\nنجاح: ${data.results.success}\nفشل: ${data.results.failed}`);
                                loadSubscribers();
                              } else {
                                alert('❌ ' + data.error);
                              }
                            } catch (err) {
                              alert('❌ حدث خطأ أثناء الاستيراد');
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <a href="/api/import?type=subscribers" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                      📄 قالب
                    </a>
                    <button 
                      onClick={() => { 
                        setShowSubscriberForm(true); 
                        setEditingSubscriber(null); 
                        setSubscriberForm({ status: 'active', balance: 0, monthlyFee: 0, paymentStatus: 'paid' }); 
                      }} 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      + إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Subscriber Form */}
              {showSubscriberForm && (
                <div className={`${cardClass} rounded-xl p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${textClass}`}>
                    {editingSubscriber ? 'تعديل' : 'إضافة'} مشترك
                  </h3>

                  {/* PPPoE Quick Select from MikroTik */}
                  {!editingSubscriber && pppoeUsers.filter(u => !u.subscriber).length > 0 && (
                    <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-[#334155]' : 'bg-gray-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className={`font-bold text-sm ${textClass}`}>🔌 اختيار من MikroTik</p>
                        <button 
                          onClick={loadPPPoEUsers}
                          className="text-indigo-400 text-xs"
                        >
                          🔄 تحديث
                        </button>
                      </div>
                      <select 
                        className={`w-full border p-2 rounded-lg ${inputClass}`}
                        onChange={(e) => {
                          if (e.target.value) {
                            const user = pppoeUsers.find(u => u.name === e.target.value);
                            if (user) {
                              setSubscriberForm({
                                ...subscriberForm,
                                pppoeUser: user.name,
                                pppoePassword: user.password || '',
                                plan: user.profile || subscriberForm.plan,
                              });
                            }
                          }
                        }}
                      >
                        <option value="">-- اختر حساب PPPoE من MikroTik --</option>
                        {pppoeUsers.filter(u => !u.subscriber).map(user => (
                          <option key={user.name} value={user.name}>
                            {user.name} {user.profile ? `(${user.profile})` : ''} {user.isOnline ? '🟢' : '⚫'}
                          </option>
                        ))}
                      </select>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {pppoeUsers.filter(u => !u.subscriber).length} حساب غير مربوط
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>الاسم الثلاثي *</label>
                      <input 
                        type="text" 
                        placeholder="أحمد محمد علي" 
                        value={subscriberForm.name || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, name: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>رقم الهاتف *</label>
                      <input 
                        type="text" 
                        placeholder="0999123456" 
                        value={subscriberForm.phone || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, phone: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>العنوان</label>
                      <input 
                        type="text" 
                        placeholder="الحي، الشارع" 
                        value={subscriberForm.address || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, address: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>الباقة</label>
                      <select 
                        value={subscriberForm.plan || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, plan: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`}
                      >
                        <option value="">اختر الباقة</option>
                        {PLANS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💰 سعر الباقة (ل.س)</label>
                      <input 
                        type="number" 
                        placeholder="50000" 
                        value={subscriberForm.monthlyFee || 0} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, monthlyFee: Number(e.target.value) })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💵 المبلغ المستحق (ل.س)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="0" 
                        value={subscriberForm.balance || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, balance: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>👤 اسم مستخدم PPPoE</label>
                      <input 
                        type="text" 
                        placeholder="user123" 
                        value={subscriberForm.pppoeUser || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, pppoeUser: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🔐 كلمة سر PPPoE</label>
                      <input 
                        type="text" 
                        placeholder="password123" 
                        value={subscriberForm.pppoePassword || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, pppoePassword: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💳 حالة الدفع</label>
                      <select 
                        value={subscriberForm.paymentStatus || 'paid'} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, paymentStatus: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`}
                      >
                        {PAYMENT_STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📊 حالة الحساب</label>
                      <select 
                        value={subscriberForm.status || 'active'} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, status: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`}
                      >
                        <option value="active">نشط</option>
                        <option value="suspended">موقوف</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className={`block text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📝 ملاحظات</label>
                      <textarea 
                        placeholder="أي ملاحظات إضافية..." 
                        value={subscriberForm.notes || ''} 
                        onChange={e => setSubscriberForm({ ...subscriberForm, notes: e.target.value })} 
                        className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={handleSaveSubscriber} 
                      disabled={loading} 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? '...' : (editingSubscriber ? 'تحديث' : 'إضافة')}
                    </button>
                    <button 
                      onClick={() => { setShowSubscriberForm(false); setEditingSubscriber(null); }} 
                      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Subscribers Table */}
              <div className={`${cardClass} rounded-xl overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-[#334155]' : 'bg-gray-50'}>
                      <tr>
                        <th className={`text-right p-3 ${textClass}`}>الاسم</th>
                        <th className={`text-right p-3 ${textClass}`}>الهاتف</th>
                        <th className={`text-right p-3 ${textClass}`}>الباقة</th>
                        <th className={`text-right p-3 ${textClass}`}>PPPoE</th>
                        <th className={`text-right p-3 ${textClass}`}>المستحق</th>
                        <th className={`text-right p-3 ${textClass}`}>الحالة</th>
                        <th className={`text-right p-3 ${textClass}`}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscribers.map(sub => (
                        <tr key={sub.id} className={`border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'}`}>
                          <td className={`p-3 ${textClass}`}>
                            <div className="font-medium">{sub.name}</div>
                            <div className="text-xs text-gray-400">{sub.address || '-'}</div>
                          </td>
                          <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{sub.phone}</td>
                          <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{sub.plan || '-'}</td>
                          <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="text-xs">
                              <div>U: {sub.pppoeUser || '-'}</div>
                              <div>P: {sub.pppoePassword || '-'}</div>
                            </div>
                          </td>
                          <td className={`p-3 font-bold ${(sub.balance || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {(sub.balance || 0).toLocaleString()} ل.س
                          </td>
                          <td className="p-3">{getPaymentStatusBadge(sub.paymentStatus)}</td>
                          <td className="p-3">
                            <div className="flex gap-1 flex-wrap">
                              <button onClick={() => setSelectedSubscriberDetails(sub)} className="text-sm bg-gray-50 text-gray-600 px-2 py-1 rounded" title="عرض">👁️</button>
                              {sub.paymentStatus === 'expired' && (
                                <button onClick={() => handleRenewSubscription(sub)} className="text-sm bg-green-50 text-green-600 px-2 py-1 rounded" title="تجديد">🔄</button>
                              )}
                              <button onClick={() => sendWhatsApp(sub.phone || '', `مرحباً ${sub.name}`)} className="text-sm bg-green-50 text-green-600 px-2 py-1 rounded" title="واتساب">💬</button>
                              <button onClick={() => printInvoice(sub)} className="text-sm bg-purple-50 text-purple-600 px-2 py-1 rounded" title="طباعة">🖨️</button>
                              <button onClick={() => handleEditSubscriber(sub)} className="text-sm bg-yellow-50 text-yellow-600 px-2 py-1 rounded" title="تعديل">✏️</button>
                              <button onClick={() => handleDeleteSubscriber(sub.id)} className="text-sm bg-red-50 text-red-600 px-2 py-1 rounded" title="حذف">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Subscriber Details Modal */}
          {selectedSubscriberDetails && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className={`${darkMode ? 'bg-[#1e293b] border border-[#475569]' : 'bg-white'} rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-bold ${textClass}`}>تفاصيل المشترك</h2>
                    <button onClick={() => setSelectedSubscriberDetails(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الاسم:</span>
                      <span className={`font-bold ${textClass}`}>{selectedSubscriberDetails.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الهاتف:</span>
                      <span className={textClass}>{selectedSubscriberDetails.phone}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>العنوان:</span>
                      <span className={textClass}>{selectedSubscriberDetails.address || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الباقة:</span>
                      <span className={textClass}>{selectedSubscriberDetails.plan || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>سعر الباقة:</span>
                      <span className={textClass}>{(selectedSubscriberDetails.monthlyFee || 0).toLocaleString()} ل.س</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الرصيد المستحق:</span>
                      <span className={`font-bold ${(selectedSubscriberDetails.balance || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {(selectedSubscriberDetails.balance || 0).toLocaleString()} ل.س
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>حساب PPPoE:</span>
                      <span className={`font-mono ${textClass}`}>{selectedSubscriberDetails.pppoeUser || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>كلمة سر PPPoE:</span>
                      <span className={`font-mono ${textClass}`}>{selectedSubscriberDetails.pppoePassword || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>حالة الدفع:</span>
                      {getPaymentStatusBadge(selectedSubscriberDetails.paymentStatus)}
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>ملاحظات:</span>
                      <span className={textClass}>{selectedSubscriberDetails.notes || '-'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleRenewSubscription(selectedSubscriberDetails)} className="flex-1 bg-green-600 text-white py-2 rounded-lg">🔄 تجديد</button>
                    <button onClick={() => { handleEditSubscriber(selectedSubscriberDetails); setSelectedSubscriberDetails(null); }} className={`flex-1 py-2 rounded-lg ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}>✏️ تعديل</button>
                    <button onClick={() => printInvoice(selectedSubscriberDetails)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">🖨️ طباعة</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debts Tab */}
          {activeTab === 'debts' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-lg font-bold ${textClass}`}>💰 إدارة الديون</h3>
                  <div className="flex gap-2">
                    <button onClick={handleExportDebtsCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">📥 تصدير</button>
                    <button onClick={() => { setShowDebtForm(true); setEditingDebt(null); setDebtForm({ amount: 0 }); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">+ إضافة</button>
                  </div>
                </div>
              </div>

              {/* Debt Form */}
              {showDebtForm && (
                <div className={`${cardClass} rounded-xl p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${textClass}`}>{editingDebt ? 'تعديل' : 'إضافة'} دين</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="الاسم *" 
                      value={debtForm.name || ''} 
                      onChange={e => setDebtForm({ ...debtForm, name: e.target.value })} 
                      className={`border p-2 rounded-lg ${inputClass}`} 
                    />
                    <input 
                      type="text" 
                      placeholder="الهاتف" 
                      value={debtForm.phone || ''} 
                      onChange={e => setDebtForm({ ...debtForm, phone: e.target.value })} 
                      className={`border p-2 rounded-lg ${inputClass}`} 
                    />
                    <input 
                      type="text" 
                      placeholder="العنوان" 
                      value={debtForm.address || ''} 
                      onChange={e => setDebtForm({ ...debtForm, address: e.target.value })} 
                      className={`border p-2 rounded-lg ${inputClass}`} 
                    />
                    <input 
                      type="number" 
                      placeholder="المبلغ (ل.س) *" 
                      value={debtForm.amount || 0} 
                      onChange={e => setDebtForm({ ...debtForm, amount: Number(e.target.value) })} 
                      className={`border p-2 rounded-lg ${inputClass}`} 
                    />
                    <textarea 
                      placeholder="سبب الاستدانة" 
                      value={debtForm.reason || ''} 
                      onChange={e => setDebtForm({ ...debtForm, reason: e.target.value })} 
                      className={`border p-2 rounded-lg md:col-span-2 ${inputClass}`} 
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleSaveDebt} disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                      {loading ? '...' : (editingDebt ? 'تحديث' : 'إضافة')}
                    </button>
                    <button onClick={() => { setShowDebtForm(false); setEditingDebt(null); }} className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}>إلغاء</button>
                  </div>
                </div>
              )}

              {/* Debts Table */}
              <div className={`${cardClass} rounded-xl overflow-hidden`}>
                <table className="w-full">
                  <thead className={darkMode ? 'bg-[#334155]' : 'bg-gray-50'}>
                    <tr>
                      <th className={`text-right p-3 ${textClass}`}>الاسم</th>
                      <th className={`text-right p-3 ${textClass}`}>الهاتف</th>
                      <th className={`text-right p-3 ${textClass}`}>العنوان</th>
                      <th className={`text-right p-3 ${textClass}`}>السبب</th>
                      <th className={`text-right p-3 ${textClass}`}>المبلغ</th>
                      <th className={`text-right p-3 ${textClass}`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debts.map(debt => (
                      <tr key={debt.id} className={`border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'}`}>
                        <td className={`p-3 ${textClass}`}>{debt.name}</td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{debt.phone || '-'}</td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{debt.address || '-'}</td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{debt.reason || '-'}</td>
                        <td className={`p-3 font-bold text-red-500`}>{debt.amount.toLocaleString()} ل.س</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleEditDebt(debt)} className="text-sm bg-yellow-50 text-yellow-600 px-2 py-1 rounded">✏️</button>
                            <button onClick={() => sendWhatsApp(debt.phone || '', `مرحباً ${debt.name}`)} className="text-sm bg-green-50 text-green-600 px-2 py-1 rounded">💬</button>
                            <button onClick={() => handleDeleteDebt(debt.id)} className="text-sm bg-red-50 text-red-600 px-2 py-1 rounded">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Header */}
              <div className={`${cardClass} rounded-xl p-4 flex justify-between items-center`}>
                <div>
                  <h3 className={`text-lg font-bold ${textClass}`}>📦 إدارة المخزون</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    راوتر • بقية العدة • أخرى
                  </p>
                </div>
                <div className="flex gap-2">
                  <label className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                    📤 استيراد
                    <input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('type', 'inventory');
                          try {
                            const res = await fetch('/api/import', {
                              method: 'POST',
                              body: formData,
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert(`✅ ${data.message}`);
                              loadInventory();
                            } else {
                              alert('❌ ' + data.error);
                            }
                          } catch (err) {
                            alert('❌ حدث خطأ');
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <a href="/api/import?type=inventory" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center">
                    📄 قالب
                  </a>
                  <button 
                    onClick={() => setShowInventoryForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + إضافة منتج
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${cardClass} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold text-indigo-400">{inventory.stats?.totalProducts || 0}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>المنتجات</p>
                </div>
                <div className={`${cardClass} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold text-green-400">{inventory.stats?.totalStock || 0}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إجمالي المخزون</p>
                </div>
                <div className={`${cardClass} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold text-yellow-400">{inventory.stats?.lowStock || 0}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>مخزون منخفض</p>
                </div>
                <div className={`${cardClass} rounded-xl p-4 text-center`}>
                  <p className="text-2xl font-bold text-cyan-400">{(inventory.stats?.totalValue || 0).toLocaleString()}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>القيمة (ل.س)</p>
                </div>
              </div>

              {/* Categories */}
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button 
                    onClick={() => setInventoryCategory('all')}
                    className={`px-4 py-2 rounded-lg text-sm ${inventoryCategory === 'all' ? 'bg-indigo-600 text-white' : darkMode ? 'bg-[#334155]' : 'bg-gray-100'}`}
                  >
                    الكل
                  </button>
                  {inventory.categories?.map((cat: any) => (
                    <button 
                      key={cat.id}
                      onClick={() => setInventoryCategory(cat.name)}
                      className={`px-4 py-2 rounded-lg text-sm ${inventoryCategory === cat.name ? 'bg-indigo-600 text-white' : darkMode ? 'bg-[#334155]' : 'bg-gray-100'}`}
                    >
                      {cat.icon} {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Table */}
              <div className={`${cardClass} rounded-xl overflow-hidden`}>
                <table className="w-full">
                  <thead className={darkMode ? 'bg-[#334155]' : 'bg-gray-50'}>
                    <tr>
                      <th className={`text-right p-3 ${textClass}`}>المنتج</th>
                      <th className={`text-right p-3 ${textClass}`}>التصنيف</th>
                      <th className={`text-right p-3 ${textClass}`}>الكمية</th>
                      <th className={`text-right p-3 ${textClass}`}>السعر</th>
                      <th className={`text-right p-3 ${textClass}`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inventory.products || [])
                      .filter((p: any) => inventoryCategory === 'all' || p.category === inventoryCategory)
                      .map((product: any) => (
                      <tr key={product.id} className={`border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'}`}>
                        <td className={`p-3 ${textClass}`}>
                          <p className="font-medium">{product.name}</p>
                          {product.quantity <= product.minStock && (
                            <span className="text-xs text-yellow-400">⚠️ مخزون منخفض</span>
                          )}
                        </td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.category}</td>
                        <td className={`p-3 ${product.quantity <= product.minStock ? 'text-yellow-400 font-bold' : textClass}`}>
                          {product.quantity}
                        </td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {(product.price || 0).toLocaleString()} ل.س
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                const qty = prompt('كمية الإدخال:');
                                if (qty) handleUpdateStock(product.id, 'in', parseInt(qty), 'إدخال');
                              }}
                              className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded"
                            >
                              ➕ إدخال
                            </button>
                            <button 
                              onClick={() => {
                                const qty = prompt('كمية الإخراج:');
                                const recipient = prompt('اسم المستلم:');
                                if (qty) handleUpdateStock(product.id, 'out', parseInt(qty), 'إخراج', recipient || undefined);
                              }}
                              className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded"
                            >
                              ➖ إخراج
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(inventory.products || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          لا توجد منتجات - أضف منتج جديد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recent Transactions */}
              {(inventory.transactions || []).length > 0 && (
                <div className={`${cardClass} rounded-xl p-4`}>
                  <h4 className={`font-bold mb-3 ${textClass}`}>📋 آخر الحركات</h4>
                  <div className="space-y-2">
                    {inventory.transactions.slice(0, 10).map((tx: any, i: number) => (
                      <div key={i} className={`flex justify-between items-center p-2 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-50'}`}>
                        <div>
                          <span className={tx.type === 'in' ? 'text-green-400' : 'text-orange-400'}>
                            {tx.type === 'in' ? '📥 إدخال' : '📤 إخراج'}
                          </span>
                          <span className={`mr-2 ${textClass}`}>{tx.productName || tx.name}</span>
                          {tx.recipient && <span className="text-xs text-gray-400 mr-2">({tx.recipient})</span>}
                        </div>
                        <span className={textClass}>{tx.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Product Form */}
              {showInventoryForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className={`${cardClass} rounded-xl p-6 w-full max-w-md`}>
                    <h3 className={`text-lg font-bold mb-4 ${textClass}`}>➕ إضافة منتج جديد</h3>
                    <div className="space-y-3">
                      <input 
                        type="text"
                        placeholder="اسم المنتج"
                        value={inventoryForm.name}
                        onChange={e => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                      <select 
                        value={inventoryForm.category}
                        onChange={e => setInventoryForm({ ...inventoryForm, category: e.target.value })}
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      >
                        <option value="راوتر">📡 راوتر</option>
                        <option value="بقية العدة">🔧 بقية العدة</option>
                        <option value="أخرى">📦 أخرى</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="الكمية"
                        value={inventoryForm.quantity}
                        onChange={e => setInventoryForm({ ...inventoryForm, quantity: parseInt(e.target.value) || 0 })}
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                      <input 
                        type="number"
                        placeholder="الحد الأدنى للمخزون"
                        value={inventoryForm.minStock}
                        onChange={e => setInventoryForm({ ...inventoryForm, minStock: parseInt(e.target.value) || 5 })}
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                      <input 
                        type="number"
                        placeholder="السعر (ل.س)"
                        value={inventoryForm.price}
                        onChange={e => setInventoryForm({ ...inventoryForm, price: parseInt(e.target.value) || 0 })}
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={handleAddInventoryProduct}
                        disabled={loadingInventory}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
                      >
                        {loadingInventory ? '...' : 'حفظ'}
                      </button>
                      <button 
                        onClick={() => setShowInventoryForm(false)}
                        className={`flex-1 py-3 rounded-lg ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'}`}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-4`}>
                <h3 className={`text-lg font-bold ${textClass}`}>🎫 إدارة الشكاوى</h3>
              </div>

              <div className={`${cardClass} rounded-xl overflow-hidden`}>
                <table className="w-full">
                  <thead className={darkMode ? 'bg-[#334155]' : 'bg-gray-50'}>
                    <tr>
                      <th className={`text-right p-3 ${textClass}`}>الاسم</th>
                      <th className={`text-right p-3 ${textClass}`}>الهاتف</th>
                      <th className={`text-right p-3 ${textClass}`}>الموضوع</th>
                      <th className={`text-right p-3 ${textClass}`}>الحالة</th>
                      <th className={`text-right p-3 ${textClass}`}>التاريخ</th>
                      <th className={`text-right p-3 ${textClass}`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className={`border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'}`}>
                        <td className={`p-3 ${textClass}`}>{ticket.name || '-'}</td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{ticket.phone || '-'}</td>
                        <td className={`p-3 ${textClass}`}>{ticket.subject}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {ticket.status === 'open' ? 'مفتوح' : 'مغلق'}
                          </span>
                        </td>
                        <td className={`p-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(ticket.createdAt).toLocaleDateString('ar')}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => setSelectedTicket(ticket)} className="text-sm bg-gray-50 text-gray-600 px-2 py-1 rounded">👁️</button>
                            <button onClick={() => printTicket(ticket)} className="text-sm bg-purple-50 text-purple-600 px-2 py-1 rounded">🖨️</button>
                            <button onClick={() => handleDeleteTicket(ticket.id)} className="text-sm bg-red-50 text-red-600 px-2 py-1 rounded">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ticket Details Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className={`${darkMode ? 'bg-[#1e293b] border border-[#475569]' : 'bg-white'} rounded-xl w-full max-w-lg shadow-2xl`}>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-bold ${textClass}`}>تفاصيل الشكوى</h2>
                    <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الاسم:</span>
                      <span className={textClass}>{selectedTicket.name || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الهاتف:</span>
                      <span className={textClass}>{selectedTicket.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الموضوع:</span>
                      <span className={`font-bold ${textClass}`}>{selectedTicket.subject}</span>
                    </div>
                    <div className="border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>التفاصيل:</span>
                      <p className={`mt-2 ${textClass}`}>{selectedTicket.description}</p>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الحالة:</span>
                      <span className={`px-2 py-1 rounded text-xs ${selectedTicket.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {selectedTicket.status === 'open' ? 'مفتوح' : 'مغلق'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>التاريخ:</span>
                      <span className={textClass}>{new Date(selectedTicket.createdAt).toLocaleDateString('ar')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {selectedTicket.status === 'open' && (
                      <button onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'closed')} className="flex-1 bg-green-600 text-white py-2 rounded-lg">✓ إغلاق</button>
                    )}
                    <button onClick={() => selectedTicket.phone && sendWhatsApp(selectedTicket.phone, 'شكراً لتواصلك مع Jaramana Net')} className={`flex-1 py-2 rounded-lg ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}>💬 واتساب</button>
                    <button onClick={() => printTicket(selectedTicket)} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">🖨️ طباعة</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>🔔 إرسال إشعار</h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  أرسل إشعارات لجميع المشتركين الذين فعّلوا الإشعارات على هواتفهم
                </p>
                <div className="space-y-4">
                  {/* اختيار المستلم */}
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🎯 إرسال إلى</label>
                    <select 
                      value={targetSubscriber}
                      onChange={e => setTargetSubscriber(e.target.value)}
                      className={`w-full border p-3 rounded-lg ${inputClass}`}
                    >
                      <option value="all">📢 جميع المشتركين</option>
                      <optgroup label="👤 مشترك محدد:">
                        {subscribers
                          .filter(s => s.phone && (s.name?.toLowerCase().includes(searchSubscribers.toLowerCase()) || s.phone.includes(searchSubscribers)))
                          .slice(0, 50)
                          .map(s => (
                            <option key={s.id} value={s.phone}>
                              {s.name} - {s.phone}
                            </option>
                          ))
                        }
                      </optgroup>
                    </select>
                    {targetSubscriber !== 'all' && (
                      <input 
                        type="text" 
                        placeholder="🔍 ابحث عن مشترك..."
                        value={searchSubscribers}
                        onChange={e => setSearchSubscribers(e.target.value)}
                        className={`w-full border p-2 rounded-lg mt-2 text-sm ${inputClass}`}
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>عنوان الإشعار</label>
                    <input 
                      type="text" 
                      placeholder="مثال: تنبيه هام"
                      value={notificationForm.title} 
                      onChange={e => setNotificationForm({ ...notificationForm, title: e.target.value })} 
                      className={`w-full border p-3 rounded-lg ${inputClass}`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>نص الرسالة</label>
                    <textarea 
                      placeholder="مثال: سيتم صيانة الشبكة غداً من الساعة 10 صباحاً"
                      value={notificationForm.message} 
                      onChange={e => setNotificationForm({ ...notificationForm, message: e.target.value })} 
                      className={`w-full border p-3 rounded-lg h-24 ${inputClass}`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>رابط (اختياري)</label>
                    <input 
                      type="text" 
                      placeholder="https://jaramanaramzy.vercel.app"
                      value={notificationForm.url} 
                      onChange={e => setNotificationForm({ ...notificationForm, url: e.target.value })} 
                      className={`w-full border p-3 rounded-lg ${inputClass}`} 
                    />
                  </div>
                  <button 
                    onClick={handleSendNotification}
                    disabled={sendingNotification}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                  >
                    {sendingNotification ? '⏳ جاري الإرسال...' : `🔔 إرسال ${targetSubscriber === 'all' ? 'للجميع' : 'للمشترك المحدد'}`}
                  </button>
                </div>
              </div>
              
              {/* Quick Notifications */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>⚡ إشعارات سريعة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button 
                    onClick={() => {
                      setNotificationForm({ title: 'تنبيه صيانة', message: 'سيتم إجراء صيانة للشبكة قريباً', url: '' });
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    🔧 صيانة
                  </button>
                  <button 
                    onClick={() => {
                      setNotificationForm({ title: 'عرض خاص!', message: 'لقد أضفنا عروضاً جديدة على الباقات', url: '' });
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    🎁 عرض جديد
                  </button>
                  <button 
                    onClick={() => {
                      setNotificationForm({ title: 'تذكير بالدفع', message: 'يرجى تسديد فاتورة الاشتراك قبل انتهاء المدة', url: '' });
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    💳 تذكير دفع
                  </button>
                  <button 
                    onClick={() => {
                      setNotificationForm({ title: 'تحديث النظام', message: 'تم تحديث النظام بإضافات جديدة', url: '' });
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    🔄 تحديث
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className={`${cardClass} rounded-xl p-6 text-center`}>
                  <p className="text-4xl mb-2">👥</p>
                  <p className={`text-3xl font-bold ${textClass}`}>{subscribers.length}</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>إجمالي المشتركين</p>
                </div>
                <div className={`${cardClass} rounded-xl p-6 text-center`}>
                  <p className="text-4xl mb-2">💰</p>
                  <p className={`text-3xl font-bold text-green-400`}>{totalRevenue.toLocaleString()}</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>الإيرادات الشهرية (ل.س)</p>
                </div>
                <div className={`${cardClass} rounded-xl p-6 text-center`}>
                  <p className="text-4xl mb-2">📉</p>
                  <p className={`text-3xl font-bold text-red-400`}>{totalBalance.toLocaleString()}</p>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>المستحقات (ل.س)</p>
                </div>
              </div>
              
              {/* تصدير التقارير */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📊 تصدير التقارير</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <button 
                    onClick={handleExportCSV}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-4 rounded-lg text-center`}
                  >
                    📄 تصدير المشتركين CSV
                  </button>
                  <button 
                    onClick={handleExportDebtsCSV}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-4 rounded-lg text-center`}
                  >
                    💰 تصدير الديون CSV
                  </button>
                  <button 
                    onClick={() => {
                      const data = {
                        exportDate: new Date().toISOString(),
                        subscribers: subscribers,
                        debts: debts,
                        settings: { ...settings, adminPassword: '***', adminPin: '***' }
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `jaramana-backup-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg text-center font-bold"
                  >
                    💾 نسخ احتياطي كامل
                  </button>
                </div>
              </div>
              
              {/* إحصائيات الباقات */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📈 إحصائيات الباقات</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {PLANS.slice(0, 8).map(plan => {
                    const count = subscribers.filter(s => s.plan === plan.value).length;
                    return (
                      <div key={plan.value} className={`${darkMode ? 'bg-[#334155]' : 'bg-gray-100'} p-3 rounded-lg text-center`}>
                        <p className={`text-lg font-bold ${textClass}`}>{count}</p>
                        <p className="text-xs text-gray-400">{plan.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Monitor Tab - مراقبة السيرفر */}
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>🔧 مراقبة السيرفرات</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Ping تلقائي كل دقيقة ومراقبة حالة الاتصال
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const res = await fetch('/api/server-monitor');
                        const data = await res.json();
                        if (data.servers) {
                          alert(`✅ تم فحص ${data.totalChecks} سيرفر\n\nمتصل: ${data.onlineServers}\nغير متصل: ${data.offlineServers}\nنسبة الاتصال: ${data.totalUptime.toFixed(1)}%`);
                        }
                      } catch (e) {
                        alert('❌ حدث خطأ');
                      }
                      setLoading(false);
                    }}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {loading ? '⏳ جاري الفحص...' : '🔍 فحص الآن'}
                  </button>
                </div>
              </div>

              {/* حالة السيرفرات */}
              <div className="grid md:grid-cols-2 gap-4">
                {mikrotikDevices.map(device => (
                  <div key={device.id} className={`${cardClass} rounded-xl p-4`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className={`font-bold ${textClass}`}>{device.name}</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{device.host}:{device.port}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${device.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {device.isActive ? '🟢 متصل' : '🔴 غير متصل'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/server-monitor', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                deviceId: device.id,
                                deviceName: device.name,
                                message: `السيرفر ${device.name} غير متصل!`
                              })
                            });
                            alert('✅ تم إرسال تنبيه للأدمن');
                          } catch (e) {
                            alert('❌ حدث خطأ');
                          }
                        }}
                        className="flex-1 bg-red-500/20 text-red-400 py-2 rounded text-sm"
                      >
                        🚨 إرسال تنبيه
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* سجل الأحداث */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📋 سجل الأحداث</h3>
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>سيتم عرض سجل الأحداث هنا بعد إنشاء جدول ActivityLog في Supabase</p>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp Tab - رسائل WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>💬 إرسال رسائل WhatsApp</h3>
                
                {/* قوالب الرسائل */}
                <div className="mb-6">
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>قوالب جاهزة</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { id: 'renewal_reminder', label: 'تذكير تجديد', icon: '⏰' },
                      { id: 'subscription_expired', label: 'انتهاء اشتراك', icon: '🚫' },
                      { id: 'payment_confirmation', label: 'تأكيد دفع', icon: '✅' },
                      { id: 'welcome', label: 'ترحيب', icon: '👋' },
                      { id: 'maintenance', label: 'صيانة', icon: '🔧' },
                      { id: 'offer', label: 'عرض خاص', icon: '🎁' },
                      { id: 'debt_reminder', label: 'تذكير دين', icon: '💰' },
                    ].map(template => (
                      <button 
                        key={template.id}
                        onClick={async () => {
                          const res = await fetch('/api/whatsapp?action=templates');
                          const data = await res.json();
                          const t = data.templates.find((tt: any) => tt.id === template.id);
                          if (t) {
                            setNotificationForm({ ...notificationForm, message: t.template });
                          }
                        }}
                        className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                      >
                        <span className="text-lg">{template.icon}</span>
                        <p className="text-xs mt-1">{template.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* إرسال لفئة معينة */}
                <div className="mb-4">
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>إرسال إلى</label>
                  <select className={`w-full border p-3 rounded-lg ${inputClass}`}>
                    <option value="all">📢 جميع المشتركين</option>
                    <option value="expired">🚫 المنتهية صلاحيتهم</option>
                    <option value="expiring">⏰ ينتهي خلال 3 أيام</option>
                    <option value="paid">✅ الدافعين</option>
                  </select>
                </div>

                {/* نص الرسالة */}
                <div className="mb-4">
                  <label className={`block text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>نص الرسالة</label>
                  <textarea 
                    value={notificationForm.message}
                    onChange={e => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    className={`w-full border p-3 rounded-lg h-32 ${inputClass}`}
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                <button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const res = await fetch('/api/whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          category: 'all',
                          message: notificationForm.message,
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(`✅ ${data.message}`);
                      }
                    } catch (e) {
                      alert('❌ حدث خطأ');
                    }
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? '⏳ جاري الإرسال...' : '💬 إرسال رسائل WhatsApp'}
                </button>
              </div>

              {/* سجل الرسائل */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📋 سجل الرسائل المرسلة</h3>
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>سيتم عرض سجل الرسائل هنا</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab - إدارة المستخدمين */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>👤 إدارة المستخدمين</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      صلاحيات: Admin, Accountant, Support
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      const username = prompt('اسم المستخدم:');
                      const password = prompt('كلمة السر:');
                      const name = prompt('الاسم الكامل:');
                      const role = prompt('الدور (admin/accountant/support):');
                      
                      if (username && password && name && role) {
                        try {
                          const res = await fetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username, password, name, role }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            alert('✅ تم إنشاء المستخدم بنجاح');
                          } else {
                            alert('❌ ' + data.error);
                          }
                        } catch (e) {
                          alert('❌ حدث خطأ');
                        }
                      }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + إضافة مستخدم
                  </button>
                </div>
              </div>

              {/* جدول المستخدمين */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📋 قائمة المستخدمين</h3>
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>سيتم عرض المستخدمين هنا بعد إنشاء جدول User في Supabase</p>
                  <p className="text-xs mt-2">الأدوار المتاحة:</p>
                  <div className="flex justify-center gap-4 mt-2">
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Admin - صلاحيات كاملة</span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Accountant - محاسب</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Support - دعم فني</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MikroTik Tab */}
          {activeTab === 'mikrotik' && (
            <div className="space-y-4">
              {/* Header with Add Button */}
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>📡 سيرفرات MikroTik</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      إدارة سيرفرات MikroTik المتصلة ({mikrotikDevices.length} سيرفر)
                    </p>
                  </div>
                  <button 
                    onClick={() => { 
                      setShowDeviceForm(true); 
                      setEditingDevice(null); 
                      setDeviceForm({ name: '', host: '', port: 8728, username: '', password: '', isDefault: false, isActive: true }); 
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    + إضافة سيرفر جديد
                  </button>
                </div>
              </div>

              {/* Device Form */}
              {showDeviceForm && (
                <div className={`${cardClass} rounded-xl p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${textClass}`}>
                    {editingDevice ? '✏️ تعديل السيرفر' : '➕ إضافة سيرفر جديد'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>اسم السيرفر *</label>
                      <input 
                        type="text" 
                        value={deviceForm.name}
                        onChange={e => setDeviceForm({ ...deviceForm, name: e.target.value })}
                        placeholder="مثال: السيرفر الرئيسي"
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>IP أو DDNS *</label>
                      <input 
                        type="text" 
                        value={deviceForm.host}
                        onChange={e => setDeviceForm({ ...deviceForm, host: e.target.value })}
                        placeholder="example.ddns.net أو 192.168.1.1"
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Port</label>
                      <input 
                        type="number" 
                        value={deviceForm.port}
                        onChange={e => setDeviceForm({ ...deviceForm, port: Number(e.target.value) })}
                        placeholder="8728"
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
                      <input 
                        type="text" 
                        value={deviceForm.username}
                        onChange={e => setDeviceForm({ ...deviceForm, username: e.target.value })}
                        placeholder="admin"
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                      <input 
                        type="password" 
                        value={deviceForm.password}
                        onChange={e => setDeviceForm({ ...deviceForm, password: e.target.value })}
                        placeholder="كلمة السر"
                        className={`w-full border p-3 rounded-lg ${inputClass}`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={handleSaveDevice}
                      disabled={loading}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
                    >
                      {loading ? '...' : (editingDevice ? '💾 تحديث' : '💾 حفظ')}
                    </button>
                    <button 
                      onClick={() => { setShowDeviceForm(false); setEditingDevice(null); }}
                      className={`${darkMode ? 'bg-[#334155]' : 'bg-gray-100'} px-6 py-3 rounded-lg`}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Devices List */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>📋 قائمة السيرفرات</h3>
                
                {mikrotikDevices.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-4xl mb-2">📡</p>
                    <p>لا توجد سيرفرات مضافة</p>
                    <p className="text-sm">اضغط على "إضافة سيرفر جديد" للبدء</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mikrotikDevices.map(device => (
                      <div 
                        key={device.id} 
                        className={`${darkMode ? 'bg-[#334155] border-[#475569]' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3">
                          {/* Device Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-bold ${textClass}`}>{device.name}</h4>
                              {device.isDefault && (
                                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">افتراضي</span>
                              )}
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              🌐 {device.host}:{device.port}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              👤 {device.username}
                            </p>
                          </div>
                          
                          {/* Connection Status */}
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              device.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${device.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {device.isActive ? 'متصل' : 'غير متصل'}
                            </span>
                            {deviceConnectionStatus[device.id!] && (
                              <span className={`text-xs ${deviceConnectionStatus[device.id!].connected ? 'text-green-400' : 'text-red-400'}`}>
                                {deviceConnectionStatus[device.id!].message}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
                          <button 
                            onClick={() => handleTestDeviceConnection(device)}
                            className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded"
                          >
                            🔌 اختبار الاتصال
                          </button>
                          {!device.isDefault && (
                            <button 
                              onClick={() => handleSetDefaultDevice(device.id!)}
                              className="text-sm bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded"
                            >
                              ⭐ تعيين كافتراضي
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditDevice(device)}
                            className="text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded"
                          >
                            ✏️ تعديل
                          </button>
                          <button 
                            onClick={() => handleDeleteDevice(device.id!)}
                            className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* معلومات DDNS */}
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>🌐 إعداد DDNS (للـ IP المتغير)</h3>
                <div className={`${darkMode ? 'bg-[#334155]' : 'bg-gray-100'} p-4 rounded-lg text-sm space-y-2`}>
                  <p className={textClass}><strong>1.</strong> سجل في <a href="https://www.noip.com" target="_blank" className="text-indigo-400">No-IP</a></p>
                  <p className={textClass}><strong>2.</strong> أنشئ Host جديد: <code className="bg-black/20 px-2 py-1 rounded">jaramana.ddns.net</code></p>
                  <p className={textClass}><strong>3.</strong> على MikroTik:</p>
                  <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
{`/tool dns-update name=jaramana.ddns.net \\
  address=127.0.0.255 \\
  key-name=YOUR_NOIP_USER \\
  key=YOUR_NOIP_PASSWORD`}
                  </pre>
                  <p className={textClass}><strong>4.</strong> تأكد من فتح Port 8728 في Firewall</p>
                </div>
              </div>
            </div>
          )}

          {/* PPPoE Users Tab */}
          {activeTab === 'pppoe' && (
            <div className="space-y-4">
              {/* Header */}
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className={`text-lg font-bold ${textClass}`}>🔌 مستخدمي PPPoE</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      من MikroTik - الإجمالي: {pppoeStats.total} | 
                      <span className="text-green-500"> متصل: {pppoeStats.online}</span> | 
                      <span className="text-red-500"> غير متصل: {pppoeStats.offline}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        const username = prompt('اسم المستخدم الجديد:');
                        const password = prompt('كلمة السر:');
                        const profile = prompt('الـ Profile (مثال: default, 5m, 10m):');
                        
                        if (username && password) {
                          try {
                            const res = await fetch('/api/mikrotik/pppoe', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'create',
                                username,
                                password,
                                profile: profile || 'default',
                              }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert('✅ ' + data.message);
                              loadPPPoEUsers();
                            } else {
                              alert('❌ ' + data.error);
                            }
                          } catch (e) {
                            alert('❌ حدث خطأ');
                          }
                        }
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      + إنشاء حساب
                    </button>
                    <button 
                      onClick={loadPPPoEUsers}
                      disabled={loadingPPPoE}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                    >
                      {loadingPPPoE ? '⏳ جاري التحميل...' : '🔄 تحديث'}
                    </button>
                  </div>
                </div>
              </div>

              {/* إجراءات PPPoE سريعة */}
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button 
                    onClick={async () => {
                      const username = prompt('اسم المستخدم لإعادة تعيين كلمة السر:');
                      if (username) {
                        const res = await fetch('/api/mikrotik/pppoe', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'reset-password', username }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`✅ ${data.message}\nكلمة السر الجديدة: ${data.newPassword}`);
                        } else {
                          alert('❌ ' + data.error);
                        }
                      }
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    🔑 إعادة تعيين كلمة سر
                  </button>
                  <button 
                    onClick={async () => {
                      const username = prompt('اسم المستخدم للاستنساخ:');
                      const newUsername = prompt('اسم المستخدم الجديد:');
                      if (username && newUsername) {
                        const res = await fetch('/api/mikrotik/pppoe', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'clone', username, newUsername }),
                        });
                        const data = await res.json();
                        alert(data.success ? '✅ ' + data.message : '❌ ' + data.error);
                      }
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    📋 استنساخ حساب
                  </button>
                  <button 
                    onClick={async () => {
                      const username = prompt('اسم المستخدم للحذف:');
                      if (username && confirm(`هل أنت متأكد من حذف حساب ${username}؟`)) {
                        const res = await fetch('/api/mikrotik/pppoe', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'delete', username }),
                        });
                        const data = await res.json();
                        alert(data.success ? '✅ ' + data.message : '❌ ' + data.error);
                        if (data.success) loadPPPoEUsers();
                      }
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center text-red-400`}
                  >
                    🗑️ حذف حساب
                  </button>
                  <button 
                    onClick={async () => {
                      const res = await fetch('/api/mikrotik/pppoe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'get-profiles' }),
                      });
                      const data = await res.json();
                      if (data.profiles) {
                        alert('📋 الـ Profiles المتاحة:\n\n' + data.profiles.map((p: any) => `${p.name} (${p.rateLimit || 'بدون تحديد سرعة'})`).join('\n'));
                      }
                    }}
                    className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} p-3 rounded-lg text-center`}
                  >
                    📊 عرض Profiles
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className={`${cardClass} rounded-xl p-4`}>
                <div className="flex flex-wrap gap-4 items-center">
                  <input 
                    type="text"
                    placeholder="بحث..."
                    value={pppoeSearch}
                    onChange={e => setPppoeSearch(e.target.value)}
                    className={`flex-1 min-w-[200px] border p-2 rounded-lg ${inputClass}`}
                  />
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'online', label: 'متصل' },
                      { id: 'offline', label: 'غير متصل' },
                      { id: 'unlinked', label: 'غير مربوط' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setPppoeFilter(f.id as any)}
                        className={`px-3 py-2 rounded-lg text-sm ${pppoeFilter === f.id ? 'bg-indigo-600 text-white' : darkMode ? 'bg-[#334155]' : 'bg-gray-100'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Users List */}
              <div className={`${cardClass} rounded-xl p-4`}>
                {pppoeUsers.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p className="text-4xl mb-2">🔌</p>
                    <p>اضغط "تحديث" لجلب مستخدمي PPPoE من MikroTik</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-bold pb-2 border-b border-gray-700">
                      <div className="col-span-2">المستخدم</div>
                      <div className="col-span-2">الزبون المربوط</div>
                      <div className="col-span-2">الحالة والجلسة</div>
                      <div className="col-span-2">السرعة</div>
                      <div className="col-span-1">البيانات</div>
                      <div className="col-span-3">إجراءات</div>
                    </div>
                    {filteredPPPoEUsers.map((user, idx) => (
                      <div 
                        key={idx}
                        className={`grid grid-cols-12 gap-2 text-sm py-3 border-b border-gray-800 items-center ${darkMode ? 'hover:bg-[#334155]' : 'hover:bg-gray-50'}`}
                      >
                        <div className="col-span-2">
                          <p className={`font-bold ${textClass}`}>{user.name}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>••••••••</p>
                        </div>
                        <div className="col-span-2">
                          {user.subscriber ? (
                            <div>
                              <p className={`font-bold text-green-400`}>{user.subscriber.name}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{user.subscriber.phone}</p>
                            </div>
                          ) : (
                            <span className="text-yellow-500 text-xs">غير مربوط</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          {user.disabled ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">🚫 معطل</span>
                          ) : user.isOnline ? (
                            <div>
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">🟢 متصل</span>
                              {user.session?.uptime && (
                                <p className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ⏱️ {parseUptime(user.session.uptime)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">⚫ غير متصل</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          {pppoeProfiles.length > 0 ? (
                            <select 
                              value={user.profile || 'default'}
                              onChange={(e) => handleChangeProfile(user.name, e.target.value)}
                              className={`text-xs p-1 rounded w-full ${darkMode ? 'bg-[#334155] text-white' : 'bg-gray-100'}`}
                            >
                              {pppoeProfiles.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : (
                            <p className={textClass}>{user.profile || 'default'}</p>
                          )}
                          {user.rateLimit && (
                            <p className={`text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              📊 {user.rateLimit}
                            </p>
                          )}
                        </div>
                        <div className="col-span-1">
                          {user.session && (
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <p title="تحميل">⬇️ {formatBytes(user.session.bytesIn)}</p>
                              <p title="رفع">⬆️ {formatBytes(user.session.bytesOut)}</p>
                            </div>
                          )}
                        </div>
                        <div className="col-span-3 flex flex-wrap gap-1">
                          {user.isOnline && (
                            <button 
                              onClick={() => handlePPPoEAction('disconnect', user.name)}
                              className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs"
                            >
                              قطع
                            </button>
                          )}
                          {user.disabled ? (
                            <button 
                              onClick={() => handlePPPoEAction('enable', user.name)}
                              className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs"
                            >
                              تفعيل
                            </button>
                          ) : (
                            <button 
                              onClick={() => handlePPPoEAction('disable', user.name)}
                              className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs"
                            >
                              تعطيل
                            </button>
                          )}
                          {user.subscriber ? (
                            <button 
                              onClick={() => handleUnlinkPPPoE(user.subscriber.id)}
                              className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs"
                            >
                              فك الربط
                            </button>
                          ) : (
                            <select 
                              className={`text-xs p-1 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-100'}`}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleLinkPPPoE(user.name, parseInt(e.target.value));
                                }
                              }}
                            >
                              <option value="">ربط بزبون...</option>
                              {subscribers.filter(s => !s.pppoeUser).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className={`${cardClass} rounded-xl p-6`}>
                <h3 className={`text-lg font-bold mb-4 ${textClass}`}>⚙️ الإعدادات</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>كلمة مرور الأدمن</label>
                    <input 
                      type="text" 
                      value={settings.adminPassword} 
                      onChange={e => setSettings({ ...settings, adminPassword: e.target.value })} 
                      className={`w-full border p-2 rounded-lg ${inputClass}`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>PIN</label>
                    <input 
                      type="text" 
                      value={settings.adminPin} 
                      onChange={e => setSettings({ ...settings, adminPin: e.target.value })} 
                      className={`w-full border p-2 rounded-lg ${inputClass}`} 
                      maxLength={4} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>اسم الدعم 1</label>
                    <input 
                      type="text" 
                      value={settings.supportName1} 
                      onChange={e => setSettings({ ...settings, supportName1: e.target.value })} 
                      className={`w-full border p-2 rounded-lg ${inputClass}`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>رقم الدعم 1</label>
                    <input 
                      type="text" 
                      value={settings.supportPhone1} 
                      onChange={e => setSettings({ ...settings, supportPhone1: e.target.value })} 
                      className={`w-full border p-2 rounded-lg ${inputClass}`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>اسم الدعم 2</label>
                    <input 
                      type="text" 
                      value={settings.supportName2} 
                      onChange={e => setSettings({ ...settings, supportName2: e.target.value })} 
                      className={`w-full border p-2 rounded-lg ${inputClass}`} 
                    />
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>رقم الدعم 2</label>
                    <input 
                      type="text" 
                      value={settings.supportPhone2} 
                      onChange={e => setSettings({ ...settings, supportPhone2: e.target.value })} 
                      className={`w-full border p-2 rounded-lg ${inputClass}`} 
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg"
                >
                  💾 حفظ الإعدادات
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-[#1e293b] border-t border-[#334155]' : 'bg-white shadow'} py-4 mt-8`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            جميع الحقوق محفوظة © Eng Ramzy Company 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
