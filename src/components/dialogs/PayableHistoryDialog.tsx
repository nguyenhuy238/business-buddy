/**
 * Payable History Dialog Component
 * Displays transaction history for a supplier's payables
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getSupplierPayableTransactions } from "@/services/payableService";
import type { Payable, PayableTransaction } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PayableHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable: Payable | null;
}

/**
 * Transaction type labels
 */
const transactionTypeLabels: Record<string, { label: string; color: string }> = {
  Invoice: { label: "Phát sinh", color: "bg-blue-100 text-blue-800" },
  Payment: { label: "Trả tiền", color: "bg-success/10 text-success" },
  Adjustment: { label: "Điều chỉnh", color: "bg-warning/10 text-warning" },
  Refund: { label: "Hoàn tiền", color: "bg-purple-100 text-purple-800" },
};

export function PayableHistoryDialog({
  open,
  onOpenChange,
  payable,
}: PayableHistoryDialogProps) {
  const [transactions, setTransactions] = useState<PayableTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load transaction history
   */
  useEffect(() => {
    if (open && payable) {
      loadTransactions();
    } else {
      setTransactions([]);
      setError(null);
    }
  }, [open, payable]);

  const loadTransactions = async () => {
    if (!payable) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierPayableTransactions(payable.supplierId);
      setTransactions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải lịch sử";
      setError(errorMessage);
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!payable) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch sử công nợ</DialogTitle>
          <DialogDescription>
            Lịch sử giao dịch công nợ của nhà cung cấp: <strong>{payable.supplierName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Công nợ hiện tại:</span>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(payable.totalPayables)}
                </p>
              </div>
              {payable.isOverdue && (
                <div>
                  <span className="text-muted-foreground">Quá hạn:</span>
                  <p className="text-lg font-semibold text-destructive">
                    {payable.overdueDays} ngày
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Transactions Table */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Chưa có giao dịch
              </p>
              <p className="text-sm text-muted-foreground">
                Chưa có giao dịch công nợ nào cho nhà cung cấp này
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Tham chiếu</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="text-right">Số dư trước</TableHead>
                    <TableHead className="text-right">Số dư sau</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(transaction.transactionDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "rounded-full",
                            transactionTypeLabels[transaction.type]?.color ||
                              "bg-gray-100 text-gray-800"
                          )}
                        >
                          {transactionTypeLabels[transaction.type]?.label || transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          {transaction.paymentMethod && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.paymentMethod}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.referenceCode ? (
                          <span className="text-sm text-muted-foreground">
                            {transaction.referenceType} #{transaction.referenceCode}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-semibold",
                            transaction.type === "Payment"
                              ? "text-success"
                              : transaction.type === "Invoice"
                              ? "text-blue-600"
                              : "text-warning"
                          )}
                        >
                          {transaction.type === "Payment" ? "-" : "+"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(transaction.balanceBefore)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">
                          {formatCurrency(transaction.balanceAfter)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

