"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

// Normalde bu veriler DB'den gelecek
const initialPitches = [
  {
    id: "pitch-1",
    name: "Saha 1 (Kapalı)",
    openTime: "09:00",
    closeTime: "23:00",
    slotDurationMinutes: 60,
    slotOffsetMinutes: 0,
    isActive: true,
  },
  {
    id: "pitch-2",
    name: "Saha 2 (Açık)",
    openTime: "09:00",
    closeTime: "23:00",
    slotDurationMinutes: 60,
    slotOffsetMinutes: 30,
    isActive: true,
  }
];

export default function AdminPitches() {
  const [pitches, setPitches] = useState(initialPitches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPitch, setEditingPitch] = useState<any>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Saha başarıyla kaydedildi! (Geliştirme aşamasında mock işlem)");
    setIsModalOpen(false);
  };

  const openNewPitchModal = () => {
    setEditingPitch(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pitch: any) => {
    setEditingPitch(pitch);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sahalar & Saatler</h1>
          <p className="text-slate-500 mt-1">İşletmenize ait sahaları ve çalışma ofsetlerini yönetin.</p>
        </div>
        <button 
          onClick={openNewPitchModal}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus size={18} />
          Yeni Saha Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 font-medium">Saha Adı</th>
              <th className="py-4 px-6 font-medium">Çalışma Saatleri</th>
              <th className="py-4 px-6 font-medium">Seans & Ofset</th>
              <th className="py-4 px-6 font-medium">Durum</th>
              <th className="py-4 px-6 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {pitches.map((pitch) => (
              <tr key={pitch.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 font-medium text-slate-800">{pitch.name}</td>
                <td className="py-4 px-6 text-slate-600">{pitch.openTime} - {pitch.closeTime}</td>
                <td className="py-4 px-6 text-slate-600">
                  {pitch.slotDurationMinutes} dk (Ofset: {pitch.slotOffsetMinutes} dk)
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pitch.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                    {pitch.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button onClick={() => openEditModal(pitch)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ekle/Düzenle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingPitch ? 'Sahayı Düzenle' : 'Yeni Saha Ekle'}</h3>
                <p className="text-sm text-slate-500 mt-1">Saha özelliklerini ve çalışma saatlerini belirleyin.</p>
              </div>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Saha Adı</label>
                <input 
                  type="text" 
                  defaultValue={editingPitch?.name}
                  required
                  className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Örn: Saha 1 (Kapalı)" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Açılış Saati</label>
                  <input type="time" defaultValue={editingPitch?.openTime || "09:00"} required className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kapanış Saati</label>
                  <input type="time" defaultValue={editingPitch?.closeTime || "23:00"} required className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seans Süresi (Dk)</label>
                  <select defaultValue={editingPitch?.slotDurationMinutes || 60} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value={30}>30 Dakika</option>
                    <option value={60}>60 Dakika</option>
                    <option value={90}>90 Dakika</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Ofseti (Dk)</label>
                  <select defaultValue={editingPitch?.slotOffsetMinutes || 0} className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value={0}>0 (Saat Başı - 14:00)</option>
                    <option value={15}>15 Geçe (14:15)</option>
                    <option value={30}>Buçukta (14:30)</option>
                    <option value={45}>45 Geçe (14:45)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Örn: "Buçukta" seçilirse seanslar 09:30, 10:30 diye ilerler.</p>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {editingPitch ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
