
import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Phone, Calendar, DollarSign, Edit, Trash2, ArrowUpRight, CheckCircle2, Building2, Wallet, AlertTriangle, X } from 'lucide-react';
import { Employee, Transaction, TransactionType, PaymentMethod } from '../types';
import { storageService, generateId } from '../services/storageService';
import Modal from '../components/Modal';

const Personnel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '', position: '', salary: 0, phone: '', startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE'
  });

  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({
    isOpen: false, id: '', name: ''
  });

  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, employee: Employee | null}>({
    isOpen: false, employee: null
  });
  
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0], method: PaymentMethod.BANK_TRANSFER, note: ''
  });

  useEffect(() => {
    refreshList();
  }, []);

  const refreshList = () => {
    setEmployees([...storageService.getEmployees()]);
  };

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      setFormData({ ...employee });
    } else {
      setEditingId(null);
      setFormData({ fullName: '', position: '', salary: 0, phone: '', startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.salary) return;
    if (editingId) {
      storageService.updateEmployee({ ...formData as Employee, id: editingId });
    } else {
      storageService.addEmployee({ ...formData as Employee, id: generateId('EMP-'), status: 'ACTIVE' });
    }
    refreshList();
    setIsModalOpen(false);
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      storageService.deleteEmployee(deleteModal.id);
      refreshList();
      setDeleteModal({ isOpen: false, id: '', name: '' });
    }
  };

  const openPaymentModal = (employee: Employee) => {
    const today = new Date();
    setPaymentModal({ isOpen: true, employee });
    setPaymentForm({
        date: today.toISOString().split('T')[0],
        method: PaymentMethod.BANK_TRANSFER, 
        note: `${today.toLocaleString('tr-TR', { month: 'long' })} ${today.getFullYear()} Maaş Ödemesi`
    });
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = paymentModal.employee;
    if (!emp) return;
    storageService.addTransaction({
        id: generateId('TRX-SALARY-'),
        description: `Maaş Ödemesi: ${emp.fullName} - ${paymentForm.note}`,
        amount: emp.salary,
        type: TransactionType.EXPENSE,
        date: paymentForm.date,
        paymentMethod: paymentForm.method
    });
    setPaymentModal({ isOpen: false, employee: null });
    alert("Maaş ödemesi başarıyla gerçekleştirildi.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Personel Yönetimi</h1>
          <p className="text-gray-500">Çalışan bilgilerini ve hak edişlerini yönetin.</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all">
          <Plus size={20} /> Personel Ekle
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center relative group hover:shadow-xl transition-all duration-300">
             <button onClick={() => openModal(emp)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-blue-500 transition-colors">
                <Edit size={20}/>
             </button>
             
             <div className="w-24 h-24 bg-gray-50 rounded-[30px] flex items-center justify-center text-gray-300 font-black text-4xl mb-6 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                {emp.fullName[0]}
             </div>
             
             <h3 className="text-2xl font-black text-gray-900 tracking-tight">{emp.fullName}</h3>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{emp.position}</p>
             
             <div className="w-full border-t border-gray-50 my-6"></div>
             
             <div className="space-y-1 mb-8">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">AYLIK MAAŞ</p>
                <p className="text-3xl font-black text-gray-900 tracking-tighter">₺{emp.salary.toLocaleString('tr-TR')}</p>
             </div>
             
             <button 
                onClick={() => openPaymentModal(emp)} 
                className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-[25px] font-black text-sm uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
             >
                Maaş Öde
             </button>
             
             <button 
                onClick={() => openDeleteModal(emp.id, emp.fullName)} 
                className="mt-6 text-[10px] font-black text-gray-300 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
             >
                Personeli Çıkar
             </button>
          </div>
        ))}
        {employees.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-300">
                <Briefcase size={64} className="mx-auto mb-4 opacity-10" />
                <p className="font-bold uppercase tracking-widest">Henüz personel kaydı bulunmuyor</p>
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Bilgileri Düzenle" : "Yeni Kayıt"}>
        <form onSubmit={handleSave} className="space-y-4">
           <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Ad Soyad</label><input type="text" required className="w-full p-3 border rounded-xl font-bold focus:ring-2 ring-blue-500 outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}/></div>
           <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Pozisyon</label><input type="text" required className="w-full p-3 border rounded-xl font-bold focus:ring-2 ring-blue-500 outline-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}/></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Maaş (₺)</label><input type="number" required className="w-full p-3 border rounded-xl font-bold focus:ring-2 ring-blue-500 outline-none" value={formData.salary} onChange={e => setFormData({...formData, salary: Number(e.target.value)})}/></div>
           </div>
           <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 uppercase tracking-widest text-sm">Kaydet</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })} title="Personeli Çıkar">
         <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle size={40} />
            </div>
            <p className="text-gray-600 font-medium"><strong>{deleteModal.name}</strong> isimli personeli kalıcı olarak çıkarmak istediğinize emin misiniz?</p>
            <div className="flex gap-3">
               <button onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">İPTAL</button>
               <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all">EVET, ÇIKAR</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({isOpen: false, employee: null})} title="Maaş Ödemesi">
         {paymentModal.employee && (
             <form onSubmit={handleConfirmPayment} className="space-y-6">
                 <div className="bg-emerald-50 p-6 rounded-2xl flex justify-between items-center border border-emerald-100">
                    <div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Personel</p><p className="font-bold text-emerald-900 text-lg">{paymentModal.employee.fullName}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tutar</p><p className="font-black text-emerald-900 text-2xl tracking-tighter">₺{paymentModal.employee.salary.toLocaleString()}</p></div>
                 </div>
                 <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">Açıklama / Not</label><input type="text" required className="w-full p-3 border rounded-xl font-bold focus:ring-2 ring-emerald-500 outline-none" value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})}/></div>
                 <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 uppercase tracking-widest">ÖDEMEYİ TAMAMLA</button>
             </form>
         )}
      </Modal>
    </div>
  );
};

export default Personnel;
