'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  UserPlus,
  FileText,
  Users,
  LogOut,
  LogIn,
  Trash2,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  Shield,
  Wifi,
  WifiOff,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings,
  Save,
  AlertTriangle,
  Box,
  Layers,
  MessageCircle,
  Bell,
  Ticket,
  BarChart3,
  Download,
  Upload,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Server,
  RefreshCw,
  EthernetPort,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

// Types
interface Invoice {
  id: number;
  subscriberId: number;
  month: string;
  amount: number;
  isPaid: boolean;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  subscriber?: Subscriber;
}

interface Subscriber {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  monthlyFee: number;
  isActive: boolean;
  createdAt: string;
  invoices?: Invoice[];
  // Network fields
  pppoeUser?: string | null;
  pppoePassword?: string | null;
  ipAddress?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  macAddress?: string | null;
  mikrotikDeviceId?: number | null;
  // Service control
  graceDays?: number;
  serviceStatus?: string;
  suspendedAt?: string | null;
  // Subscription
  expiryDate?: string | null;
  lastRenewedAt?: string | null;
}

interface NetworkStatus {
  isOnline: boolean;
  ipAddress?: string;
  uptime?: string;
  uptimeFormatted?: string;
  bytesIn?: number;
  bytesOut?: number;
  bytesInFormatted?: string;
  bytesOutFormatted?: string;
  totalUsage?: string;
  lastSeen?: string | null;
}

interface SearchResult {
  subscriber: Subscriber;
  totalDue: number;
  networkStatus?: NetworkStatus | null;
}

interface ProductCategory {
  id: number;
  name: string;
  nameEn: string | null;
  description: string | null;
  _count?: { products: number };
}

interface Product {
  id: number;
  name: string;
  categoryId: number;
  category: ProductCategory;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
  notes: string | null;
  _count?: { transactions: number };
}

interface InventoryTransaction {
  id: number;
  productId: number;
  product: Product;
  type: string;
  quantity: number;
  reason: string | null;
  recipient: string | null;
  supplier: string | null;
  price: number | null;
  notes: string | null;
  date: string;
}

interface Ticket {
  id: number;
  subscriberId: number | null;
  subscriber?: { name: string; phone: string } | null;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  response: string | null;
  respondedAt: string | null;
  createdAt: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface MikroTikDevice {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  isDefault: boolean;
  isActive: boolean;
}

interface NetworkStatus {
  totalSubscribers: number;
  online: number;
  offline: number;
  activeUsers: Array<{
    name: string;
    address: string;
    uptime: string;
    uptimeSeconds: number;
    bytesIn: number;
    bytesOut: number;
    bytesInFormatted: string;
    bytesOutFormatted: string;
    deviceId: number;
    deviceName: string;
  }>;
  devices?: Array<{
    id: number;
    name: string;
    host: string;
    isDefault: boolean;
    online: number;
  }>;
}

interface Settings {
  adminUsername: string;
  adminPassword: string;
  adminPin: string;
  companyName: string;
  companySlogan: string;
  supportPhone1: string;
  supportPhone2: string;
  supportName1: string;
  supportName2: string;
}

interface Stats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalRevenue: number;
  totalDue: number;
}

export default function Home() {
  // Prevent SSR issues
  const [mounted, setMounted] = useState(false);

  // Auth State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    adminUsername: 'admin',
    adminPassword: 'admin12344321',
    adminPin: '1234',
    companyName: 'جرمانا نت',
    companySlogan: 'اختيارك الأفضل - الإنترنت الأفضل في جرمانا',
    supportPhone1: '0992417870',
    supportPhone2: '0959128944',
    supportName1: 'Ghasan',
    supportName2: 'Ramzy',
  });

  // Data States
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalRevenue: 0,
    totalDue: 0,
  });

  // UI States
  const [searchName, setSearchName] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);

  // General Search
  const [generalSearch, setGeneralSearch] = useState('');
  const [generalSearchResults, setGeneralSearchResults] = useState<{
    subscribers: Subscriber[];
    invoices: Invoice[];
  } | null>(null);

  // Network Search
  const [networkSearch, setNetworkSearch] = useState('');

  // Inventory Quick Add
  const [showQuickInventory, setShowQuickInventory] = useState(false);
  const [quickInventoryMode, setQuickInventoryMode] = useState<'add-product' | 'stock-in' | 'stock-out'>('add-product');

  // Form States
  const [newSubscriber, setNewSubscriber] = useState({
    name: '',
    phone: '',
    address: '',
    monthlyFee: 0,
    pppoeUser: '',
    pppoePassword: '',
    ipAddress: '',
    graceDays: 0,
  });

  const [editSubscriber, setEditSubscriber] = useState<Subscriber | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    subscriberId: 0,
    month: '',
    amount: 0,
    notes: '',
  });

  const [invoiceSubscriberId, setInvoiceSubscriberId] = useState<number | null>(null);

  // Inventory Form States
  const [newCategory, setNewCategory] = useState({ name: '', nameEn: '', description: '' });
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: 0,
    unit: 'قطعة',
    currentStock: 0,
    minStock: 5,
    price: 0,
    notes: '',
  });
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    productId: 0,
    type: 'in',
    quantity: 1,
    reason: '',
    recipient: '',
    supplier: '',
    price: 0,
    notes: '',
  });

  // Network Monitoring States
  const [mikrotikDevices, setMikrotikDevices] = useState<MikroTikDevice[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [showMikrotikDialog, setShowMikrotikDialog] = useState(false);
  const [newMikrotik, setNewMikrotik] = useState({
    name: '',
    host: '',
    port: 8728,
    username: '',
    password: '',
    isDefault: true,
  });
  
  // Import States
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    total: number;
    newUsers: Array<{ name: string; profile: string; remoteAddress?: string; disabled: boolean }>;
    existingUsers: Array<{ name: string; alreadyImported: boolean }>;
    profiles: string[];
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedImportUsers, setSelectedImportUsers] = useState<string[]>([]);
  const [importAllUsers, setImportAllUsers] = useState(true);
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState(0);
  const [selectedImportDevice, setSelectedImportDevice] = useState<number | null>(null);

  // Ticket Form
  const [newTicket, setNewTicket] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'normal',
  });

  // Settings Form
  const [settingsForm, setSettingsForm] = useState<Settings>(settings);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  // Fetch data when admin mode changes
  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  // Update settingsForm when settings change
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Calculate stats when data changes
  useEffect(() => {
    if (subscribers.length > 0 || invoices.length > 0) {
      const totalSubscribers = subscribers.length;
      const activeSubscribers = subscribers.filter(s => s.isActive).length;
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(i => i.isPaid).length;
      const unpaidInvoices = invoices.filter(i => !i.isPaid).length;
      const totalRevenue = invoices.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
      const totalDue = invoices.filter(i => !i.isPaid).reduce((sum, i) => sum + i.amount, 0);

      setStats({
        totalSubscribers,
        activeSubscribers,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        totalRevenue,
        totalDue,
      });
    }
  }, [subscribers, invoices]);

  const fetchAllData = async () => {
    setFetchLoading(true);
    setFetchError('');
    try {
      await Promise.all([
        fetchSubscribers(),
        fetchInvoices(),
        fetchCategories(),
        fetchProducts(),
        fetchInventoryTransactions(),
        fetchTickets(),
        fetchNotifications(),
        fetchMikrotikDevices(),
      ]);
      fetchNetworkStatus();
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchError('حدث خطأ أثناء تحميل البيانات. يرجى تحديث الصفحة.');
    } finally {
      setFetchLoading(false);
    }
  };

  // API Functions
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/subscribers');
      const data = await res.json();
      setSubscribers(data);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInventoryTransactions = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setInventoryTransactions(data);
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unread=true');
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Network Monitoring Functions
  const fetchMikrotikDevices = async () => {
    try {
      const res = await fetch('/api/mikrotik');
      const data = await res.json();
      if (!data.needsSetup) {
        setMikrotikDevices(data);
      }
    } catch (error) {
      console.error('Error fetching MikroTik devices:', error);
    }
  };

  const fetchNetworkStatus = async () => {
    setNetworkLoading(true);
    setNetworkError('');
    try {
      const res = await fetch('/api/mikrotik?action=status');
      const data = await res.json();
      
      if (data.needsSetup) {
        setNetworkError('لم يتم إعداد جهاز MikroTik');
        setNetworkStatus(null);
      } else if (data.error) {
        setNetworkError(data.error);
        setNetworkStatus(null);
      } else {
        setNetworkStatus(data);
      }
    } catch (error) {
      setNetworkError('فشل الاتصال بـ MikroTik');
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleAddMikrotik = async () => {
    if (!newMikrotik.name || !newMikrotik.host || !newMikrotik.username || !newMikrotik.password) {
      alert('جميع البيانات مطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/mikrotik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMikrotik),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewMikrotik({ name: '', host: '', port: 8728, username: '', password: '', isDefault: true });
      setShowMikrotikDialog(false);
      fetchMikrotikDevices();
      alert('تم إضافة الجهاز بنجاح');
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDisconnectUser = async (username: string, deviceId?: number) => {
    if (!confirm(`هل تريد قطع اتصال ${username}؟`)) return;

    try {
      const res = await fetch('/api/mikrotik', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', username, deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNetworkStatus();
        alert('تم قطع الاتصال');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const testMikrotikConnection = async () => {
    try {
      const res = await fetch('/api/mikrotik?action=test');
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}\nالراوتر: ${data.routerName}`);
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert('❌ فشل الاتصال');
    }
  };

  const deleteMikrotikDevice = async (id: number) => {
    if (!confirm('هل تريد حذف هذا الجهاز؟')) return;

    try {
      await fetch(`/api/mikrotik?id=${id}`, { method: 'DELETE' });
      fetchMikrotikDevices();
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const setDefaultMikrotikDevice = async (id: number) => {
    try {
      const res = await fetch('/api/mikrotik', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-default', deviceId: id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMikrotikDevices();
        alert('تم تعيين الجهاز كافتراضي');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const testMikrotikDevice = async (deviceId: number) => {
    try {
      const res = await fetch(`/api/mikrotik?action=test&deviceId=${deviceId}`);
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}\nالراوتر: ${data.routerName}`);
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert('❌ فشل الاتصال');
    }
  };

  // Import Functions
  const previewImportUsers = async () => {
    setImportLoading(true);
    try {
      const res = await fetch('/api/mikrotik/import');
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setImportPreview(data);
        setSelectedImportUsers(data.newUsers?.map((u: { name: string }) => u.name) || []);
        setShowImportDialog(true);
      }
    } catch (error) {
      alert('فشل جلب البيانات من MikroTik');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportUsers = async () => {
    if (!importPreview || importPreview.newUsers.length === 0) {
      alert('لا يوجد مستخدمين للاستيراد');
      return;
    }

    setImportLoading(true);
    try {
      const res = await fetch('/api/mikrotik/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importAll: importAllUsers,
          selectedUsers: importAllUsers ? null : selectedImportUsers,
          defaultFee: defaultMonthlyFee,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert(`✅ تم استيراد ${data.imported} مشترك بنجاح!`);
        setShowImportDialog(false);
        setImportPreview(null);
        fetchSubscribers();
        fetchNetworkStatus();
      } else {
        alert(data.error || 'حدث خطأ أثناء الاستيراد');
      }
    } catch (error) {
      alert('حدث خطأ أثناء الاستيراد');
    } finally {
      setImportLoading(false);
    }
  };

  const toggleUserSelection = (username: string) => {
    setSelectedImportUsers(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  // Service Control Functions
  const handleServiceControl = async (pppoeUser: string, action: 'enable' | 'disable' | 'grace', deviceId?: number) => {
    if (!pppoeUser) {
      alert('لا يوجد اسم مستخدم PPPoE لهذا المشترك');
      return;
    }

    const actionText = action === 'enable' ? 'تشغيل' : action === 'disable' ? 'إيقاف' : 'إعطاء مهلة';
    if (!confirm(`هل تريد ${actionText} الخدمة لـ ${pppoeUser}؟`)) return;

    try {
      const res = await fetch('/api/mikrotik', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action === 'enable' ? 'enable-service' : action === 'disable' ? 'disable-service' : 'grace',
          username: pppoeUser,
          deviceId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ تم ${actionText} الخدمة بنجاح`);
        fetchSubscribers();
        fetchNetworkStatus();
      } else {
        alert('❌ فشل العملية');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleUpdateGraceDays = async (subscriberId: number, graceDays: number) => {
    try {
      const res = await fetch(`/api/subscribers/${subscriberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graceDays }),
      });

      if (res.ok) {
        fetchSubscribers();
        alert(`تم تحديد ${graceDays} أيام مهلة`);
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // Handle Login
  const handleLogin = async () => {
    if (!loginUsername || !loginPassword || !loginPin) {
      setLoginError('جميع الحقول مطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          pin: loginPin
        })
      });

      const data = await res.json();

      if (data.blocked) {
        setLoginBlocked(true);
        setRemainingMinutes(data.remainingMinutes);
        setLoginError(data.error);
        return;
      }

      if (data.success) {
        setIsAdmin(true);
        setSessionToken(data.token);
        setShowLoginDialog(false);
        setLoginUsername('');
        setLoginPassword('');
        setLoginPin('');
        setLoginError('');
        setRemainingAttempts(5);
        // Store session in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminSession', data.token);
        }
      } else {
        setLoginError(data.error);
        setRemainingAttempts(data.remainingAttempts || 5);
      }
    } catch (error) {
      setLoginError('حدث خطأ أثناء الاتصال');
    }
  };

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('adminSession');
      if (token) {
        try {
          const res = await fetch('/api/auth', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.valid) {
            setIsAdmin(true);
            setSessionToken(token);
          } else {
            if (typeof window !== 'undefined') localStorage.removeItem('adminSession');
          }
        } catch {
          if (typeof window !== 'undefined') localStorage.removeItem('adminSession');
        }
      }
    };
    checkSession();
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('adminSession');
    if (token) {
      try {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminSession');
    }
    setIsAdmin(false);
    setSessionToken(null);
    setSubscribers([]);
    setInvoices([]);
    setCategories([]);
    setProducts([]);
    setInventoryTransactions([]);
    setTickets([]);
    setActiveAdminTab('dashboard');
  };

  // Search invoice by name
  const handleSearch = async () => {
    if (!searchName.trim() || searchName.trim().length < 3) {
      setSearchError('الرجاء إدخال الاسم الثلاثي كاملاً');
      return;
    }

    setLoading(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const res = await fetch(`/api/check-invoice?name=${encodeURIComponent(searchName)}`);
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || 'حدث خطأ أثناء البحث');
      } else {
        setSearchResult(data);
      }
    } catch (error) {
      setSearchError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  // General Search Function
  const handleGeneralSearch = () => {
    if (!generalSearch.trim()) {
      setGeneralSearchResults(null);
      return;
    }

    const query = generalSearch.toLowerCase().trim();

    // Search in subscribers
    const matchedSubscribers = subscribers.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      s.address?.toLowerCase().includes(query) ||
      s.pppoeUser?.toLowerCase().includes(query)
    );

    // Search in invoices
    const matchedInvoices = invoices.filter(i =>
      i.subscriber?.name.toLowerCase().includes(query) ||
      i.month.includes(query)
    );

    setGeneralSearchResults({
      subscribers: matchedSubscribers,
      invoices: matchedInvoices
    });
  };

  // Subscriber Functions
  const handleAddSubscriber = async () => {
    if (!newSubscriber.name || !newSubscriber.phone) {
      alert('الاسم ورقم الهاتف مطلوبان');
      return;
    }

    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscriber),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewSubscriber({ name: '', phone: '', address: '', monthlyFee: 0, pppoeUser: '', pppoePassword: '', ipAddress: '', graceDays: 0 });
      fetchSubscribers();
      alert('تم إضافة المشترك بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إضافة المشترك');
    }
  };

  const handleUpdateSubscriber = async () => {
    if (!editSubscriber) return;

    try {
      const res = await fetch(`/api/subscribers/${editSubscriber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubscriber),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setEditSubscriber(null);
      fetchSubscribers();
      alert('تم تحديث المشترك بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث المشترك');
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    try {
      const res = await fetch(`/api/subscribers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
        return;
      }

      fetchSubscribers();
      fetchInvoices();
      alert('تم حذف المشترك بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء حذف المشترك');
    }
  };

  // Renew Subscription Function
  const handleRenewSubscription = async (subscriberId: number, days: number = 30) => {
    if (!confirm(`هل تريد تجديد الاشتراك ${days} يوم؟`)) return;

    try {
      const res = await fetch(`/api/subscribers/${subscriberId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      fetchSubscribers();
      fetchNetworkStatus();
      alert(`✅ ${data.message}\nتاريخ الانتهاء الجديد: ${new Date(data.expiryDate).toLocaleDateString('ar-EG')}`);
    } catch (error) {
      alert('حدث خطأ أثناء تجديد الاشتراك');
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (expiryDate: string | null | undefined): { days: number; status: 'expired' | 'warning' | 'ok' } => {
    if (!expiryDate) {
      return { days: 0, status: 'expired' };
    }
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { days: 0, status: 'expired' };
    } else if (diffDays <= 7) {
      return { days: diffDays, status: 'warning' };
    } else {
      return { days: diffDays, status: 'ok' };
    }
  };

  // Invoice Functions
  const handleAddInvoice = async () => {
    if (!newInvoice.subscriberId || !newInvoice.month || newInvoice.amount <= 0) {
      alert('جميع البيانات مطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewInvoice({ subscriberId: 0, month: '', amount: 0, notes: '' });
      setInvoiceSubscriberId(null);
      fetchInvoices();
      fetchSubscribers();
      alert('تم إضافة الفاتورة بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الفاتورة');
    }
  };

  const handleToggleInvoicePaid = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !invoice.isPaid }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
        return;
      }

      fetchInvoices();
      fetchSubscribers();
    } catch (error) {
      alert('حدث خطأ أثناء تحديث الفاتورة');
    }
  };

  // Category Functions
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      alert('اسم التصنيف مطلوب');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewCategory({ name: '', nameEn: '', description: '' });
      fetchCategories();
      alert('تم إضافة التصنيف بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إضافة التصنيف');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      fetchCategories();
      alert('تم حذف التصنيف بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء حذف التصنيف');
    }
  };

  // Product Functions
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.categoryId) {
      alert('اسم المنتج والتصنيف مطلوبان');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewProduct({
        name: '',
        categoryId: 0,
        unit: 'قطعة',
        currentStock: 0,
        minStock: 5,
        price: 0,
        notes: '',
      });
      fetchProducts();
      alert('تم إضافة المنتج بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إضافة المنتج');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editProduct) return;

    try {
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProduct),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setEditProduct(null);
      fetchProducts();
      alert('تم تحديث المنتج بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء تحديث المنتج');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
        return;
      }

      fetchProducts();
      fetchInventoryTransactions();
      alert('تم حذف المنتج بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

  // Inventory Transaction Functions
  const handleAddTransaction = async () => {
    if (!newTransaction.productId || !newTransaction.quantity) {
      alert('المنتج والكمية مطلوبان');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewTransaction({
        productId: 0,
        type: 'in',
        quantity: 1,
        reason: '',
        recipient: '',
        supplier: '',
        price: 0,
        notes: '',
      });
      fetchInventoryTransactions();
      fetchProducts();
      alert('تم إضافة الحركة بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إضافة الحركة');
    }
  };

  // Ticket Functions
  const handleAddTicket = async () => {
    if (!newTicket.name || !newTicket.phone || !newTicket.subject || !newTicket.message) {
      alert('جميع البيانات مطلوبة');
      return;
    }

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      setNewTicket({ name: '', phone: '', subject: '', message: '', priority: 'normal' });
      setShowTicketDialog(false);
      alert('تم إرسال التذكرة بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء إرسال التذكرة');
    }
  };

  const handleUpdateTicket = async (id: number, updateData: { status?: string; response?: string }) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        alert('حدث خطأ');
        return;
      }

      fetchTickets();
      alert('تم تحديث التذكرة');
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });

      if (!res.ok) {
        alert('حدث خطأ');
        return;
      }

      fetchTickets();
      alert('تم حذف التذكرة');
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  // Settings Functions
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });

      if (!res.ok) {
        alert('حدث خطأ');
        return;
      }

      setSettings(settingsForm);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  // Export Function
  const handleExport = (type: string) => {
    window.open(`/api/export?type=${type}`, '_blank');
  };

  // Import Function
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      alert(`تم استيراد ${data.imported} مشترك\nتم تخطي ${data.skipped} مشترك`);
      fetchSubscribers();
    } catch (error) {
      alert('حدث خطأ أثناء الاستيراد');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Print Function
  const handlePrintInvoice = (subscriber: Subscriber) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalDue = subscriber.invoices?.filter(i => !i.isPaid).reduce((sum, i) => sum + i.amount, 0) || 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>كشف حساب - ${subscriber.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #1e40af; }
          .info { margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #1e40af; color: white; }
          .paid { background: #dcfce7; }
          .unpaid { background: #fee2e2; }
          .total { font-size: 18px; font-weight: bold; margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>🛜 ${settings.companyName}</h1>
        <p style="text-align: center;">${settings.companySlogan}</p>
        
        <div class="info">
          <h3>بيانات المشترك</h3>
          <p><strong>الاسم:</strong> ${subscriber.name}</p>
          <p><strong>الهاتف:</strong> ${subscriber.phone}</p>
          <p><strong>العنوان:</strong> ${subscriber.address || '-'}</p>
          <p><strong>الرسوم الشهرية:</strong> ${subscriber.monthlyFee.toLocaleString()} ل.س</p>
        </div>

        <h3>الفواتير</h3>
        <table>
          <thead>
            <tr>
              <th>الشهر</th>
              <th>المبلغ</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${subscriber.invoices?.map(inv => `
              <tr class="${inv.isPaid ? 'paid' : 'unpaid'}">
                <td>${inv.month}</td>
                <td>${inv.amount.toLocaleString()} ل.س</td>
                <td>${inv.isPaid ? 'مدفوعة ✓' : 'غير مدفوعة ✗'}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">لا توجد فواتير</td></tr>'}
          </tbody>
        </table>

        <div class="total">
          إجمالي المبلغ المستحق: ${totalDue.toLocaleString()} ل.س
        </div>

        <div class="footer">
          <p>للتواصل: ${settings.supportName1} - ${settings.supportPhone1}</p>
          <p>By Eng Ramzy Amoory</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Helper Functions
  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${months[parseInt(m) - 1]} ${year}`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-EG')} ل.س`;
  };

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG');
  };

  // تحويل رقم الهاتف السوري لصيغة واتساب
  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/^0/, '');
    return `https://wa.me/963${cleanPhone}`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="جرمانا نت"
                width={60}
                height={60}
                className="rounded-full shadow-lg ring-2 ring-blue-500/50"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {settings.companyName}
              </h1>
              <p className="text-slate-400 text-sm">{settings.companySlogan}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-slate-300">
              <Wifi className="h-5 w-5 text-cyan-400" />
              <span className="text-sm">{settings.companySlogan}</span>
            </div>
            
            {isAdmin && (
              <Button
                onClick={() => setShowNotificationDialog(true)}
                variant="outline"
                className="relative border-slate-600 text-slate-300"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            )}
            
            {isAdmin ? (
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            ) : (
              <Button
                onClick={() => setShowLoginDialog(true)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
              >
                <Shield className="h-4 w-4" />
                دخول المسؤول
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-white">تسجيل الدخول</DialogTitle>
            <DialogDescription className="text-center text-slate-400">
              أدخل بيانات المسؤول للدخول
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loginBlocked ? (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-4 rounded-lg text-center">
                <Shield className="h-12 w-12 mx-auto mb-2 text-red-400" />
                <p className="font-bold text-lg">تم حظر الوصول</p>
                <p>{loginError}</p>
                <p className="text-sm mt-2 text-slate-400">حاول بعد {remainingMinutes} دقيقة</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-300">اسم المستخدم</Label>
                  <Input
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">كلمة المرور</Label>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">رمز PIN (4 أرقام)</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="●●●●"
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 text-center text-2xl tracking-widest"
                  />
                </div>
                {loginError && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
                    {loginError}
                    {remainingAttempts < 5 && (
                      <p className="text-yellow-400 mt-1">متبقي {remainingAttempts} محاولات</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleLogin}
              disabled={loginBlocked}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <LogIn className="h-4 w-4 ml-2" />
              دخول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">الإشعارات</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div key={n.id} className={`p-3 rounded-lg ${n.isRead ? 'bg-slate-800' : 'bg-blue-900/30 border border-blue-700'}`}>
                  <p className="font-medium text-white">{n.title}</p>
                  <p className="text-slate-400 text-sm">{n.message}</p>
                  <p className="text-slate-500 text-xs mt-1">{formatDate(n.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">لا توجد إشعارات جديدة</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Visitor Interface */}
        {!isAdmin && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Hero Card */}
            <Card className="bg-slate-800/80 backdrop-blur-xl shadow-2xl border-slate-700">
              <CardHeader className="text-center bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white rounded-t-lg">
                <div className="flex justify-center mb-4">
                  <Image
                    src="/logo.png"
                    alt="جرمانا نت"
                    width={80}
                    height={80}
                    className="rounded-full shadow-xl ring-4 ring-white/30"
                  />
                </div>
                <CardTitle className="text-2xl">الاستعلام عن الفاتورة</CardTitle>
                <CardDescription className="text-blue-100">
                  أدخل اسمك الثلاثي للاستعلام عن حالة الفواتير
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Search Form */}
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل الاسم الثلاثي كاملاً"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-lg h-12 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-cyan-500"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Search className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {/* Error Message */}
                {searchError && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                    {searchError}
                  </div>
                )}

                {/* Search Result */}
                {searchResult && (
                  <div className="space-y-6">
                    {/* Subscriber Info */}
                    <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 p-4 rounded-lg border border-slate-600">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-semibold text-white">
                            {searchResult.subscriber.name}
                          </h3>
                          <p className="text-slate-400">{searchResult.subscriber.phone}</p>
                        </div>
                        <Badge
                          variant={searchResult.subscriber.isActive ? 'default' : 'destructive'}
                          className={searchResult.subscriber.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
                        >
                          {searchResult.subscriber.isActive ? 'نشط' : 'متوقف'}
                        </Badge>
                      </div>
                      {searchResult.subscriber.address && (
                        <p className="text-slate-400 text-sm">
                          العنوان: {searchResult.subscriber.address}
                        </p>
                      )}
                      <p className="text-slate-400 text-sm">
                        الرسوم الشهرية: {formatCurrency(searchResult.subscriber.monthlyFee)}
                      </p>
                    </div>

                    {/* Total Due */}
                    {searchResult.totalDue > 0 && (
                      <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border-2 border-red-600/50 p-4 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-red-300 font-bold text-lg">إجمالي المبلغ المستحق:</span>
                          <span className="text-red-300 font-bold text-2xl">
                            {formatCurrency(searchResult.totalDue)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* No Due */}
                    {searchResult.totalDue === 0 && (
                      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-2 border-green-600/50 p-4 rounded-lg shadow-lg">
                        <div className="flex justify-center items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-green-400" />
                          <span className="text-green-300 font-bold text-lg">مبروك! لا يوجد فواتير مستحقة</span>
                        </div>
                      </div>
                    )}

                    {/* Subscription Expiry for Customer */}
                    {(() => {
                      const { days, status } = getDaysRemaining(searchResult.subscriber.expiryDate);
                      if (status === 'expired') {
                        return (
                          <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border-2 border-red-600/50 p-4 rounded-lg shadow-lg">
                            <div className="flex justify-center items-center gap-2">
                              <XCircle className="h-6 w-6 text-red-400" />
                              <span className="text-red-300 font-bold text-lg">انتهى الاشتراك - يرجى التجديد</span>
                            </div>
                          </div>
                        );
                      } else if (status === 'warning') {
                        return (
                          <div className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border-2 border-yellow-600/50 p-4 rounded-lg shadow-lg">
                            <div className="flex justify-center items-center gap-2">
                              <AlertTriangle className="h-6 w-6 text-yellow-400" />
                              <span className="text-yellow-300 font-bold text-lg">متبقي {days} يوم على انتهاء الاشتراك</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-2 border-blue-600/50 p-4 rounded-lg shadow-lg">
                            <div className="flex justify-center items-center gap-2">
                              <Calendar className="h-6 w-6 text-blue-400" />
                              <span className="text-blue-300 font-bold text-lg">متبقي {days} يوم على انتهاء الاشتراك</span>
                            </div>
                          </div>
                        );
                      }
                    })()}

                    {/* Network Status for Customer */}
                    {searchResult.networkStatus && (
                      <div className={`p-4 rounded-lg border-2 ${
                        searchResult.networkStatus.isOnline 
                          ? 'bg-green-900/30 border-green-600/50' 
                          : 'bg-red-900/30 border-red-600/50'
                      }`}>
                        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                          {searchResult.networkStatus.isOnline ? (
                            <Wifi className="h-5 w-5 text-green-400" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-red-400" />
                          )}
                          حالة الاتصال
                        </h4>
                        
                        {searchResult.networkStatus.isOnline ? (
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400">الحالة</p>
                              <p className="text-green-400 font-medium">متصل ✓</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400">عنوان IP</p>
                              <p className="text-white font-medium">{searchResult.networkStatus.ipAddress}</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400">مدة الاتصال</p>
                              <p className="text-white font-medium">{searchResult.networkStatus.uptimeFormatted}</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400">الاستخدام الكلي</p>
                              <p className="text-cyan-400 font-medium">{searchResult.networkStatus.totalUsage}</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400">تحميل</p>
                              <p className="text-green-400 font-medium">{searchResult.networkStatus.bytesInFormatted}</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400">رفع</p>
                              <p className="text-blue-400 font-medium">{searchResult.networkStatus.bytesOutFormatted}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-red-400 font-medium">غير متصل حالياً</p>
                            {searchResult.networkStatus.lastSeen && (
                              <p className="text-slate-400 text-sm">
                                آخر ظهور: {formatDate(searchResult.networkStatus.lastSeen)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Invoices List */}
                    <div>
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        الفواتير
                      </h4>
                      {searchResult.subscriber.invoices && searchResult.subscriber.invoices.length > 0 ? (
                        <div className="space-y-2">
                          {searchResult.subscriber.invoices.map((invoice) => (
                            <div
                              key={invoice.id}
                              className={`p-3 rounded-lg border-2 ${
                                invoice.isPaid
                                  ? 'bg-green-900/30 border-green-700/50'
                                  : 'bg-red-900/30 border-red-700/50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-white">
                                    {formatMonth(invoice.month)}
                                  </p>
                                  {invoice.notes && (
                                    <p className="text-sm text-slate-400">{invoice.notes}</p>
                                  )}
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold text-white">
                                    {formatCurrency(invoice.amount)}
                                  </p>
                                  <Badge
                                    variant={invoice.isPaid ? 'default' : 'destructive'}
                                    className={invoice.isPaid ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
                                  >
                                    {invoice.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center py-4">لا توجد فواتير</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-700">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  للدعم الفني والتواصل
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-4 rounded-lg text-center border border-slate-600">
                    <p className="font-bold text-cyan-400 text-lg">{settings.supportName1}</p>
                    <div className="flex justify-center items-center gap-3 mt-2">
                      <a href={`tel:${settings.supportPhone1}`} className="text-white hover:text-cyan-400 text-xl font-semibold">
                        {settings.supportPhone1}
                      </a>
                      <a 
                        href={getWhatsAppLink(settings.supportPhone1)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full transition-all"
                      >
                        <MessageCircle className="h-5 w-5 text-white" />
                      </a>
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-lg text-center border border-slate-600">
                    <p className="font-bold text-cyan-400 text-lg">{settings.supportName2}</p>
                    <div className="flex justify-center items-center gap-3 mt-2">
                      <a href={`tel:${settings.supportPhone2}`} className="text-white hover:text-cyan-400 text-xl font-semibold">
                        {settings.supportPhone2}
                      </a>
                      <a 
                        href={getWhatsAppLink(settings.supportPhone2)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full transition-all"
                      >
                        <MessageCircle className="h-5 w-5 text-white" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Button */}
            <Button 
              onClick={() => setShowTicketDialog(true)}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Ticket className="h-5 w-5 ml-2" />
              إرسال شكوى أو طلب دعم
            </Button>

            {/* Ticket Dialog for Customer */}
            <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
              <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">إرسال شكوى أو طلب</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    سنقوم بالرد عليك في أقرب وقت
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">الاسم</Label>
                    <Input
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">رقم الهاتف</Label>
                    <Input
                      value={newTicket.phone}
                      onChange={(e) => setNewTicket({ ...newTicket, phone: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">الموضوع</Label>
                    <Input
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">تفاصيل الشكوى أو الطلب</Label>
                    <Textarea
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                      className="bg-slate-800 border-slate-600 text-white"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTicket} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    إرسال
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Footer Credit */}
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">
                By Eng Ramzy Amoory
              </p>
            </div>
          </div>
        )}

        {/* Admin Interface */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Error Message */}
            {fetchError && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex justify-between items-center">
                <span>{fetchError}</span>
                <Button onClick={fetchAllData} variant="outline" size="sm" className="border-red-500 text-red-300">
                  إعادة المحاولة
                </Button>
              </div>
            )}
            
            {/* Loading State */}
            {fetchLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            )}
            
            {!fetchLoading && !fetchError && (
          <Tabs value={activeAdminTab} onValueChange={setActiveAdminTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-slate-800 border border-slate-700 h-auto">
              <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 py-3">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">لوحة التحكم</span>
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 py-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">المشتركين</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">الفواتير</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 py-3 relative">
                <Wifi className="h-4 w-4" />
                <span className="hidden sm:inline">الشبكة</span>
                {networkStatus && networkStatus.online > 0 && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full text-xs flex items-center justify-center text-white">
                    {networkStatus.online}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 py-3">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">المخزون</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 py-3 relative">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">التذاكر</span>
                {tickets.filter(t => t.status === 'open').length > 0 && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {tickets.filter(t => t.status === 'open').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 py-3">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">إعدادات</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="space-y-6">
                {/* General Search */}
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      بحث عام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="ابحث بالاسم، الهاتف، العنوان، PPPoE..."
                        value={generalSearch}
                        onChange={(e) => {
                          setGeneralSearch(e.target.value);
                          if (!e.target.value.trim()) {
                            setGeneralSearchResults(null);
                          }
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleGeneralSearch()}
                        className="bg-slate-700 border-slate-600 text-white h-12"
                      />
                      <Button onClick={handleGeneralSearch} className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600">
                        <Search className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Search Results */}
                    {generalSearchResults && (
                      <div className="mt-4 space-y-4">
                        {generalSearchResults.subscribers.length > 0 && (
                          <div>
                            <h4 className="text-slate-300 font-medium mb-2">المشتركين ({generalSearchResults.subscribers.length})</h4>
                            <div className="space-y-2">
                              {generalSearchResults.subscribers.slice(0, 5).map(s => (
                                <div key={s.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                  <div>
                                    <p className="text-white font-medium">{s.name}</p>
                                    <p className="text-slate-400 text-sm">{s.phone} {s.address && `- ${s.address}`}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {s.isOnline ? (
                                      <Badge className="bg-green-500">متصل</Badge>
                                    ) : (
                                      <Badge className="bg-red-500">غير متصل</Badge>
                                    )}
                                    <a href={getWhatsAppLink(s.phone)} target="_blank" rel="noopener noreferrer">
                                      <MessageCircle className="h-5 w-5 text-green-400" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {generalSearchResults.invoices.length > 0 && (
                          <div>
                            <h4 className="text-slate-300 font-medium mb-2">الفواتير ({generalSearchResults.invoices.length})</h4>
                            <div className="space-y-2">
                              {generalSearchResults.invoices.slice(0, 5).map(i => (
                                <div key={i.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                  <div>
                                    <p className="text-white font-medium">{i.subscriber?.name}</p>
                                    <p className="text-slate-400 text-sm">{formatMonth(i.month)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white">{formatCurrency(i.amount)}</span>
                                    {i.isPaid ? (
                                      <Badge className="bg-green-500">مدفوعة</Badge>
                                    ) : (
                                      <Badge className="bg-red-500">غير مدفوعة</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {generalSearchResults.subscribers.length === 0 && generalSearchResults.invoices.length === 0 && (
                          <p className="text-center text-slate-400 py-4">لا توجد نتائج</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">المشتركين</p>
                          <p className="text-2xl font-bold text-white">{stats.totalSubscribers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">النشطين</p>
                          <p className="text-2xl font-bold text-green-400">{stats.activeSubscribers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-500/20 rounded-lg">
                          <DollarSign className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">المحصل</p>
                          <p className="text-xl font-bold text-cyan-400">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/20 rounded-lg">
                          <TrendingDown className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">المستحق</p>
                          <p className="text-xl font-bold text-red-400">{formatCurrency(stats.totalDue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">إجراءات سريعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button onClick={() => handleExport('subscribers')} className="h-16 flex-col gap-2 bg-green-600 hover:bg-green-700">
                        <Download className="h-5 w-5" />
                        تصدير المشتركين
                      </Button>
                      <Button onClick={() => handleExport('invoices')} className="h-16 flex-col gap-2 bg-green-600 hover:bg-green-700">
                        <Download className="h-5 w-5" />
                        تصدير الفواتير
                      </Button>
                      <Button onClick={() => fileInputRef.current?.click()} className="h-16 flex-col gap-2 bg-blue-600 hover:bg-blue-700">
                        <Upload className="h-5 w-5" />
                        استيراد مشتركين
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        className="hidden"
                      />
                      <Button onClick={() => setActiveAdminTab('subscribers')} className="h-16 flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                        <UserPlus className="h-5 w-5" />
                        إضافة مشترك
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-cyan-400 flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        آخر التذاكر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tickets.slice(0, 5).length > 0 ? (
                        <div className="space-y-3">
                          {tickets.slice(0, 5).map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 bg-slate-700/50 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{t.subject}</p>
                                <p className="text-slate-400 text-sm">{t.name}</p>
                              </div>
                              <Badge className={t.status === 'open' ? 'bg-red-500' : t.status === 'in_progress' ? 'bg-yellow-500' : 'bg-green-500'}>
                                {t.status === 'open' ? 'جديد' : t.status === 'in_progress' ? 'قيد المعالجة' : 'مغلق'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center py-4">لا توجد تذاكر</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-cyan-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        تنبيهات المخزون
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {products.filter(p => p.currentStock <= p.minStock).length > 0 ? (
                        <div className="space-y-3">
                          {products.filter(p => p.currentStock <= p.minStock).slice(0, 5).map(p => (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-red-900/30 rounded-lg border border-red-700/50">
                              <div>
                                <p className="text-white font-medium">{p.name}</p>
                                <p className="text-slate-400 text-sm">{p.category.name}</p>
                              </div>
                              <span className="text-red-400 font-bold">{p.currentStock} {p.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-center py-4">لا توجد تنبيهات</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Subscribers Tab */}
            <TabsContent value="subscribers">
              <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-cyan-400">قائمة المشتركين</CardTitle>
                      <CardDescription className="text-slate-400">إدارة جميع المشتركين في النظام</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleExport('subscribers')} variant="outline" className="border-green-500/50 text-green-400">
                        <Download className="h-4 w-4 ml-2" />
                        تصدير
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
                            <UserPlus className="h-4 w-4 ml-2" />
                            إضافة مشترك
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">إضافة مشترك جديد</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">الاسم الثلاثي *</Label>
                              <Input
                                value={newSubscriber.name}
                                onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })}
                                placeholder="أدخل الاسم الثلاثي كاملاً"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">رقم الهاتف *</Label>
                              <Input
                                value={newSubscriber.phone}
                                onChange={(e) => setNewSubscriber({ ...newSubscriber, phone: e.target.value })}
                                placeholder="أدخل رقم الهاتف"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">العنوان</Label>
                              <Input
                                value={newSubscriber.address}
                                onChange={(e) => setNewSubscriber({ ...newSubscriber, address: e.target.value })}
                                placeholder="أدخل العنوان"
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">الرسوم الشهرية (ل.س)</Label>
                              <Input
                                type="number"
                                value={newSubscriber.monthlyFee}
                                onChange={(e) => setNewSubscriber({ ...newSubscriber, monthlyFee: parseFloat(e.target.value) || 0 })}
                                className="bg-slate-800 border-slate-600 text-white"
                              />
                            </div>
                            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                              <p className="text-slate-300 text-sm mb-3">إعدادات الشبكة (اختياري)</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-slate-400 text-xs">مستخدم PPPoE</Label>
                                  <Input
                                    value={newSubscriber.pppoeUser}
                                    onChange={(e) => setNewSubscriber({ ...newSubscriber, pppoeUser: e.target.value })}
                                    placeholder="user1"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-slate-400 text-xs">كلمة مرور PPPoE</Label>
                                  <Input
                                    value={newSubscriber.pppoePassword}
                                    onChange={(e) => setNewSubscriber({ ...newSubscriber, pppoePassword: e.target.value })}
                                    placeholder="password"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-slate-400 text-xs">IP الثابت</Label>
                                  <Input
                                    value={newSubscriber.ipAddress}
                                    onChange={(e) => setNewSubscriber({ ...newSubscriber, ipAddress: e.target.value })}
                                    placeholder="192.168.1.10"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-slate-400 text-xs">أيام المهلة</Label>
                                  <Input
                                    type="number"
                                    value={newSubscriber.graceDays}
                                    onChange={(e) => setNewSubscriber({ ...newSubscriber, graceDays: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                    className="bg-slate-800 border-slate-600 text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddSubscriber} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                              إضافة
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {fetchLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                  ) : subscribers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-slate-700/50">
                            <TableHead className="text-slate-300">الاسم</TableHead>
                            <TableHead className="text-slate-300">الهاتف</TableHead>
                            <TableHead className="text-slate-300">العنوان</TableHead>
                            <TableHead className="text-slate-300">الرسوم</TableHead>
                            <TableHead className="text-slate-300">الحالة</TableHead>
                            <TableHead className="text-slate-300">الاتصال</TableHead>
                            <TableHead className="text-slate-300">الانتهاء</TableHead>
                            <TableHead className="text-slate-300">المستحق</TableHead>
                            <TableHead className="text-slate-300 text-center">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscribers.map((subscriber) => {
                            const totalDue = subscriber.invoices?.filter((inv) => !inv.isPaid).reduce((sum, inv) => sum + inv.amount, 0) || 0;
                            return (
                              <TableRow key={subscriber.id} className="border-slate-700 hover:bg-slate-700/30">
                                <TableCell className="font-medium text-white">
                                  <div className="flex items-center gap-2">
                                    {subscriber.name}
                                    {subscriber.graceDays && subscriber.graceDays > 0 && (
                                      <Badge className="bg-yellow-500 text-xs">{subscriber.graceDays} يوم مهلة</Badge>
                                    )}
                                  </div>
                                  {subscriber.pppoeUser && (
                                    <p className="text-slate-500 text-xs">PPPoE: {subscriber.pppoeUser}</p>
                                  )}
                                </TableCell>
                                <TableCell className="text-slate-300">{subscriber.phone}</TableCell>
                                <TableCell className="text-slate-300">{subscriber.address || '-'}</TableCell>
                                <TableCell className="text-slate-300">{formatCurrency(subscriber.monthlyFee)}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge className={subscriber.isActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-red-500'}>
                                      {subscriber.isActive ? 'نشط' : 'متوقف'}
                                    </Badge>
                                    {subscriber.serviceStatus === 'grace' && (
                                      <Badge className="bg-yellow-500 text-xs">مهلة</Badge>
                                    )}
                                    {subscriber.serviceStatus === 'suspended' && (
                                      <Badge className="bg-red-700 text-xs">موقوف</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {subscriber.pppoeUser ? (
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${subscriber.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                      <span className={subscriber.isOnline ? 'text-green-400' : 'text-red-400'}>
                                        {subscriber.isOnline ? 'متصل' : 'غير متصل'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {(() => {
                                    const { days, status } = getDaysRemaining(subscriber.expiryDate);
                                    if (status === 'expired') {
                                      return <Badge className="bg-red-600">منتهي</Badge>;
                                    } else if (status === 'warning') {
                                      return <Badge className="bg-yellow-500">{days} يوم</Badge>;
                                    } else {
                                      return <span className="text-green-400">{days} يوم</span>;
                                    }
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {totalDue > 0 ? (
                                    <span className="text-red-400 font-medium">{formatCurrency(totalDue)}</span>
                                  ) : (
                                    <span className="text-green-400">لا يوجد</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 justify-center flex-wrap">
                                    {/* Service Control Buttons */}
                                    {subscriber.pppoeUser && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-green-500/50 text-green-400"
                                          onClick={() => handleServiceControl(subscriber.pppoeUser!, 'enable', subscriber.mikrotikDeviceId || undefined)}
                                          title="تشغيل الخدمة"
                                        >
                                          <Wifi className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-yellow-500/50 text-yellow-400"
                                          onClick={() => handleServiceControl(subscriber.pppoeUser!, 'grace', subscriber.mikrotikDeviceId || undefined)}
                                          title="إعطاء مهلة"
                                        >
                                          <Clock className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-red-500/50 text-red-400"
                                          onClick={() => handleServiceControl(subscriber.pppoeUser!, 'disable', subscriber.mikrotikDeviceId || undefined)}
                                          title="إيقاف الخدمة"
                                        >
                                          <WifiOff className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                    {/* Renew Button */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                                      onClick={() => handleRenewSubscription(subscriber.id, 30)}
                                      title="تجديد 30 يوم"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </Button>
                                    <a 
                                      href={getWhatsAppLink(subscriber.phone)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-600 rounded-md transition-all"
                                    >
                                      <MessageCircle className="h-4 w-4 text-white" />
                                    </a>
                                    <Button variant="outline" size="sm" className="border-purple-500/50 text-purple-400" onClick={() => handlePrintInvoice(subscriber)}>
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20" onClick={() => setEditSubscriber(subscriber)}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle className="text-white">تعديل بيانات المشترك</DialogTitle>
                                        </DialogHeader>
                                        {editSubscriber && (
                                          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                            <div className="space-y-2">
                                              <Label className="text-slate-300">الاسم الثلاثي</Label>
                                              <Input value={editSubscriber.name} onChange={(e) => setEditSubscriber({ ...editSubscriber, name: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-slate-300">رقم الهاتف</Label>
                                              <Input value={editSubscriber.phone} onChange={(e) => setEditSubscriber({ ...editSubscriber, phone: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-slate-300">العنوان</Label>
                                              <Input value={editSubscriber.address || ''} onChange={(e) => setEditSubscriber({ ...editSubscriber, address: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-slate-300">الرسوم الشهرية</Label>
                                              <Input type="number" value={editSubscriber.monthlyFee} onChange={(e) => setEditSubscriber({ ...editSubscriber, monthlyFee: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                                            </div>
                                            
                                            {/* Network Settings */}
                                            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                              <p className="text-slate-300 text-sm mb-3">إعدادات الشبكة</p>
                                              <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                  <Label className="text-slate-400 text-xs">مستخدم PPPoE</Label>
                                                  <Input value={editSubscriber.pppoeUser || ''} onChange={(e) => setEditSubscriber({ ...editSubscriber, pppoeUser: e.target.value })} className="bg-slate-800 border-slate-600 text-white text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                  <Label className="text-slate-400 text-xs">أيام المهلة</Label>
                                                  <Input type="number" value={editSubscriber.graceDays || 0} onChange={(e) => setEditSubscriber({ ...editSubscriber, graceDays: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white text-sm" />
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                                              <Label className="text-slate-300">نشط</Label>
                                              <Switch checked={editSubscriber.isActive} onCheckedChange={(checked) => setEditSubscriber({ ...editSubscriber, isActive: checked })} />
                                            </div>
                                          </div>
                                        )}
                                        <DialogFooter>
                                          <Button onClick={handleUpdateSubscriber} className="bg-gradient-to-r from-blue-600 to-cyan-600">حفظ</Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="border-green-500/50 text-green-400 hover:bg-green-500/20" onClick={() => { setInvoiceSubscriberId(subscriber.id); setNewInvoice({ subscriberId: subscriber.id, month: getCurrentMonth(), amount: subscriber.monthlyFee, notes: '' }); }}>
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle className="text-white">إضافة فاتورة جديدة</DialogTitle>
                                          <DialogDescription className="text-slate-400">إضافة فاتورة للمشترك: {subscriber.name}</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                          <div className="space-y-2">
                                            <Label className="text-slate-300">الشهر</Label>
                                            <Input type="month" value={newInvoice.month} onChange={(e) => setNewInvoice({ ...newInvoice, month: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-slate-300">المبلغ</Label>
                                            <Input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-slate-300">ملاحظات</Label>
                                            <Textarea value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button onClick={handleAddInvoice} className="bg-gradient-to-r from-green-600 to-emerald-600">إضافة الفاتورة</Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="bg-slate-900 border-slate-700">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="text-white">حذف المشترك</AlertDialogTitle>
                                          <AlertDialogDescription className="text-slate-400">
                                            هل أنت متأكد من حذف المشترك &quot;{subscriber.name}&quot;؟ سيتم حذف جميع الفواتير المرتبطة به أيضاً.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">إلغاء</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteSubscriber(subscriber.id)} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-8">لا يوجد مشتركين</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-cyan-400">قائمة الفواتير</CardTitle>
                      <CardDescription className="text-slate-400">إدارة جميع الفواتير في النظام</CardDescription>
                    </div>
                    <Button onClick={() => handleExport('invoices')} variant="outline" className="border-green-500/50 text-green-400">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-slate-700/50">
                            <TableHead className="text-slate-300">المشترك</TableHead>
                            <TableHead className="text-slate-300">الشهر</TableHead>
                            <TableHead className="text-slate-300">المبلغ</TableHead>
                            <TableHead className="text-slate-300">الحالة</TableHead>
                            <TableHead className="text-slate-300">تاريخ الاستحقاق</TableHead>
                            <TableHead className="text-slate-300 text-center">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-slate-700 hover:bg-slate-700/30">
                              <TableCell className="font-medium text-white">{invoice.subscriber?.name}</TableCell>
                              <TableCell className="text-slate-300">{formatMonth(invoice.month)}</TableCell>
                              <TableCell className="text-slate-300">{formatCurrency(invoice.amount)}</TableCell>
                              <TableCell>
                                <Badge className={invoice.isPaid ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-red-500'}>
                                  {invoice.isPaid ? 'مدفوعة' : 'غير مدفوعة'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300">{formatDate(invoice.dueDate)}</TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant={invoice.isPaid ? 'destructive' : 'default'}
                                  size="sm"
                                  onClick={() => handleToggleInvoicePaid(invoice)}
                                  className={invoice.isPaid ? '' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'}
                                >
                                  {invoice.isPaid ? (
                                    <>
                                      <XCircle className="h-4 w-4 ml-1" />
                                      إلغاء الدفع
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 ml-1" />
                                      تأكيد الدفع
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-8">لا توجد فواتير</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network">
              <div className="space-y-6">
                {/* Network Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                          <Wifi className="h-6 w-6 text-green-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">متصل</p>
                          <p className="text-2xl font-bold text-green-400">{networkStatus?.online || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-500/20 rounded-lg">
                          <WifiOff className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">غير متصل</p>
                          <p className="text-2xl font-bold text-red-400">{networkStatus?.offline || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                          <Users className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">إجمالي PPPoE</p>
                          <p className="text-2xl font-bold text-white">{networkStatus?.totalSubscribers || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-cyan-500/20 rounded-lg">
                          <Activity className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-slate-400 text-sm">نشاط الشبكة</p>
                          <Button onClick={fetchNetworkStatus} size="sm" variant="outline" className="border-cyan-500/50 text-cyan-400">
                            <RefreshCw className={`h-4 w-4 ${networkLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Servers Stats */}
                {networkStatus?.devices && networkStatus.devices.length > 0 && (
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        إحصائيات السيرفرات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {networkStatus.devices.map(dev => (
                          <div key={dev.id} className={`p-4 rounded-lg border-2 ${dev.isDefault ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-700/50 border-slate-600'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white font-medium">{dev.name}</span>
                              {dev.isDefault && <Badge className="bg-blue-500 text-xs">افتراضي</Badge>}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-green-400 text-lg font-bold">{dev.online}</span>
                              <span className="text-slate-400 text-sm">متصل</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-2">{dev.host}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error Message */}
                {networkError && (
                  <Card className="bg-red-900/30 border-red-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                          <span className="text-red-300">{networkError}</span>
                        </div>
                        <Button onClick={() => setShowMikrotikDialog(true)} size="sm" className="bg-blue-600">
                          إعداد MikroTik
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* MikroTik Devices */}
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-cyan-400 flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        أجهزة MikroTik ({mikrotikDevices.length})
                      </CardTitle>
                      <Button onClick={() => setShowMikrotikDialog(true)} className="bg-gradient-to-r from-green-600 to-emerald-600">
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة سيرفر
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mikrotikDevices.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mikrotikDevices.map(device => (
                          <div key={device.id} className={`p-4 rounded-lg border-2 ${device.isDefault ? 'bg-blue-900/20 border-blue-500' : 'bg-slate-700/50 border-slate-600'}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${device.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-white font-medium">{device.name}</span>
                              </div>
                              {device.isDefault && (
                                <Badge className="bg-blue-500 text-xs">افتراضي</Badge>
                              )}
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="text-slate-300 text-sm">📍 {device.host}:{device.port}</p>
                              <p className="text-slate-400 text-sm">👤 {device.username}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                onClick={() => testMikrotikDevice(device.id)}
                                size="sm"
                                variant="outline"
                                className="border-green-500/50 text-green-400 flex-1"
                              >
                                اختبار
                              </Button>
                              {!device.isDefault && (
                                <Button
                                  onClick={() => setDefaultMikrotikDevice(device.id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-500/50 text-blue-400 flex-1"
                                >
                                  تعيين افتراضي
                                </Button>
                              )}
                              <Button
                                onClick={() => deleteMikrotikDevice(device.id)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Server className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">لم يتم إضافة أجهزة MikroTik</p>
                        <Button onClick={() => setShowMikrotikDialog(true)} className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                          إضافة جهاز جديد
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Users */}
                {networkStatus && networkStatus.activeUsers.length > 0 && (
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-green-400 flex items-center gap-2">
                          <EthernetPort className="h-5 w-5" />
                          المشتركين المتصلين ({networkStatus.activeUsers.filter(u => !networkSearch || u.name.toLowerCase().includes(networkSearch.toLowerCase())).length})
                        </CardTitle>
                        <Input
                          placeholder="بحث..."
                          value={networkSearch}
                          onChange={(e) => setNetworkSearch(e.target.value)}
                          className="w-48 bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-700">
                              <TableHead className="text-slate-300">المستخدم</TableHead>
                              <TableHead className="text-slate-300">السيرفر</TableHead>
                              <TableHead className="text-slate-300">IP</TableHead>
                              <TableHead className="text-slate-300">مدة الاتصال</TableHead>
                              <TableHead className="text-slate-300">تحميل</TableHead>
                              <TableHead className="text-slate-300">رفع</TableHead>
                              <TableHead className="text-slate-300 text-center">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {networkStatus.activeUsers
                              .filter(user => !networkSearch || 
                                user.name.toLowerCase().includes(networkSearch.toLowerCase()) ||
                                user.address.includes(networkSearch) ||
                                user.deviceName.toLowerCase().includes(networkSearch.toLowerCase())
                              )
                              .map((user, idx) => (
                              <TableRow key={idx} className="border-slate-700">
                                <TableCell className="font-medium text-white">{user.name}</TableCell>
                                <TableCell>
                                  <Badge className="bg-purple-500/50 text-purple-200">
                                    {user.deviceName}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300">{user.address}</TableCell>
                                <TableCell className="text-slate-300">{user.uptime}</TableCell>
                                <TableCell className="text-green-400">{user.bytesInFormatted}</TableCell>
                                <TableCell className="text-blue-400">{user.bytesOutFormatted}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      onClick={() => handleDisconnectUser(user.name, user.deviceId)}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      قطع
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Import from MikroTik */}
                {mikrotikDevices.length > 0 && (
                  <Card className="bg-slate-800/80 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-purple-400 flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        استيراد من MikroTik
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        استيراد مستخدمي PPPoE من MikroTik إلى النظام
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Button 
                          onClick={previewImportUsers}
                          disabled={importLoading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          {importLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Download className="h-4 w-4 ml-2" />
                          )}
                          معاينة المستخدمين
                        </Button>
                        <p className="text-slate-400 text-sm">
                          سيتم جلب قائمة مستخدمي PPPoE من MikroTik
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      إدارة المخزون
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Add Product */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-20 flex-col gap-2 bg-gradient-to-r from-blue-600 to-cyan-600">
                            <Plus className="h-6 w-6" />
                            إضافة منتج جديد
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">إضافة منتج جديد</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">اسم المنتج</Label>
                              <Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">التصنيف</Label>
                              <Select value={newProduct.categoryId.toString()} onValueChange={(v) => setNewProduct({ ...newProduct, categoryId: parseInt(v) })}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                  <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()} className="text-white">{c.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-300">الكمية الابتدائية</Label>
                                <Input type="number" value={newProduct.currentStock} onChange={(e) => setNewProduct({ ...newProduct, currentStock: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-300">الحد الأدنى</Label>
                                <Input type="number" value={newProduct.minStock} onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">السعر</Label>
                              <Input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleAddProduct} className="bg-gradient-to-r from-blue-600 to-cyan-600">إضافة</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Stock In */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-20 flex-col gap-2 bg-gradient-to-r from-green-600 to-emerald-600">
                            <ArrowDownCircle className="h-6 w-6" />
                            إدخال بضاعة
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">إدخال بضاعة</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">المنتج</Label>
                              <Select value={newTransaction.productId.toString()} onValueChange={(v) => setNewTransaction({ ...newTransaction, productId: parseInt(v) })}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                  <SelectValue placeholder="اختر المنتج" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()} className="text-white">{p.name} (المخزون: {p.currentStock})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-300">الكمية</Label>
                                <Input type="number" value={newTransaction.quantity} onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-300">السعر</Label>
                                <Input type="number" value={newTransaction.price} onChange={(e) => setNewTransaction({ ...newTransaction, price: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">المورد</Label>
                              <Input value={newTransaction.supplier} onChange={(e) => setNewTransaction({ ...newTransaction, supplier: e.target.value })} placeholder="اسم المورد" className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">ملاحظات</Label>
                              <Input value={newTransaction.notes} onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => { setNewTransaction({ ...newTransaction, type: 'in' }); handleAddTransaction(); }} className="bg-gradient-to-r from-green-600 to-emerald-600">إدخال</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Stock Out */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="h-20 flex-col gap-2 bg-gradient-to-r from-red-600 to-orange-600">
                            <ArrowUpCircle className="h-6 w-6" />
                            إخراج بضاعة
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">إخراج بضاعة</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">المنتج</Label>
                              <Select value={newTransaction.productId.toString()} onValueChange={(v) => setNewTransaction({ ...newTransaction, productId: parseInt(v) })}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                  <SelectValue placeholder="اختر المنتج" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()} className="text-white">{p.name} (المخزون: {p.currentStock})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">الكمية</Label>
                              <Input type="number" value={newTransaction.quantity} onChange={(e) => setNewTransaction({ ...newTransaction, quantity: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">سبب الإخراج</Label>
                              <Select value={newTransaction.reason} onValueChange={(v) => setNewTransaction({ ...newTransaction, reason: v })}>
                                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                                  <SelectValue placeholder="اختر السبب" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-600">
                                  <SelectItem value="تركيب" className="text-white">🔧 تركيب</SelectItem>
                                  <SelectItem value="بيع" className="text-white">💰 بيع</SelectItem>
                                  <SelectItem value="هدية" className="text-white">🎁 هدية</SelectItem>
                                  <SelectItem value="تالف" className="text-white">🗑️ تالف</SelectItem>
                                  <SelectItem value="استبدال" className="text-white">🔄 استبدال</SelectItem>
                                  <SelectItem value="أخرى" className="text-white">📝 أخرى</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">اسم المستلم / الزبون</Label>
                              <Input value={newTransaction.recipient} onChange={(e) => setNewTransaction({ ...newTransaction, recipient: e.target.value })} placeholder="اسم الشخص أو الزبون" className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">ملاحظات</Label>
                              <Input value={newTransaction.notes} onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => { setNewTransaction({ ...newTransaction, type: 'out' }); handleAddTransaction(); }} className="bg-gradient-to-r from-red-600 to-orange-600">إخراج</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Products Grid */}
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">المنتجات ({products.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((p) => (
                          <div key={p.id} className={`p-4 rounded-lg border-2 ${p.currentStock <= p.minStock ? 'bg-red-900/20 border-red-500' : 'bg-slate-700/50 border-slate-600'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-white font-medium">{p.name}</p>
                                <p className="text-slate-400 text-sm">{p.category.name}</p>
                              </div>
                              <Badge className={p.currentStock <= p.minStock ? 'bg-red-500' : 'bg-green-500'}>
                                {p.currentStock} {p.unit}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">السعر: {p.price.toLocaleString()} ل.س</span>
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400" onClick={() => setEditProduct(p)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-8">لا توجد منتجات</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card className="bg-slate-800/80 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">آخر الحركات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inventoryTransactions.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {inventoryTransactions.slice(0, 10).map((t) => (
                          <div key={t.id} className={`flex justify-between items-center p-3 rounded-lg ${t.type === 'in' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                            <div>
                              <p className="text-white font-medium">{t.product.name}</p>
                              <p className="text-slate-400 text-sm">
                                {t.type === 'in' ? `من: ${t.supplier || '-'}` : `${t.reason || 'إخراج'} - ${t.recipient || '-'}`}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className={`font-bold ${t.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'in' ? '+' : '-'}{t.quantity}
                              </p>
                              <p className="text-xs text-slate-500">{formatDate(t.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-4">لا توجد حركات</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
                <CardHeader>
                  <CardTitle className="text-cyan-400">تذاكر الدعم</CardTitle>
                  <CardDescription className="text-slate-400">إدارة الشكاوى والطلبات</CardDescription>
                </CardHeader>
                <CardContent>
                  {tickets.length > 0 ? (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div key={ticket.id} className={`p-4 rounded-lg border ${
                          ticket.status === 'open' ? 'bg-red-900/20 border-red-700/50' :
                          ticket.status === 'in_progress' ? 'bg-yellow-900/20 border-yellow-700/50' :
                          'bg-green-900/20 border-green-700/50'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-white">{ticket.subject}</h4>
                              <p className="text-slate-400 text-sm">{ticket.name} - {ticket.phone}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={
                                ticket.status === 'open' ? 'bg-red-500' :
                                ticket.status === 'in_progress' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }>
                                {ticket.status === 'open' ? 'جديد' : ticket.status === 'in_progress' ? 'قيد المعالجة' : 'مغلق'}
                              </Badge>
                              <a 
                                href={getWhatsAppLink(ticket.phone)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full"
                              >
                                <MessageCircle className="h-4 w-4 text-white" />
                              </a>
                            </div>
                          </div>
                          <p className="text-slate-300 mb-2">{ticket.message}</p>
                          <p className="text-slate-500 text-xs mb-3">{formatDate(ticket.createdAt)}</p>
                          
                          {ticket.response && (
                            <div className="bg-slate-700/50 p-3 rounded-lg mb-3">
                              <p className="text-slate-400 text-sm mb-1">الرد:</p>
                              <p className="text-white">{ticket.response}</p>
                            </div>
                          )}

                          {ticket.status !== 'closed' && (
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    رد
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-slate-700">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">الرد على التذكرة</DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <Textarea 
                                      id={`response-${ticket.id}`}
                                      placeholder="اكتب ردك هنا..."
                                      className="bg-slate-800 border-slate-600 text-white"
                                      rows={4}
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={() => {
                                      const response = (document.getElementById(`response-${ticket.id}`) as HTMLTextAreaElement)?.value;
                                      if (response) {
                                        handleUpdateTicket(ticket.id, { response, status: 'in_progress' });
                                      }
                                    }} className="bg-blue-600">
                                      إرسال الرد
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="outline" className="border-green-500/50 text-green-400" onClick={() => handleUpdateTicket(ticket.id, { status: 'closed' })}>
                                إغلاق
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteTicket(ticket.id)}>
                                حذف
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-8">لا توجد تذاكر</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      إعدادات النظام
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Admin Credentials */}
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h3 className="text-white font-semibold mb-4">بيانات المسؤول</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">اسم المستخدم</Label>
                            <Input value={settingsForm.adminUsername} onChange={(e) => setSettingsForm({ ...settingsForm, adminUsername: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">كلمة المرور</Label>
                            <Input type="password" value={settingsForm.adminPassword} onChange={(e) => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">رمز PIN (4 أرقام)</Label>
                            <Input 
                              type="password" 
                              maxLength={4} 
                              value={settingsForm.adminPin || '1234'} 
                              onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value.replace(/\D/g, '').slice(0, 4) })} 
                              className="bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-widest" 
                            />
                            <p className="text-slate-500 text-xs">رمز إضافي للتحقق عند الدخول</p>
                          </div>
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h3 className="text-white font-semibold mb-4">معلومات الشركة</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">اسم الشركة</Label>
                            <Input value={settingsForm.companyName} onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">الشعار</Label>
                            <Input value={settingsForm.companySlogan} onChange={(e) => setSettingsForm({ ...settingsForm, companySlogan: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Support Numbers */}
                      <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <h3 className="text-white font-semibold mb-4">أرقام الدعم</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">اسم الدعم 1</Label>
                            <Input value={settingsForm.supportName1} onChange={(e) => setSettingsForm({ ...settingsForm, supportName1: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">رقم الهاتف 1</Label>
                            <Input value={settingsForm.supportPhone1} onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone1: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">اسم الدعم 2</Label>
                            <Input value={settingsForm.supportName2} onChange={(e) => setSettingsForm({ ...settingsForm, supportName2: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">رقم الهاتف 2</Label>
                            <Input value={settingsForm.supportPhone2} onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone2: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 h-12">
                        <Save className="h-5 w-5 ml-2" />
                        حفظ الإعدادات
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Import/Export */}
                <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">استيراد وتصدير البيانات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => handleExport('subscribers')} className="h-16 flex-col gap-2 bg-green-600 hover:bg-green-700">
                        <Download className="h-5 w-5" />
                        تصدير المشتركين
                      </Button>
                      <Button onClick={() => handleExport('invoices')} className="h-16 flex-col gap-2 bg-green-600 hover:bg-green-700">
                        <Download className="h-5 w-5" />
                        تصدير الفواتير
                      </Button>
                      <Button onClick={() => fileInputRef.current?.click()} className="h-16 flex-col gap-2 bg-blue-600 hover:bg-blue-700 col-span-2">
                        <Upload className="h-5 w-5" />
                        استيراد مشتركين من CSV
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleImport}
                      className="hidden"
                    />
                    <p className="text-slate-400 text-sm mt-4 text-center">
                      صيغة CSV: الاسم, رقم الهاتف, العنوان, الرسوم الشهرية
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
            )}
          </div>
        )}

        {/* MikroTik Device Dialog */}
        <Dialog open={showMikrotikDialog} onOpenChange={setShowMikrotikDialog}>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">إضافة جهاز MikroTik</DialogTitle>
              <DialogDescription className="text-slate-400">
                أدخل بيانات جهاز MikroTik للاتصال به
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-slate-300">اسم الجهاز</Label>
                <Input
                  value={newMikrotik.name}
                  onChange={(e) => setNewMikrotik({ ...newMikrotik, name: e.target.value })}
                  placeholder="مثال: الراوتر الرئيسي"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">عنوان IP</Label>
                <Input
                  value={newMikrotik.host}
                  onChange={(e) => setNewMikrotik({ ...newMikrotik, host: e.target.value })}
                  placeholder="192.168.1.1"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">منفذ API</Label>
                <Input
                  type="number"
                  value={newMikrotik.port}
                  onChange={(e) => setNewMikrotik({ ...newMikrotik, port: parseInt(e.target.value) || 8728 })}
                  placeholder="8728"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">اسم المستخدم</Label>
                <Input
                  value={newMikrotik.username}
                  onChange={(e) => setNewMikrotik({ ...newMikrotik, username: e.target.value })}
                  placeholder="admin"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">كلمة المرور</Label>
                <Input
                  type="password"
                  value={newMikrotik.password}
                  onChange={(e) => setNewMikrotik({ ...newMikrotik, password: e.target.value })}
                  placeholder="كلمة المرور"
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <Label className="text-slate-300">الجهاز الافتراضي</Label>
                <Switch
                  checked={newMikrotik.isDefault}
                  onCheckedChange={(checked) => setNewMikrotik({ ...newMikrotik, isDefault: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMikrotik} className="bg-gradient-to-r from-green-600 to-emerald-600">
                <Server className="h-4 w-4 ml-2" />
                إضافة الجهاز
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">استيراد مستخدمين من MikroTik</DialogTitle>
              <DialogDescription className="text-slate-400">
                اختر المستخدمين الذين تريد استيرادهم
              </DialogDescription>
            </DialogHeader>
            
            {importPreview && (
              <div className="space-y-4 py-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{importPreview.total}</p>
                    <p className="text-slate-400 text-sm">إجمالي PPPoE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{importPreview.newUsers?.length || 0}</p>
                    <p className="text-slate-400 text-sm">جاهز للاستيراد</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{importPreview.existingUsers?.length || 0}</p>
                    <p className="text-slate-400 text-sm">موجود مسبقاً</p>
                  </div>
                </div>

                {/* Default Fee */}
                <div className="space-y-2">
                  <Label className="text-slate-300">الرسوم الشهرية الافتراضية (ل.س)</Label>
                  <Input
                    type="number"
                    value={defaultMonthlyFee}
                    onChange={(e) => setDefaultMonthlyFee(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <p className="text-slate-500 text-xs">يمكنك تعديل الرسوم لكل مشترك لاحقاً</p>
                </div>

                {/* Import All Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div>
                    <Label className="text-slate-300">استيراد الكل</Label>
                    <p className="text-slate-500 text-xs">استيراد جميع المستخدمين الجدد</p>
                  </div>
                  <Switch
                    checked={importAllUsers}
                    onCheckedChange={setImportAllUsers}
                  />
                </div>

                {/* User Selection */}
                {!importAllUsers && importPreview.newUsers && importPreview.newUsers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-slate-300">اختر المستخدمين:</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2 bg-slate-800 p-3 rounded-lg">
                      {importPreview.newUsers.map((user) => (
                        <div 
                          key={user.name}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            selectedImportUsers.includes(user.name) 
                              ? 'bg-green-900/30 border border-green-700' 
                              : 'bg-slate-700/50 hover:bg-slate-700'
                          }`}
                          onClick={() => toggleUserSelection(user.name)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedImportUsers.includes(user.name)}
                              onChange={() => toggleUserSelection(user.name)}
                              className="w-4 h-4"
                            />
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-slate-500 text-xs">
                                Profile: {user.profile} | IP: {user.remoteAddress || 'ديناميكي'}
                              </p>
                            </div>
                          </div>
                          {user.disabled && (
                            <Badge className="bg-red-500 text-xs">معطل</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-500 text-xs">
                      تم اختيار {selectedImportUsers.length} من {importPreview.newUsers.length}
                    </p>
                  </div>
                )}

                {/* Existing Users Info */}
                {importPreview.existingUsers && importPreview.existingUsers.length > 0 && (
                  <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      ℹ️ {importPreview.existingUsers.length} مستخدم موجود بالفعل في النظام
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="border-slate-600 text-slate-300">
                إلغاء
              </Button>
              <Button 
                onClick={handleImportUsers} 
                disabled={importLoading || (importPreview?.newUsers?.length || 0) === 0}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {importLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Download className="h-4 w-4 ml-2" />
                )}
                استيراد ({importAllUsers ? importPreview?.newUsers?.length || 0 : selectedImportUsers.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p className="flex items-center justify-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-cyan-400" />
            {settings.companySlogan}
          </p>
          <p>{settings.companyName} © {new Date().getFullYear()} - By Eng Ramzy Amoory</p>
        </div>
      </footer>
    </div>
  );
}
