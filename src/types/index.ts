// Core business types for HKD management system

/**
 * Product interface matching backend ProductDto
 */
export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  categoryName?: string;
  unitId: string;
  unitName?: string;
  baseUnitId?: string;
  baseUnitName?: string;
  conversionRate: number; // e.g., 1 thùng = 24 chai
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  minStock: number;
  currentStock: number;
  imageUrl?: string;
  isActive: boolean;
  isCombo: boolean;
  costMethod?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create product DTO for API requests
 */
export interface CreateProduct {
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  unitId: string;
  baseUnitId?: string;
  conversionRate?: number;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  minStock?: number;
  imageUrl?: string;
  isCombo?: boolean;
  costMethod?: string;
}

/**
 * Update product DTO for API requests
 */
export interface UpdateProduct {
  barcode?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  baseUnitId?: string;
  conversionRate?: number;
  costPrice?: number;
  salePrice?: number;
  wholesalePrice?: number;
  minStock?: number;
  imageUrl?: string;
  isActive?: boolean;
  isCombo?: boolean;
  costMethod?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
}

/**
 * Customer interface matching backend Customer entity
 */
export interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  membershipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  points: number;
  totalSpent: number;
  receivables: number; // Công nợ phải thu
  paymentDueDate?: string;
  zaloId?: string;
  birthday?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Supplier interface matching backend Supplier entity
 */
export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  payables: number; // Công nợ phải trả
  paymentDueDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sale order interface matching backend SaleOrder entity
 */
export interface SaleOrder {
  id: string;
  code: string;
  customerId?: string;
  customerName?: string;
  items: SaleOrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'Percent' | 'Amount';
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  status: 'Draft' | 'Completed' | 'Cancelled' | 'Refunded';
  notes?: string;
  createdBy: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  total: number;
}

/**
 * Payment method enum matching backend PaymentMethod
 */
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'VietQR' | 'Momo' | 'ZaloPay' | 'Credit';

/**
 * Cashbook entry interface matching backend CashbookEntry entity
 */
export interface CashbookEntry {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  referenceId?: string; // Link to order, purchase, etc.
  referenceType?: string; // SaleOrder, PurchaseOrder, etc.
  bankAccount?: string;
  transactionDate: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Dashboard stats interface matching backend DashboardStatsDto
 */
export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  todayProfit: number;
  monthRevenue: number;
  monthOrders: number;
  monthProfit: number;
  lowStockProducts: number;
  pendingReceivables: number;
  pendingPayables: number;
}

/**
 * Revenue by category interface matching backend RevenueByCategoryDto
 */
export interface RevenueByCategory {
  category: string;
  revenue: number;
  percentage: number;
}

/**
 * Revenue by time interface matching backend RevenueByTimeDto
 */
export interface RevenueByTime {
  period: string;
  revenue: number;
  orders: number;
}
