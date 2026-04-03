const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyJo_GSf8bH8W0jSRJusXsSycot0ZDPYOtwWCYfFK8YaaL4czodxGb13WVEIoJ54dug-g/exec';

export interface SheetAgente {
  id_agente: string;
  nombre: string;
  porcentaje_asesor: number;
  porcentaje_empresa: number;
  activo?: boolean;
}

export interface SheetVenta {
  id?: string;
  fecha_reserva: string;
  fecha_cierre: string;
  cliente: string;
  telefono: string;
  email: string;
  proyecto: string;
  unidad: string;
  tipo_inmueble: string;
  habitaciones: string;
  metraje: string;
  precio_m2: string;
  m2_total: string;
  precio_usd: string;
  tasa: string;
  precio_rd: string;
  porcentaje_comision: string;
  comision_bruta: string;
  vendedor_id: string;
  captador_id: string;
  porcentaje_captador: string;
  referido_porcentaje: string;
  asistencia_agente_id: string;
  porcentaje_asistencia: string;
  tipo_pago_comision: string;
  fecha_pago_1: string;
  fecha_pago_2: string;
  estado_venta: string;
  [key: string]: any;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getAgentes(): Promise<SheetAgente[]> {
  const data = await fetchJson<any>(`${ENDPOINT}?action=getAgentes`);
  // Handle both array and { data: [] } responses
  const list = Array.isArray(data) ? data : (data?.data ?? data?.agentes ?? []);
  return list.map((a: any) => ({
    id_agente: String(a.id_agente ?? a.id ?? ''),
    nombre: String(a.nombre ?? ''),
    porcentaje_asesor: Number(a.porcentaje_asesor ?? 50),
    porcentaje_empresa: Number(a.porcentaje_empresa ?? 50),
    activo: a.activo !== false,
  }));
}

export async function getVentas(): Promise<SheetVenta[]> {
  const data = await fetchJson<any>(`${ENDPOINT}?action=getVentas`);
  const list = Array.isArray(data) ? data : (data?.data ?? data?.ventas ?? []);
  return list;
}

export async function createVenta(payload: Record<string, any>): Promise<any> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script CORS workaround
    body: JSON.stringify({ action: 'createVenta', payload }),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json();
}
