// Vietnamese currency and number formatting utilities

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Vietnamese tax calculation for HKD (Household Business)
export type BusinessType = 'goods' | 'services' | 'production';

export interface TaxRates {
  vat: number;
  pit: number; // Personal Income Tax (TNCN)
}

export const TAX_RATES: Record<BusinessType, TaxRates> = {
  goods: { vat: 1, pit: 0.5 },           // Bán hàng hóa: 1% GTGT + 0.5% TNCN
  services: { vat: 5, pit: 2 },          // Dịch vụ: 5% GTGT + 2% TNCN
  production: { vat: 3, pit: 1.5 },      // Sản xuất/vận tải/xây dựng: 3% GTGT + 1.5% TNCN
};

export const TAX_THRESHOLDS = {
  exemptionThreshold: 100_000_000,       // 100 triệu/năm - ngưỡng miễn thuế
  businessLicenseTiers: [
    { min: 500_000_000, fee: 1_000_000 },  // ≥500tr: 1 triệu
    { min: 300_000_000, fee: 500_000 },    // 300-500tr: 500k
    { min: 100_000_000, fee: 300_000 },    // 100-300tr: 300k
  ],
};

export function calculateTax(revenue: number, businessType: BusinessType): { vat: number; pit: number; total: number } {
  if (revenue <= TAX_THRESHOLDS.exemptionThreshold) {
    return { vat: 0, pit: 0, total: 0 };
  }
  
  const rates = TAX_RATES[businessType];
  const vat = revenue * (rates.vat / 100);
  const pit = revenue * (rates.pit / 100);
  
  return { vat, pit, total: vat + pit };
}

export function getBusinessLicenseFee(annualRevenue: number): number {
  for (const tier of TAX_THRESHOLDS.businessLicenseTiers) {
    if (annualRevenue >= tier.min) {
      return tier.fee;
    }
  }
  return 0;
}
