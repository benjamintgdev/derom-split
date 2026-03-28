import { CalculoVenta, HistorialComisionAgente, SplitVigente } from '@/types';

export function getSplitVigenteByDate(
  historial: HistorialComisionAgente[],
  fecha: string
): SplitVigente | null {
  const fechaDate = new Date(fecha);
  const vigente = historial
    .filter(h => {
      const desde = new Date(h.vigencia_desde);
      const hasta = h.vigencia_hasta ? new Date(h.vigencia_hasta) : null;
      return fechaDate >= desde && (!hasta || fechaDate <= hasta);
    })
    .sort((a, b) => new Date(b.vigencia_desde).getTime() - new Date(a.vigencia_desde).getTime())[0];

  if (!vigente) return null;
  return {
    porcentaje_asesor: vigente.porcentaje_asesor,
    porcentaje_empresa: vigente.porcentaje_empresa,
  };
}

export function calcularVenta(params: {
  precio_usd: number;
  tasa: number;
  porcentaje_comision_venta: number;
  porcentaje_referido: number;
  porcentaje_captador: number;
  split_vendedor_asesor: number;
  split_vendedor_empresa: number;
  split_captador_asesor: number;
  split_captador_empresa: number;
}): CalculoVenta {
  const precio_rd = params.precio_usd * params.tasa;
  const comision_bruta = params.precio_usd * (params.porcentaje_comision_venta / 100);
  const monto_referido = comision_bruta * (params.porcentaje_referido / 100);
  const captador_bruto = comision_bruta * (params.porcentaje_captador / 100);
  const vendedor_bruto = comision_bruta - monto_referido - captador_bruto;

  const vendedor_agente = vendedor_bruto * (params.split_vendedor_asesor / 100);
  const vendedor_empresa = vendedor_bruto * (params.split_vendedor_empresa / 100);
  const captador_agente = captador_bruto * (params.split_captador_asesor / 100);
  const captador_empresa = captador_bruto * (params.split_captador_empresa / 100);
  const empresa_total = vendedor_empresa + captador_empresa;

  return {
    precio_rd,
    comision_bruta,
    monto_referido,
    captador_bruto,
    vendedor_bruto,
    vendedor_agente,
    vendedor_empresa,
    captador_agente,
    captador_empresa,
    empresa_total,
  };
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
