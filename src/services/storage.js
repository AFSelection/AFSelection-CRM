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

export async function fetchSiteSetting(key, defaultValue) {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error || !data || data.value === null || data.value === undefined) return defaultValue;
    return data.value;
  } catch {
    return defaultValue;
  }
}

export async function saveSiteSetting(key, value) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value });
  if (error) {
    console.error(`Error saving site setting ${key}:`, error);
    throw error;
  }
}

export async function fetchSections() {
  const sections = await fetchSiteSetting('site_sections', null);
  if (Array.isArray(sections) && sections.length > 0) {
    return sections;
  }
  return INITIAL_SECTIONS;
}

export async function saveSectionsDB(sections) {
  await saveSiteSetting('site_sections', sections);
}


export const DEFAULT_STAGGERED_SHOWCASE = {
  title: 'No Somos un Concesionario Tradicional',
  description: 'Facilitamos la compra y venta de vehículos y propiedades de forma directa. Revisamos cada publicación para garantizar información transparente y un proceso ágil.',
  buttonText: 'Explorar Todo el Catálogo',
  cards: [
    {
      id: 'c1',
      title: 'Porsche 911 GT3 RS',
      subtitle: 'Edición Limitada 2023',
      image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'c2',
      title: 'Villa Nordelta',
      subtitle: 'Residencia sobre el lago',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'c3',
      title: 'BMW M4 Competition',
      subtitle: '510 HP / 0km',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
    }
  ]
};

export const DEFAULT_TESTIMONIALS_SECTION = {
  badge: 'CLIENTES FELICES • AF SELECT',
  title: 'LO QUE DICEN QUIENES CONFÍAN EN NOSOTROS',
  description: 'Facilitamos la compra, venta e inversión de activos de alta gama con transparencia absoluta y atención directa en Tucumán, Salta y Buenos Aires.',
  rating: '5.0',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=AF+Select+Tucuman',
  reviews: [
    {
      id: 'r1',
      rating: '5.0',
      quote: 'Le compré la Hilux sin verla en persona. Me mandó video, kilometraje real y la historia oficial de servicios.',
      author: 'Martín R.',
      location: 'San Miguel de Tucumán',
      tag: 'COMPRA AUTOMOTRIZ',
      date: 'Hilux SRX 4x4',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'r2',
      rating: '5.0',
      quote: 'Invertí en Torre Alem por recomendación. Reportes de avance de obra mes a mes sin falta. Excelente atención.',
      author: 'Carolina D.',
      location: 'Buenos Aires',
      tag: 'INVERSIÓN INMOBILIARIA',
      date: 'Desarrollo Alem',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'r3',
      rating: '5.0',
      quote: 'Vendí mi departamento en Yerba Buena en menos de 20 días. Tasación impecable y escribanía ultra rápida.',
      author: 'Gonzalo S.',
      location: 'Yerba Buena, Tucumán',
      tag: 'VENTA INMOBILIARIA',
      date: 'Residencia Premium',
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    }
  ]
};

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
