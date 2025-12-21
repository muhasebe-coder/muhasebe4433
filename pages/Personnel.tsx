
import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Phone, Calendar, DollarSign, Edit, Trash2, ArrowUpRight, CheckCircle2, Building2, Wallet, AlertTriangle } from 'lucide-react';
import { Employee, Transaction, TransactionType, PaymentMethod } from '../types';
import { storageService, generateId } from '../services/storageService';
import Modal from '../components/Modal';

const Personnel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Employee Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    position: '',
    salary: 0,
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({
    isOpen: false,
    id: '',
    name: ''
  });

  // Salary Payment Modal State
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, employee: Employee | null}>({
    isOpen: false, 
    employee: null
  });
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    method: PaymentMethod.BANK_TRANSFER,
    note: ''
  });

  useEffect(() => {
    setEmployees(storageService.getEmployees());
  }, []);

  // --- CRUD Operations ---

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({ ...employee });
    } else {
      setEditingId(null);
      setFormData({
        fullName: '',
        position: '',
        salary: 0,
        phone: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.salary) return;

    if (editingId) {
      const updated: Employee = { ...formData as Employee, id: editingId };
      const newList = storageService.updateEmployee(updated);
      setEmployees(newList);
    } else {
      const newEmp: Employee = { 
          ...formData as Employee, 
          id: generateId('EMP-'),
          status: formData.status || 'ACTIVE' 
      };
      const newList = storageService.addEmployee(newEmp);
      setEmployees(newList);
    }
    setIsModalOpen(false);
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      const newList = storageService.deleteEmployee(deleteModal.id);
      setEmployees(newList);
      setDeleteModal({ isOpen: false, id: '', name: '' });
    }
  };

  // --- Payment Operations ---

  const openPaymentModal = (employee: Employee) => {
    const today = new Date();
    const currentMonth = today.toLocaleString('tr-TR', { month: 'long' });
    const currentYear = today.getFullYear();

    setPaymentModal({ isOpen: true, employee });
    setPaymentForm({
        date: today.toISOString().split('T')[0],
        method: PaymentMethod.BANK_TRANSFER, 
        note: `${currentMonth} ${currentYear} Maaş Ödemesi`
    });
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = paymentModal.employee;
    if (!emp) return;

    const transaction: Transaction = {
        id: generateId('TRX-SALARY-'),
        description: `${emp.fullName} - ${paymentForm.note}`,
        amount: emp.salary,
        type: TransactionType.EXPENSE,
        date: paymentForm.date,
        paymentMethod: paymentForm.method,
        maturityDate: ''
    };
    
    storageService.addTransaction(transaction);
    setPaymentModal({ isOpen: false, employee: null });
    alert("Maaş ödemesi başarıyla gerçekleştirildi ve Giderlere işlendi.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Personel Yönetimi</h1>
          <p className="text-gray-500">Çalışanlarınızı takip edin ve maaş ödemelerini yönetin.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          Personel Ekle
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
             <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">
                         {emp.fullName.substring(0, 1)}
                     </div>
                     <div>
                         <h3 className="font-bold text-gray-900">{emp.fullName}</h3>
                         <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{emp.position}</span>
                     </div>
                 </div>
                 <div className="flex gap-1">
                     <button onClick={() => openModal(emp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                     <button onClick={() => openDeleteModal(emp.id, emp.fullName)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                 </div>
             </div>

             <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400"/>
                    <span>Maaş: <strong>₺{emp.salary.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400"/>
                    <span>{emp.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400"/>
                    <span>Başlangıç: {emp.startDate}</span>
                </div>
             </div>

             <button 
                onClick={() => openPaymentModal(emp)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
             >
                <ArrowUpRight size={16} />
                Maaş Öde
             </button>
          </div>
        ))}
        
        {employees.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
               <Briefcase size={48} className="mx-auto mb-2 opacity-20" />
               <p>Henüz kayıtlı personel bulunmuyor.</p>
            </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Personel Düzenle" : "Personel Ekle"}>
        <form onSubmit={handleSave} className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
              <input 
                type="text" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon</label>
                <input 
                    type="text" required placeholder="Örn: Satış Temsilcisi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.position}
                    onChange={e => setFormData({...formData, position: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maaş (TL)</label>
                <input 
                    type="number" required min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.salary}
                    onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <input 
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
           </div>

           <div className="pt-2 flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">İptal</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Kaydet</button>
           </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })} title="Personeli Sil">
         <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100">
               <AlertTriangle className="shrink-0 mt-0.5 text-red-600" />
               <div className="text-sm">
                 <p className="font-bold">Dikkat!</p>
                 <p className="mt-1">"<strong>{deleteModal.name}</strong>" isimli personeli sistemden silmek üzeresiniz. Bu işlem geri alınamaz.</p>
               </div>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Vazgeç</button>
               <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-md transition-colors">Evet, Sil</button>
            </div>
         </div>
      </Modal>

      {/* Salary Payment Modal */}
      <Modal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({isOpen: false, employee: null})} title="Maaş Ödemesi Yap">
         {paymentModal.employee && (
             <form onSubmit={handleConfirmPayment} className="space-y-4">
                 <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm">
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <p className="text-sm text-emerald-800">Ödenecek Personel</p>
                        <p className="font-bold text-emerald-900">{paymentModal.employee.fullName}</p>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-xs text-emerald-700">Maaş Tutarı</p>
                        <p className="font-bold text-lg text-emerald-900">₺{paymentModal.employee.salary.toLocaleString()}</p>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
                    <input 
                        type="date" required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={paymentForm.date}
                        onChange={e => setPaymentForm({...paymentForm, date: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentForm({...paymentForm, method: PaymentMethod.BANK_TRANSFER})}
                          className={`p-3 rounded-lg border flex items-center gap-2 justify-center transition-all ${paymentForm.method === PaymentMethod.BANK_TRANSFER ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Building2 size={18} />
                            <span className="font-medium">Banka / Havale</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentForm({...paymentForm, method: PaymentMethod.CASH})}
                          className={`p-3 rounded-lg border flex items-center gap-2 justify-center transition-all ${paymentForm.method === PaymentMethod.CASH ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                        >
                            <Wallet size={18} />
                            <span className="font-medium">Nakit / Elden</span>
                        </button>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <input 
                        type="text" required
                        placeholder="Örn: Mayıs 2024 Maaş Ödemesi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={paymentForm.note}
                        onChange={e => setPaymentForm({...paymentForm, note: e.target.value})}
                    />
                 </div>

                 <div className="pt-2 flex gap-3">
                    <button type="button" onClick={() => setPaymentModal({isOpen: false, employee: null})} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Vazgeç</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-sm">Ödemeyi Onayla</button>
                 </div>
             </form>
         )}
      </Modal>
    </div>
  );
};

export default Personnel;
