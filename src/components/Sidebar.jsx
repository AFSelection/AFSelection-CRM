import React, { useState } from 'react';
import { LayoutDashboard, Car, Layers, Inbox, ExternalLink, LogOut, Menu, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, leadsCount, user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pendingLeads = leadsCount || 0;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'listings', name: 'Inventario / Publicaciones', icon: Car },
    { id: 'sections', name: 'Secciones y Categorías', icon: Layers },
    { id: 'leads', name: 'Consultas / Leads', icon: Inbox, badge: pendingLeads }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-primary text-white border-b border-white/5 flex items-center justify-between px-4 z-30 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-primary font-black text-sm w-8 h-8 rounded-lg flex items-center justify-center">
            AF
          </div>
          <span className="font-display font-bold text-sm tracking-wide">
            SELECT <span className="text-[10px] text-accent-red font-bold uppercase ml-1">CRM</span>
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white hover:text-white/80 p-1 outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel Container */}
      <aside
        className={`fixed inset-y-0 left-0 w-[270px] bg-primary text-white flex flex-col p-6 z-50 transform lg:transform-none lg:translate-x-0 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
          <div className="bg-white text-primary font-black text-base w-9 h-9 rounded-lg flex items-center justify-center">
            AF
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-base tracking-wide leading-none">
              AF SELECT
            </span>
            <span className="text-[9px] font-extrabold tracking-widest text-accent-red uppercase mt-1">
              PANEL DE CONTROL
            </span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex-1 space-y-2.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white text-primary font-black shadow-md'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-accent-red text-white' : 'bg-accent-red text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-left text-white/50 hover:text-white border border-dashed border-white/10 hover:border-white/30 transition-all duration-200 mt-6"
          >
            <ExternalLink className="w-5 h-5 flex-shrink-0 text-accent-red" />
            <span>Ver Sitio Web</span>
          </a>
        </nav>

        {/* Footer Admin Session Info */}
        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col overflow-hidden pr-2">
            <span className="text-[11px] font-black text-white truncate">
              {user?.email || 'Agustín Fidalgo'}
            </span>
            <span className="text-[9px] font-extrabold tracking-widest text-white/30 uppercase mt-0.5">
              Administrador
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="text-white/40 hover:text-accent-red p-2 rounded-full hover:bg-white/5 cursor-pointer transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
