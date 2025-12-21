import { supabase } from './supabaseClient';
import { Product, Customer, Invoice, Transaction, Proposal, InvoiceStatus, ProposalStatus } from '../types';

// Bu servis, storageService yerine kullanılacak olan Bulut Veritabanı servisidir.
// Kullanmak için sayfalardaki import'ları değiştirmek gerekir.

export const supabaseService = {
  
  // --- Products ---
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    return data || [];
  },

  async addProduct(product: Product): Promise<Product[]> {
    const { error } = await supabase.from('products').insert([product]);
    if (error) console.error('Error adding product:', error);
    return this.getProducts();
  },

  async updateProduct(product: Product): Promise<Product[]> {
    const { error } = await supabase.from('products').update(product).eq('id', product.id);
    if (error) console.error('Error updating product:', error);
    return this.getProducts();
  },

  async deleteProduct(id: string): Promise<Product[]> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) console.error('Error deleting product:', error);
    return this.getProducts();
  },

  // --- Customers ---
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) console.error('Error fetching customers:', error);
    return data || [];
  },

  async addCustomer(customer: Customer): Promise<Customer[]> {
    const { error } = await supabase.from('customers').insert([customer]);
    if (error) console.error('Error adding customer:', error);
    return this.getCustomers();
  },

  async updateCustomer(customer: Customer): Promise<Customer[]> {
    const { error } = await supabase.from('customers').update(customer).eq('id', customer.id);
    if (error) console.error('Error updating customer:', error);
    return this.getCustomers();
  },

  async deleteCustomer(id: string): Promise<Customer[]> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error('Error deleting customer:', error);
    return this.getCustomers();
  },

  // --- Invoices ---
  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase.from('invoices').select('*');
    if (error) console.error('Error fetching invoices:', error);
    // Veritabanından gelen items JSON string olabilir, parse etmek gerekebilir (Supabase otomatik halleder genelde)
    return data || [];
  },

  async addInvoice(invoice: Invoice): Promise<Invoice[]> {
    const { error } = await supabase.from('invoices').insert([invoice]);
    if (error) console.error('Error adding invoice:', error);

    // Stok düşme işlemi (Backend Trigger ile yapılması daha güvenlidir ama frontend'den simüle ediyoruz)
    if (invoice.status === InvoiceStatus.PAID) {
      for (const item of invoice.items) {
        // Mevcut stoğu çek
        const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.productId).single();
        if (prod) {
          await supabase.from('products').update({ quantity: prod.quantity - item.quantity }).eq('id', item.productId);
        }
      }
    }

    return this.getInvoices();
  },

  async deleteInvoice(id: string): Promise<Invoice[]> {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) console.error('Error deleting invoice:', error);
    return this.getInvoices();
  },

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (error) console.error('Error fetching transactions:', error);
    return data || [];
  },

  async addTransaction(transaction: Transaction): Promise<Transaction[]> {
    const { error } = await supabase.from('transactions').insert([transaction]);
    if (error) console.error('Error adding transaction:', error);
    return this.getTransactions();
  },

  async updateTransaction(transaction: Transaction): Promise<Transaction[]> {
    const { error } = await supabase.from('transactions').update(transaction).eq('id', transaction.id);
    if (error) console.error('Error updating transaction:', error);
    return this.getTransactions();
  },

  async deleteTransaction(id: string): Promise<Transaction[]> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction:', error);
    return this.getTransactions();
  },

  // --- Proposals ---
  async getProposals(): Promise<Proposal[]> {
    const { data, error } = await supabase.from('proposals').select('*');
    if (error) console.error('Error fetching proposals:', error);
    return data || [];
  },

  async addProposal(proposal: Proposal): Promise<Proposal[]> {
    const { error } = await supabase.from('proposals').insert([proposal]);
    if (error) console.error('Error adding proposal:', error);
    return this.getProposals();
  },

  async updateProposalStatus(id: string, status: ProposalStatus): Promise<Proposal[]> {
    const { error } = await supabase.from('proposals').update({ status }).eq('id', id);
    if (error) console.error('Error updating proposal:', error);
    return this.getProposals();
  },

  async deleteProposal(id: string): Promise<Proposal[]> {
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) console.error('Error deleting proposal:', error);
    return this.getProposals();
  }
};