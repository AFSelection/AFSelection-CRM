import React, { useState, useEffect, useRef } from 'react';
import { Inbox, Phone, Mail, MessageSquare, Trash2, Clock } from 'lucide-react';
import { saveLeadDB, deleteLeadDB } from '../services/storage';
import ConfirmModal from './ConfirmModal';

function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative z-10">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-bg-canvas border border-border-light hover:border-primary text-xs font-bold text-primary rounded-xl py-2.5 px-4 flex items-center justify-between gap-2 cursor-pointer select-none transition-all duration-200 outline-none"
      >
        <span>{selectedOption?.label}</span>
        <span className="text-primary/30 text-[9px] transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1.5 bg-white border border-border-light rounded-xl shadow-xl z-20 min-w-[130px] overflow-hidden divide-y divide-bg-canvas">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-xs font-semibold cursor-pointer hover:bg-bg-canvas transition-colors ${
                opt.value === value ? 'bg-primary/5 text-primary font-bold' : 'text-primary/70'
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}


export default function LeadsManagerView({ data, setData, refreshData }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingId, setLoadingId] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isNotice: false,
    loading: false,
    onConfirmHandler: null
  });

  const showConfirmModal = ({ title, message, variant = 'danger', confirmText = 'Eliminar', onConfirm }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant,
      confirmText,
      cancelText: 'Cancelar',
      isNotice: false,
      loading: false,
      onConfirmHandler: async () => {
        setModalState((prev) => ({ ...prev, loading: true }));
        try {
          await onConfirm();
        } finally {
          setModalState((prev) => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const showNoticeModal = ({ title = 'Atención', message, variant = 'info' }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      variant,
      confirmText: 'Entendido',
      cancelText: '',
      isNotice: true,
      loading: false,
      onConfirmHandler: () => setModalState((prev) => ({ ...prev, isOpen: false }))
    });
  };

  const leads = data.leads || [];
  const listings = data.listings || [];

  const handleUpdateStatus = async (leadId, newStatus) => {
    setLoadingId(leadId);
    try {
      const targetLead = leads.find(l => l.id === leadId);
      if (!targetLead) return;

      const updatedLead = { ...targetLead, status: newStatus };
      await saveLeadDB(updatedLead);
      await refreshData();
    } catch (err) {
      showNoticeModal({
        title: 'Error',
        message: 'Ocurrió un error al actualizar el estado del lead.',
        variant: 'danger'
      });
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteLead = (leadId) => {
    showConfirmModal({
      title: '¿Eliminar Consulta?',
      message: '¿Estás seguro de eliminar este registro de consulta? Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmText: 'Eliminar Consulta',
      onConfirm: async () => {
        try {
          await deleteLeadDB(leadId);
          await refreshData();
        } catch (err) {
          showNoticeModal({
            title: 'Error',
            message: 'Ocurrió un error al eliminar el lead.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const getListingTitle = (listingId) => {
    if (!listingId) return 'Venta / Publicación Directa';
    const item = listings.find((l) => l.id === listingId);
    return item ? item.title : 'Unidad no disponible';
  };

  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 font-body">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
            Gestión de Consultas & Leads
          </h1>
          <p className="text-sm text-primary/45 mt-1 leading-relaxed">
            Mensajes de clientes recibidos desde las fichas de vehículos y propiedades del Marketplace.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4.5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-colors duration-200 ${
              statusFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white border border-border-light text-primary hover:bg-bg-canvas'
            }`}
          >
            Todas ({leads.length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-4.5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-colors duration-200 ${
              statusFilter === 'Pending'
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-border-light text-primary hover:bg-bg-canvas'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setStatusFilter('Contacted')}
            className={`px-4.5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-colors duration-200 ${
              statusFilter === 'Contacted'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-border-light text-primary hover:bg-bg-canvas'
            }`}
          >
            Contactados
          </button>
        </div>
      </div>

      {/* Leads List Container */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="bg-white border border-border-light rounded-3xl p-16 text-center shadow-sm">
            <Inbox className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <h3 className="font-bold text-base text-primary/70 mb-1">Sin Consultas Registradas</h3>
            <p className="text-xs text-primary/40">No hay consultas de clientes para el filtro seleccionado.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            // Clean phone to generate clean WhatsApp URL
            let cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
            // If it doesn't start with country code, default to Argentina (54)
            if (cleanPhone && !cleanPhone.startsWith('54') && cleanPhone.length <= 10) {
              cleanPhone = '54' + cleanPhone;
            }
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';

            return (
              <div
                key={lead.id}
                className={`bg-white border border-border-light rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative ${
                  loadingId === lead.id ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase ${
                        lead.status === 'Pending'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : lead.status === 'Contacted'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {lead.status === 'Pending' ? 'Pendiente' : lead.status === 'Contacted' ? 'Contactado' : 'Cerrado'}
                      </span>
                      <span className="text-[9px] font-extrabold tracking-wider bg-bg-canvas text-primary/50 border border-border-light px-3 py-1 rounded-full uppercase">
                        {lead.type === 'sell' ? 'Venta de Unidad' : 'Consulta Compra'}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-xl text-primary leading-none pt-1">
                      {lead.name}
                    </h3>
                    <div className="text-xs font-bold text-accent-red uppercase tracking-wider">
                      Interés: {getListingTitle(lead.listing_id || lead.listingId)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/30 sm:text-right">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(lead.created_at || lead.date).toLocaleString()}</span>
                  </div>
                </div>

                {/* Lead Message Notes */}
                <div className="bg-bg-canvas/50 border border-border-light/60 p-5 rounded-2xl text-sm text-primary/80 font-medium leading-relaxed italic whitespace-pre-line">
                  "{lead.notes || lead.message}"
                </div>

                {/* Action Buttons & Contact Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-border-light">
                  
                  {/* Contact Links */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs">
                    <div className="flex items-center gap-2 text-primary/60 font-semibold">
                      <Mail className="w-4.5 h-4.5 text-primary/35" />
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                        {lead.email || 'Sin correo electrónico'}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-primary/60 font-semibold">
                      <Phone className="w-4.5 h-4.5 text-primary/35" />
                      <span>{lead.phone}</span>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="flex items-center flex-wrap gap-2.5">
                    {cleanPhone && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          // Auto set status to Contacted when opening WhatsApp!
                          if (lead.status === 'Pending') {
                            handleUpdateStatus(lead.id, 'Contacted');
                          }
                        }}
                        className="inline-flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 hover:border-[#25D366]/40 text-[#25D366] text-xs font-extrabold uppercase tracking-wider py-2.5 px-4.5 rounded-xl cursor-pointer transition-all duration-200"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chatear</span>
                      </a>
                    )}

                    <CustomSelect
                      value={lead.status || 'Pending'}
                      onChange={(val) => handleUpdateStatus(lead.id, val)}
                      options={[
                        { label: 'Pendiente', value: 'Pending' },
                        { label: 'Contactado', value: 'Contacted' },
                        { label: 'Cerrado', value: 'Closed' }
                      ]}
                    />

                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-primary/30 hover:text-accent-red p-2.5 rounded-xl hover:bg-red-50 cursor-pointer transition-all duration-250"
                      title="Eliminar Lead"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Custom Confirm & Notice Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        variant={modalState.variant}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isNotice={modalState.isNotice}
        loading={modalState.loading}
        onConfirm={modalState.onConfirmHandler}
        onCancel={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

