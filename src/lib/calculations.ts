/**
 * Utilidades matemáticas y de negocio para comandas, satisfacción y conciliaciones
 */

export interface BranchSatisfactionData {
  satPct: number;
  totalScans: number;
}

/**
 * Calcula la satisfacción ponderada de una cadena de sucursales según volumen de escaneos
 */
export function calculateWeightedChainSatisfaction(branches: BranchSatisfactionData[]): number {
  if (!branches || branches.length === 0) return 100;
  
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const branch of branches) {
    const weight = Math.max(1, branch.totalScans);
    totalWeighted += branch.satPct * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 100;
  return Math.round((totalWeighted / totalWeight) * 10) / 10;
}

/**
 * Calcula la división en partes iguales de una cuenta con propina opcional
 */
export function calculateEqualSplit(
  total: number,
  diners: number,
  tipPercent: number = 0
): { subtotalPerDiner: number; tipPerDiner: number; totalPerDiner: number } {
  if (diners <= 0) diners = 1;
  if (total < 0) total = 0;

  const totalTip = total * (tipPercent / 100);
  const grandTotal = total + totalTip;

  return {
    subtotalPerDiner: Math.round((total / diners) * 100) / 100,
    tipPerDiner: Math.round((totalTip / diners) * 100) / 100,
    totalPerDiner: Math.round((grandTotal / diners) * 100) / 100,
  };
}

export interface SplitItem {
  id: string;
  name: string;
  price: number;
  sharedBy: string[]; // Nombres o IDs de comensales
}

/**
 * Calcula la división por consumo individual con prorrateo exacto de platillos al centro
 */
export function calculateItemizedSplit(
  items: SplitItem[],
  tipPercent: number = 0
): Record<string, { subtotal: number; tip: number; total: number }> {
  const result: Record<string, { subtotal: number; tip: number; total: number }> = {};

  for (const item of items) {
    const participants = item.sharedBy.length > 0 ? item.sharedBy : ['Anónimo'];
    const pricePerPerson = item.price / participants.length;

    for (const person of participants) {
      if (!result[person]) {
        result[person] = { subtotal: 0, tip: 0, total: 0 };
      }
      result[person].subtotal += pricePerPerson;
    }
  }

  // Redondear y aplicar propina
  for (const person of Object.keys(result)) {
    const subtotal = Math.round(result[person].subtotal * 100) / 100;
    const tip = Math.round(subtotal * (tipPercent / 100) * 100) / 100;
    result[person] = {
      subtotal,
      tip,
      total: Math.round((subtotal + tip) * 100) / 100,
    };
  }

  return result;
}

export interface CashReconciliationInput {
  initialFloat: number;
  cashSales: number;
  cashTips: number;
  authorizedWithdrawals: number;
  physicalCount: number;
}

export interface CashReconciliationResult {
  expected: number;
  physical: number;
  difference: number;
  status: 'balanced' | 'surplus' | 'shortage';
}

/**
 * Ejecuta el cálculo contable de arqueo y conciliación de caja (Corte Z)
 */
export function calculateCashReconciliation(
  input: CashReconciliationInput
): CashReconciliationResult {
  const expected = Math.round((input.initialFloat + input.cashSales + input.cashTips - input.authorizedWithdrawals) * 100) / 100;
  const physical = Math.round(input.physicalCount * 100) / 100;
  const difference = Math.round((physical - expected) * 100) / 100;

  let status: 'balanced' | 'surplus' | 'shortage' = 'balanced';
  if (difference > 0.05) {
    status = 'surplus';
  } else if (difference < -0.05) {
    status = 'shortage';
  }

  return {
    expected,
    physical,
    difference,
    status,
  };
}

