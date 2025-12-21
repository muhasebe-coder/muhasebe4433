import { Invoice, InvoiceStatus, Product, Transaction, TransactionType, Customer } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Laptop Pro X1', sku: 'TEK-001', quantity: 15, price: 25000, category: 'Elektronik', minLevel: 5, taxRate: 20 },
  { id: '2', name: 'Ofis Sandalyesi Ergonomik', sku: 'MOB-023', quantity: 4, price: 3500, category: 'Mobilya', minLevel: 10, taxRate: 10 },
  { id: '3', name: 'Kablosuz Mouse', sku: 'TEK-055', quantity: 45, price: 450, category: 'Elektronik', minLevel: 20, taxRate: 20 },
  { id: '4', name: 'Mekanik Klavye', sku: 'TEK-056', quantity: 8, price: 1200, category: 'Elektronik', minLevel: 10, taxRate: 20 },
  { id: '5', name: 'A4 Kağıt (Koli)', sku: 'KIRT-101', quantity: 100, price: 800, category: 'Kırtasiye', minLevel: 25, taxRate: 20 },
  { id: '6', name: 'Temel Gıda Paketi', sku: 'GID-001', quantity: 50, price: 500, category: 'Gıda', minLevel: 15, taxRate: 1 },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'ABC Teknoloji A.Ş.', type: 'CUSTOMER', phone: '0212 555 10 20', city: 'İstanbul', taxNumber: '1234567890' },
  { id: 'CUST-002', name: 'Yıldız İnşaat Ltd.', type: 'CUSTOMER', phone: '0312 444 30 40', city: 'Ankara' },
  { id: 'SUPP-001', name: 'Mega Toptan Gıda', type: 'SUPPLIER', phone: '0216 333 20 10', city: 'İstanbul' },
  { id: 'CUST-003', name: 'Ahmet Yılmaz (Şahıs)', type: 'CUSTOMER', phone: '0555 987 65 43', city: 'İzmir' },
];

export const MOCK_INVOICES: Invoice[] = [
  { 
    id: 'FAT-2024-001', 
    customerName: 'ABC Teknoloji A.Ş.', 
    date: '2024-05-10', 
    amount: 45000, 
    status: InvoiceStatus.PAID, 
    items: [
      { productId: '1', productName: 'Laptop Pro X1', quantity: 1, unitPrice: 25000, total: 25000, taxRate: 20 },
      { productId: '1', productName: 'Yazılım Lisansı', quantity: 1, unitPrice: 20000, total: 20000, taxRate: 20 }
    ] 
  },
  { 
    id: 'FAT-2024-002', 
    customerName: 'Yıldız İnşaat Ltd.', 
    date: '2024-05-12', 
    amount: 12500, 
    status: InvoiceStatus.PENDING, 
    items: [
      { productId: '2', productName: 'Ofis Sandalyesi', quantity: 5, unitPrice: 2500, total: 12500, taxRate: 10 }
    ] 
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-1', description: 'Web Sitesi Satışı (ABC Teknoloji A.Ş.)', amount: 25000, type: TransactionType.INCOME, date: '2024-05-01' },
  { id: 'TRX-2', description: 'Ofis Kirası', amount: 5000, type: TransactionType.EXPENSE, date: '2024-05-02' },
  { id: 'TRX-3', description: 'Donanım Satışı', amount: 12000, type: TransactionType.INCOME, date: '2024-05-05' },
  { id: 'TRX-4', description: 'Elektrik Faturası', amount: 1200, type: TransactionType.EXPENSE, date: '2024-05-10' },
  { id: 'TRX-5', description: 'Personel Maaşları', amount: 85000, type: TransactionType.EXPENSE, date: '2024-05-15' },
];