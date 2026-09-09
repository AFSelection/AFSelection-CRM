const LABEL_MAP = {
  fuel: 'Combustible',
  year: 'Año',
  kilometers: 'Kilometraje',
  kms: 'Kilometraje',
  transmission: 'Transmisión',
  condition: 'Estado',
  surface: 'Superficie',
  rooms: 'Ambientes',
  bedrooms: 'Dormitorios',
  bathrooms: 'Baños',
  garages: 'Cocheras',
  marca: 'Marca',
  modelo: 'Modelo',
  eslora: 'Eslora',
  motorhp: 'Potencia HP',
  motorHp: 'Potencia HP',
  enginehours: 'Horas de uso',
  engineHours: 'Horas de uso',
  developercompany: 'Desarrollador',
  developerCompany: 'Desarrollador',
  estimatedreturn: 'Retorno estimado',
  estimatedReturn: 'Retorno estimado',
  workprogress: 'Avance de obra',
  workProgress: 'Avance de obra',
  termmonths: 'Plazo',
  termMonths: 'Plazo',
  material: 'Material',
  warranty: 'Garantía',
  operationtype: 'Operación',
  operationType: 'Operación'
};

export function formatSpecLabel(key) {
  if (!key) return '';
  if (LABEL_MAP[key]) return LABEL_MAP[key];
  if (LABEL_MAP[key.toLowerCase()]) return LABEL_MAP[key.toLowerCase()];
  
  let clean = key
    .replace(/^custom_\d+_[a-z0-9]+_/i, '')
    .replace(/^custom_\d+_/i, '')
    .replace(/^custom_/i, '')
    .replace(/_/g, ' ')
    .trim();

  clean = clean.replace(/^\d+\s+/, '');

  if (!clean) return key;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function formatSpecSummary(specsObj) {
  if (!specsObj || typeof specsObj !== 'object') return null;

  const entries = Object.entries(specsObj).filter(([k, v]) => {
    if (v === null || v === undefined || String(v).trim() === '') return false;
    if (k.toLowerCase() === 'location') return false;
    return true;
  });

  if (entries.length === 0) return null;

  return entries.slice(0, 3).map(([k, v]) => {
    const kLower = k.toLowerCase();
    if (kLower === 'fuel') return String(v);
    if (kLower === 'year') return `Año ${v}`;
    if (kLower === 'kilometers' || kLower === 'kms') {
      const kmNum = Number(String(v).replace(/[^\d]/g, ''));
      return !isNaN(kmNum) && kmNum > 0 ? `${kmNum.toLocaleString('es-AR')} km` : String(v);
    }
    const label = formatSpecLabel(k);
    return `${label}: ${v}`;
  }).join(' • ');
}
