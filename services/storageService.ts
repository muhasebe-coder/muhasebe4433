
import { MOCK_INVOICES, MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS } from '../constants';
import { Invoice, InvoiceStatus, Product, Transaction, TransactionType, PaymentMethod, Customer, Proposal, ProposalStatus, CompanyInfo, Employee, AppSettings } from '../types';

const DB_NAME = 'MuhasebeProDB';
const DB_VERSION = 1;
const STORES = {
  PRODUCTS: 'products',
  INVOICES: 'invoices',
  TRANSACTIONS: 'transactions',
  CUSTOMERS: 'customers',
  PROPOSALS: 'proposals',
  EMPLOYEES: 'employees'
};

const KEYS = {
  COMPANY_INFO: 'company_info',
  APP_SETTINGS: 'app_settings',
  LAST_BACKUP: 'last_backup_date',
  AUTH: 'auth_creds'
};

// Memory Cache for Synchronous UI Access
let cache: any = {
  products: [],
  invoices: [],
  transactions: [],
  customers: [],
  proposals: [],
  employees: [],
  settings: {}
};

// Database Initializer
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      Object.values(STORES).forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
      // Small settings store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const persistStore = async (storeName: string, data: any[]) => {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const clearReq = store.clear();
    clearReq.onsuccess = () => {
      if (Array.isArray(data)) {
        data.forEach(item => store.put(item));
      }
      resolve(true);
    };
    clearReq.onerror = () => reject(clearReq.error);
  });
};

const persistMeta = async (key: string, data: any) => {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readwrite');
  tx.objectStore('metadata').put(data, key);
};

export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}${timestamp}-${random}`.toUpperCase();
};

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Mustafa Ticaret',
  primaryColor: '#2563eb',
  isDarkMode: false,
  visibleStats: {
    income: true,
    expense: true,
    profit: true,
    stock: true
  }
};

export const storageService = {
  init: async () => {
    const db = await openDB();
    
    // Check if migration from LocalStorage is needed
    const isFirstRun = !localStorage.getItem('muhasebe_migrated');

    for (const [key, storeName] of Object.entries(STORES)) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const data: any[] = await new Promise(res => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
      });
      
      const lowerKey = storeName.toLowerCase();
      if (data && data.length > 0) {
        cache[lowerKey] = data;
      } else if (isFirstRun) {
        // Fallback to mocks for the very first run
        if (lowerKey === 'products') cache.products = MOCK_PRODUCTS;
        else if (lowerKey === 'invoices') cache.invoices = MOCK_INVOICES;
        else if (lowerKey === 'transactions') cache.transactions = MOCK_TRANSACTIONS;
        else if (lowerKey === 'customers') cache.customers = MOCK_CUSTOMERS;
        
        await persistStore(storeName, cache[lowerKey]);
      }
    }

    // Load Metadata
    const metaTx = db.transaction('metadata', 'readonly');
    const metaStore = metaTx.objectStore('metadata');
    
    const loadMeta = (key: string) => new Promise(res => {
      const req = metaStore.get(key);
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
    });

    const settings = await loadMeta(KEYS.APP_SETTINGS);
    cache.settings = settings || DEFAULT_SETTINGS;

    localStorage.setItem('muhasebe_migrated', 'true');
    return true;
  },

  getAppSettings: (): AppSettings => cache.settings,
  saveAppSettings: async (settings: AppSettings) => {
    cache.settings = settings;
    await persistMeta(KEYS.APP_SETTINGS, settings);
  },

  getStorageUsage: () => {
    // Estimating indexedDB usage
    const recordCount = (cache.products?.length || 0) + (cache.invoices?.length || 0) + (cache.transactions?.length || 0);
    return (recordCount * 0.5).toFixed(2); 
  },

  needsBackup: (): boolean => {
    const lastBackup = localStorage.getItem('last_backup_date');
    if (!lastBackup) return true;
    return (new Date().getTime() - new Date(lastBackup).getTime()) / (1000 * 60 * 60) > 24;
  },

  createBackup: () => {
    const now = new Date().toISOString();
    const data = { ...cache, backupDate: now };
    localStorage.setItem('last_backup_date', now);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Muhasebe_Pro_Full_Data_${now.split('T')[0]}.json`;
    link.click();
  },

  getCompanyInfo: () => JSON.parse(localStorage.getItem('muhasebe_company_info') || 'null'),
  saveCompanyInfo: (info: CompanyInfo) => localStorage.setItem('muhasebe_company_info', JSON.stringify(info)),

  // CRUD Operations (Sync in-memory, Async in-background)
  getProducts: (): Product[] => cache.products,
  addProduct: (product: Product) => {
    cache.products.push(product);
    persistStore(STORES.PRODUCTS, cache.products);
    return cache.products;
  },
  updateProduct: (updated: Product) => {
    const idx = cache.products.findIndex((p: any) => p.id === updated.id);
    if (idx !== -1) cache.products[idx] = updated;
    persistStore(STORES.PRODUCTS, cache.products);
    return cache.products;
  },
  deleteProduct: (id: string) => {
    cache.products = cache.products.filter((p: any) => p.id !== id);
    persistStore(STORES.PRODUCTS, cache.products);
    return cache.products;
  },

  getCustomers: (): Customer[] => cache.customers,
  addCustomer: (customer: Customer) => {
    cache.customers.push(customer);
    persistStore(STORES.CUSTOMERS, cache.customers);
    return cache.customers;
  },
  updateCustomer: (updated: Customer) => {
    const idx = cache.customers.findIndex((c: any) => c.id === updated.id);
    if (idx !== -1) cache.customers[idx] = updated;
    persistStore(STORES.CUSTOMERS, cache.customers);
    return cache.customers;
  },
  deleteCustomer: (id: string) => {
    cache.customers = cache.customers.filter((c: any) => c.id !== id);
    persistStore(STORES.CUSTOMERS, cache.customers);
    return cache.customers;
  },

  getInvoices: (): Invoice[] => cache.invoices,
  addInvoice: (invoice: Invoice) => {
    cache.invoices.push(invoice);
    persistStore(STORES.INVOICES, cache.invoices);
    
    // Auto Update Stocks if Paid
    if (invoice.status === InvoiceStatus.PAID) {
      invoice.items.forEach(item => {
        const p = cache.products.find((p: any) => p.id === item.productId);
        if (p) p.quantity -= item.quantity;
      });
      persistStore(STORES.PRODUCTS, cache.products);
      
      const trx: Transaction = {
        id: generateId('TRX-I-'),
        description: `Fatura Tahsilatı: ${invoice.customerName}`,
        amount: invoice.amount,
        type: TransactionType.INCOME,
        date: invoice.date,
        paymentMethod: invoice.paymentMethod
      };
      cache.transactions.unshift(trx);
      persistStore(STORES.TRANSACTIONS, cache.transactions);
    }
    return cache.invoices;
  },
  deleteInvoice: (id: string) => {
    cache.invoices = cache.invoices.filter((i: any) => i.id !== id);
    persistStore(STORES.INVOICES, cache.invoices);
    return cache.invoices;
  },
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => {
    const idx = cache.invoices.findIndex((i: any) => i.id === id);
    if (idx !== -1) cache.invoices[idx].status = status;
    persistStore(STORES.INVOICES, cache.invoices);
    return cache.invoices;
  },

  getTransactions: (): Transaction[] => cache.transactions,
  addTransaction: (t: Transaction) => {
    cache.transactions.unshift(t);
    persistStore(STORES.TRANSACTIONS, cache.transactions);
    return cache.transactions;
  },
  deleteTransaction: (id: string) => {
    cache.transactions = cache.transactions.filter((t: any) => t.id !== id);
    persistStore(STORES.TRANSACTIONS, cache.transactions);
    return cache.transactions;
  },
  updateTransaction: (updated: Transaction) => {
    const idx = cache.transactions.findIndex((t: any) => t.id === updated.id);
    if (idx !== -1) cache.transactions[idx] = updated;
    persistStore(STORES.TRANSACTIONS, cache.transactions);
    return cache.transactions;
  },
  deleteAllTransactions: () => {
    cache.transactions = [];
    persistStore(STORES.TRANSACTIONS, []);
    return [];
  },

  getProposals: (): Proposal[] => cache.proposals,
  addProposal: (p: Proposal) => {
    cache.proposals.push(p);
    persistStore(STORES.PROPOSALS, cache.proposals);
    return cache.proposals;
  },
  updateProposalStatus: (id: string, status: ProposalStatus) => {
    const idx = cache.proposals.findIndex((p: any) => p.id === id);
    if (idx !== -1) cache.proposals[idx].status = status;
    persistStore(STORES.PROPOSALS, cache.proposals);
    return cache.proposals;
  },
  deleteProposal: (id: string) => {
    cache.proposals = cache.proposals.filter((p: any) => p.id !== id);
    persistStore(STORES.PROPOSALS, cache.proposals);
    return cache.proposals;
  },

  getEmployees: (): Employee[] => cache.employees,
  addEmployee: (e: Employee) => {
    cache.employees.push(e);
    persistStore(STORES.EMPLOYEES, cache.employees);
    return cache.employees;
  },
  updateEmployee: (updated: Employee) => {
    const idx = cache.employees.findIndex((e: any) => e.id === updated.id);
    if (idx !== -1) cache.employees[idx] = updated;
    persistStore(STORES.EMPLOYEES, cache.employees);
    return cache.employees;
  },
  deleteEmployee: (id: string) => {
    cache.employees = cache.employees.filter((e: any) => e.id !== id);
    persistStore(STORES.EMPLOYEES, cache.employees);
    return cache.employees;
  },

  verifyCredentials: (username: string, pass: string) => {
    return username === 'admin' && pass === '123456';
  }
};
