import React from 'react';
import { Car, Home, Layers, Inbox, DollarSign, Plus, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function DashboardView({ data, setActiveTab, onOpenAddListing }) {
  const listings = data.listings || [];
  const leads = data.leads || [];
  const sections = data.sections || [];

  const totalValuationUSD = listings
    .filter((l) => (l.currency || 'USD') === 'USD')
    .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const totalValuationARS = listings
    .filter((l) => l.currency === 'ARS')
    .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const autoListings = listings.filter((l) => l.sectionId === 'autos').length;
  const propListings = listings.filter((l) => l.sectionId === 'propiedades').length;
  const pendingLeads = leads.filter((l) => l.status === 'Pending').length;

  const formatPrice = (val, currency = 'USD') => {
    return `${currency} ${Number(val || 0).toLocaleString('es-AR')}`;
  };

  const getListingTitle = (listingId) => {
    if (!listingId) return 'Venta / Publicación Directa';
    const item = listings.find((l) => l.id === listingId);
    return item ? item.title : 'Unidad no disponible';
  };

  return (
    <div className="space-y-8 font-body">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">Panel de Control</h1>
          <p className="text-sm text-primary/45 mt-1 leading-relaxed">
            Visión general del inventario, leads entrantes y secciones activas en AF Select.
          </p>
        </div>

        <button
          onClick={onOpenAddListing}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-full shadow-md cursor-pointer transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Publicación</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        
        {/* KPI 1 */}
        <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm min-w-0">
          <div className="bg-bg-canvas text-primary p-3 rounded-xl flex-shrink-0">
            <Car className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-primary tracking-tight leading-none">
              {listings.length}
            </div>
            <div className="text-[10px] font-extrabold tracking-wider text-primary/40 uppercase mt-1.5 truncate">
              Publicaciones ({autoListings} Autos / {propListings} Prop.)
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm min-w-0">
          <div className="bg-accent-emerald/10 text-accent-emerald p-3 rounded-xl flex-shrink-0">
            <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-primary tracking-tight leading-none">
              {leads.length}
            </div>
            <div className="text-[10px] font-extrabold tracking-wider text-primary/40 uppercase mt-1.5 truncate">
              Consultas ({pendingLeads} Pendientes)
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm min-w-0">
          <div className="bg-primary/5 text-primary/75 p-3 rounded-xl flex-shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-black text-primary tracking-tight leading-none">
              {sections.length}
            </div>
            <div className="text-[10px] font-extrabold tracking-wider text-primary/40 uppercase mt-1.5 truncate">
              Secciones Activas
            </div>
          </div>
        </div>

        {/* KPI 4 - Valorización USD */}
        <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm min-w-0">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-base sm:text-lg font-black text-emerald-600 tracking-tight leading-tight truncate"
              title={formatPrice(totalValuationUSD, 'USD')}
            >
              {formatPrice(totalValuationUSD, 'USD')}
            </div>
            <div className="text-[10px] font-extrabold tracking-wider text-primary/40 uppercase mt-1 truncate">
              Valorización USD
            </div>
          </div>
        </div>

        {/* KPI 5 - Valorización ARS */}
        <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm min-w-0">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-base sm:text-lg font-black text-amber-600 tracking-tight leading-tight truncate"
              title={formatPrice(totalValuationARS, 'ARS')}
            >
              {formatPrice(totalValuationARS, 'ARS')}
            </div>
            <div className="text-[10px] font-extrabold tracking-wider text-primary/40 uppercase mt-1 truncate">
              Valorización ARS
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-br from-primary to-[#252830] border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg text-white">
        <div className="space-y-1">
          <h3 className="text-base font-bold tracking-wide">Gestión Dinámica de Secciones & Categorías</h3>
          <p className="text-xs text-white/60 leading-relaxed max-w-[580px]">
            ¿Vas a vender Barcos, Motos o Terrenos? Creá nuevas secciones en tiempo real para que aparezcan en el cliente.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('sections')}
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-bg-canvas text-primary text-[10px] font-extrabold uppercase tracking-widest py-3 px-5 rounded-full shadow-md cursor-pointer transition-all duration-200 self-start md:self-auto"
        >
          <span>Administrar Secciones</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white border border-border-light rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border-light flex items-center justify-between">
          <h3 className="text-xs font-extrabold tracking-widest text-primary/65 uppercase">
            Últimas Consultas de Clientes (Leads)
          </h3>
          <button
            onClick={() => setActiveTab('leads')}
            className="text-[10px] font-extrabold tracking-widest text-primary hover:text-primary/70 uppercase cursor-pointer"
          >
            Ver Todos
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="p-10 text-center text-sm font-semibold text-primary/30">
            No hay consultas registradas aún.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-canvas border-b border-border-light">
                    <th className="px-6 py-3.5 text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">Cliente</th>
                    <th className="px-6 py-3.5 text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">Publicación Interesada</th>
                    <th className="px-6 py-3.5 text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">Teléfono</th>
                    <th className="px-6 py-3.5 text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">Fecha</th>
                    <th className="px-6 py-3.5 text-[10px] font-extrabold tracking-widest text-primary/45 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {leads.slice(0, 5).map((lead) => (
                    <tr key={lead.id} className="hover:bg-bg-canvas/30 transition-colors">
                      <td className="px-6 py-4.5">
                        <span className="font-bold text-primary block text-sm">{lead.name}</span>
                        <span className="text-xs text-primary/40 block mt-0.5">{lead.email}</span>
                      </td>
                      <td className="px-6 py-4.5 text-sm text-primary/80 font-medium">
                        {getListingTitle(lead.listing_id || lead.listingId)}
                      </td>
                      <td className="px-6 py-4.5 text-sm text-primary/60 font-medium">{lead.phone}</td>
                      <td className="px-6 py-4.5 text-xs text-primary/50 font-bold">
                        {new Date(lead.created_at || lead.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                          lead.status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : lead.status === 'Contacted'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {lead.status === 'Pending' ? 'Pendiente' : lead.status === 'Contacted' ? 'Contactado' : 'Cerrado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stack Card View */}
            <div className="block md:hidden divide-y divide-border-light">
              {leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="p-5 space-y-3.5 hover:bg-bg-canvas/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-primary">{lead.name}</h4>
                      <span className="text-xs text-primary/40">{lead.email}</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                      lead.status === 'Pending'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : lead.status === 'Contacted'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {lead.status === 'Pending' ? 'Pendiente' : lead.status === 'Contacted' ? 'Contactado' : 'Cerrado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div>
                      <span className="text-[9px] font-extrabold tracking-wider text-primary/30 uppercase block">Publicación</span>
                      <span className="text-primary/75 font-semibold mt-0.5 block truncate max-w-[140px]">
                        {getListingTitle(lead.listing_id || lead.listingId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-extrabold tracking-wider text-primary/30 uppercase block">Teléfono</span>
                      <span className="text-primary/75 font-semibold mt-0.5 block">{lead.phone}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-primary/30 font-bold pt-1.5 flex items-center justify-between">
                    <span>ID: #{lead.id.substring(0, 8)}</span>
                    <span>{new Date(lead.created_at || lead.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
