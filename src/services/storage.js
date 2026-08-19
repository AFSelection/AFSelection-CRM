import { supabase } from './supabase';

export const INITIAL_SECTIONS = [
  {
    id: 'autos',
    name: 'Autos',
    slug: 'autos',
    icon: 'Car',
    categories: ['SUV', 'Sedán', 'Hatchback', 'Deportivo', 'Pick-up / Utilitarios']
  },
  {
    id: 'propiedades',
    name: 'Propiedades',
    slug: 'propiedades',
    icon: 'Home',
    categories: ['Casas', 'Departamentos', 'PH', 'Terrenos / Lotes', 'Oficinas & Locales']
  },
  {
    id: 'inversiones',
    name: 'Inversiones',
    slug: 'inversiones',
    icon: 'TrendingUp',
    categories: ['Desarrollo', 'Renta', 'Pozo', 'Constructivo', 'Comercial']
  }
];

export async function fetchListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
  return (data || []).map(mapListingFromDB);
}

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
  return (data || []).map(mapLeadFromDB);
}

export async function saveListingDB(listing) {
  const dbData = mapListingToDB(listing);
  const { error } = await supabase
    .from('listings')
    .upsert(dbData);
  if (error) throw error;
}

export async function deleteListingDB(id) {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function saveLeadDB(lead) {
  const dbData = mapLeadToDB(lead);
  const { error } = await supabase
    .from('leads')
    .upsert(dbData);
  if (error) throw error;
}

export async function deleteLeadDB(id) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

function mapListingFromDB(db) {
  if (!db) return null;
  return {
    ...db,
    sectionId: db.section_id,
    createdAt: db.created_at,
    isOffer: db.is_offer,
    oldPrice: db.old_price,
    operationType: db.operation_type || 'Venta',
    showAddress: db.show_address ?? true
  };
}

function mapListingToDB(js) {
  if (!js) return null;
  const db = { ...js };
  db.section_id = js.sectionId;
  db.created_at = js.createdAt || new Date().toISOString();
  db.is_offer = js.isOffer;
  db.old_price = js.oldPrice;
  db.operation_type = js.operationType || 'Venta';
  db.show_address = js.showAddress ?? true;

  // Clean up React state fields and map correctly
  delete db.sectionId;
  delete db.createdAt;
  delete db.isOffer;
  delete db.oldPrice;
  delete db.operationType;
  delete db.showAddress;
  
  // Make sure array is passed
  if (typeof db.images === 'string') {
    db.images = db.images.split('\n').map(s => s.trim()).filter(Boolean);
  }
  if (typeof db.videos === 'string') {
    db.videos = db.videos.split('\n').map(s => s.trim()).filter(Boolean);
  }
  
  return db;
}

function mapLeadFromDB(db) {
  if (!db) return null;
  return {
    ...db,
    listingId: db.listing_id,
    createdAt: db.created_at
  };
}

function mapLeadToDB(js) {
  if (!js) return null;
  const db = { ...js };
  db.listing_id = js.listingId;
  db.created_at = js.createdAt || new Date().toISOString();
  delete db.listingId;
  delete db.createdAt;
  return db;
}
