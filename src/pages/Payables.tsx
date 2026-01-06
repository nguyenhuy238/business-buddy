import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  AlertCircle,
  MoreHorizontal,
  DollarSign,
  History,
  TrendingDown,
  Calendar,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  getPayables,
  getPayableStatistics,
} from "@/services/payableService";
import type { Payable, PayableStatistics } from "@/types";
import { PayablePaymentDialog } from "@/components/dialogs/PayablePaymentDialog";
import { PayableHistoryDialog } from "@/components/dialogs/PayableHistoryDialog";

export default function Payables() {
  const [payables, setPayables] = useState<Payable[]>([]);
  const [statistics, setStatistics] = useState<PayableStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);

  /**
   * Load payables and statistics from API
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [payablesData, statsData] = await Promise.all([
        getPayables(overdueFilter === "overdue"),
        getPayableStatistics(),
      ]);
      
      setPayables(payablesData);
      setStatistics(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu công nợ";
      setError(errorMessage);
      console.error("Error loading payables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [overdueFilter]);

  /**
   * Filter payables based on search query
   */
  const filteredPayables = payables.filter(
    (payable) =>
      payable.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payable.supplierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payable.supplierPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  /**
   * Handle payment dialog
   */
  const handlePayment = (payable: Payable) => {
    setSelectedPayable(payable);
    setPaymentDialogOpen(true);
  };

  /**
   * Handle history dialog
   */
  const handleHistory = (payable: Payable) => {
    setSelectedPayable(payable);
    setHistoryDialogOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header title="Công nợ phải trả" subtitle="Quản lý công nợ nhà cung cấp" />

      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng công nợ</p>
                  <p className="text-2xl font-bold">{formatCurrency(statistics.totalPayables)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Công nợ quá hạn</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(statistics.overduePayables)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số nhà cung cấp nợ</p>
                  <p className="text-2xl font-bold">{statistics.totalSuppliersWithPayables}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <Calendar className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nhà cung cấp quá hạn</p>
                  <p className="text-2xl font-bold">{statistics.overdueCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={overdueFilter} onValueChange={setOverdueFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Lọc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayables.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Không có công nợ
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Chưa có công nợ phải trả nào trong hệ thống"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ngày đến hạn</TableHead>
                  <TableHead className="text-right">Công nợ</TableHead>
                  <TableHead className="text-right">Quá hạn</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayables.map((payable) => (
                  <TableRow key={payable.supplierId} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{payable.supplierName}</p>
                        <p className="text-xs text-muted-foreground">
                          {payable.supplierCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payable.supplierPhone && (
                        <p className="text-sm">{payable.supplierPhone}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {payable.paymentDueDate ? (
                        <div>
                          <p className="text-sm">{formatDate(payable.paymentDueDate)}</p>
                          {payable.isOverdue && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Quá hạn {payable.overdueDays} ngày
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-primary">
                        {formatCurrency(payable.totalPayables)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {payable.isOverdue ? (
                        <span className="font-semibold text-destructive">
                          {formatCurrency(payable.overdueAmount)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePayment(payable)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Trả tiền
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleHistory(payable)}>
                            <History className="mr-2 h-4 w-4" />
                            Lịch sử
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <PayablePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payable={selectedPayable}
        onSuccess={() => {
          loadData();
          setSelectedPayable(null);
        }}
      />
      <PayableHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        payable={selectedPayable}
      />
    </div>
  );
}

