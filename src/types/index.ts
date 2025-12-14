// Core business types for HKD management system

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  categoryId: string;
  unit: string;
  baseUnit: string;
  conversionRate: number; // e.g., 1 thùng = 24 chai
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  minStock: number;
  currentStock: number;
  warehouseId?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  membershipTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  totalSpent: number;
  receivables: number; // Công nợ phải thu
  paymentDueDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  payables: number; // Công nợ phải trả
  paymentDueDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface SaleOrder {
  id: string;
  code: string;
  customerId?: string;
  customerName?: string;
  items: SaleOrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'amount';
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  status: 'draft' | 'completed' | 'cancelled' | 'refunded';
  notes?: string;
  createdBy: string;
  createdAt: Date;
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

export type PaymentMethod = 'cash' | 'bank_transfer' | 'vietqr' | 'momo' | 'zalopay' | 'credit';

export interface CashbookEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  referenceId?: string; // Link to order, purchase, etc.
  referenceType?: 'sale' | 'purchase' | 'expense' | 'other';
  createdBy: string;
  createdAt: Date;
}

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

export interface RevenueByCategory {
  category: string;
  revenue: number;
  percentage: number;
}

export interface RevenueByTime {
  period: string;
  revenue: number;
  orders: number;
}
