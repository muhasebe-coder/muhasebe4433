
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum InvoiceStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  PROMISSORY_NOTE = 'PROMISSORY_NOTE'
}

export interface AppSettings {
  appName: string;
  primaryColor: string;
  isDarkMode: boolean;
  logoUrl?: string;
  visibleStats: {
    income: boolean;
    expense: boolean;
    profit: boolean;
    stock: boolean;
  };
}

export interface CompanyInfo {
  title: string;
  vkn: string;
  address: string;
  city: string;
}

export interface Customer {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  taxNumber?: string;
  taxOffice?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  category: string;
  minLevel: number;
  taxRate: number;
  imageUrl?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  salary: number;
  phone?: string;
  startDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerName: string;
  date: string;
  amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[]; 
  paymentMethod?: PaymentMethod;
  maturityDate?: string;
}

export interface Proposal {
  id: string;
  customerName: string;
  date: string;
  validUntil: string;
  amount: number;
  status: ProposalStatus;
  items: InvoiceItem[];
  notes?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  paymentMethod?: PaymentMethod;
  maturityDate?: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  lowStockCount: number;
  pendingInvoicesCount: number;
}
