"use client";

import { Save } from "lucide-react";

export default function AdminSettings() {
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert("Ayarlar başarıyla güncellendi! (Geliştirme aşamasında mock işlem)");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">İşletme Ayarları</h1>
        <p className="text-slate-500 mt-1">Sistem genelinde görünecek marka ve temel ayarlarınızı yapılandırın.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Marka Bilgileri</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">İşletme Adı</label>
                <input 
                  type="text" 
                  defaultValue="Yeşil Saha Tesisleri"
                  required
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Halısaha Adı" 
                />
                <p className="text-xs text-slate-500 mt-1">Uygulama menüsünde ve sayfa başlıklarında görünür.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Site Başlığı (SEO Title)</label>
                <input 
                  type="text" 
                  defaultValue="Yeşil Saha - Online Rezervasyon"
                  required
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="SEO Title" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
              <input 
                type="url" 
                className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                placeholder="https://..." 
              />
              <p className="text-xs text-slate-500 mt-1">Eğer boş bırakırsanız işletme adınızın baş harfi logo olarak kullanılır.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 mt-6 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">İletişim Bilgileri (Opsiyonel)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon Numarası</label>
                <input 
                  type="tel" 
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Müşteri İletişim Hattı" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta Adresi</label>
                <input 
                  type="email" 
                  className="w-full border border-slate-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="info@..." 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button 
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Save size={18} />
              Ayarları Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
