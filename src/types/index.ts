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
  thumbnailUrl?: string;
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
  thumbnailUrl?: string;
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
  thumbnailUrl?: string;
  isActive?: boolean;
  isCombo?: boolean;
  costMethod?: string;
}

/**
 * Category interface matching backend Category entity
 */
export interface Category {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Unit of Measure interface matching backend UnitOfMeasure entity
 */
export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
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

/**
 * Receivable interface matching backend ReceivableDto
 */
export interface Receivable {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerPhone?: string;
  totalReceivables: number;
  overdueAmount: number;
  paymentDueDate?: string;
  overdueDays: number;
  isOverdue: boolean;
}

/**
 * Receivable transaction interface matching backend ReceivableTransactionDto
 */
export interface ReceivableTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'Invoice' | 'Payment' | 'Adjustment' | 'Refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  paymentMethod: PaymentMethod;
  dueDate?: string;
  transactionDate: string;
  referenceType?: string;
  referenceId?: string;
  referenceCode?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Create receivable payment DTO
 */
export interface CreateReceivablePayment {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  transactionDate?: string;
  createdBy?: string;
}

/**
 * Create receivable adjustment DTO
 */
export interface CreateReceivableAdjustment {
  customerId: string;
  amount: number; // Positive for increase, negative for decrease
  description?: string;
  transactionDate?: string;
  createdBy?: string;
}

/**
 * Payable interface matching backend PayableDto
 */
export interface Payable {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierPhone?: string;
  totalPayables: number;
  overdueAmount: number;
  paymentDueDate?: string;
  overdueDays: number;
  isOverdue: boolean;
}

/**
 * Payable transaction interface matching backend PayableTransactionDto
 */
export interface PayableTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  type: 'Invoice' | 'Payment' | 'Adjustment' | 'Refund';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  paymentMethod: PaymentMethod;
  dueDate?: string;
  transactionDate: string;
  referenceType?: string;
  referenceId?: string;
  referenceCode?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Create payable payment DTO
 */
export interface CreatePayablePayment {
  supplierId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  transactionDate?: string;
  createdBy?: string;
}

/**
 * Create payable adjustment DTO
 */
export interface CreatePayableAdjustment {
  supplierId: string;
  amount: number; // Positive for increase, negative for decrease
  description?: string;
  transactionDate?: string;
  createdBy?: string;
}

/**
 * Receivable statistics interface
 */
export interface ReceivableStatistics {
  totalReceivables: number;
  overdueReceivables: number;
  overdueCount: number;
  totalCustomersWithReceivables: number;
  currentReceivables: number;
}

/**
 * Payable statistics interface
 */
export interface PayableStatistics {
  totalPayables: number;
  overduePayables: number;
  overdueCount: number;
  totalSuppliersWithPayables: number;
  currentPayables: number;
}

/**
 * Available unit option for a product
 */
export interface ProductAvailableUnit {
  unitId: string;
  unitName: string;
  unitCode: string;
  conversionRate: number; // Rate from product's default unit to this unit
  price: number; // Price in this unit
  isDefault: boolean; // Is this the product's default unit
  isBaseUnit: boolean; // Is this the product's base unit
}

/**
 * Purchase order status enum
 */
export type PurchaseOrderStatus = "Draft" | "Ordered" | "Received" | "PartialReceived" | "Cancelled";

/**
 * Purchase order interface matching backend PurchaseOrderDto
 */
export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  supplierName?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  discountType: "Percent" | "Amount";
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Purchase order item interface matching backend PurchaseOrderItemDto
 */
export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  unitId: string;
  unitName: string;
  unitPrice: number;
  discount: number;
  discountType: "Percent" | "Amount";
  total: number;
}