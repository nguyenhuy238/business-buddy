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
  TrendingUp,
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
  getReceivables,
  getReceivableStatistics,
} from "@/services/receivableService";
import type { Receivable, ReceivableStatistics } from "@/types";
import { ReceivablePaymentDialog } from "@/components/dialogs/ReceivablePaymentDialog";
import { ReceivableHistoryDialog } from "@/components/dialogs/ReceivableHistoryDialog";

export default function Receivables() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [statistics, setStatistics] = useState<ReceivableStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);

  /**
   * Load receivables and statistics from API
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [receivablesData, statsData] = await Promise.all([
        getReceivables(overdueFilter === "overdue"),
        getReceivableStatistics(),
      ]);
      
      setReceivables(receivablesData);
      setStatistics(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải dữ liệu công nợ";
      setError(errorMessage);
      console.error("Error loading receivables:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [overdueFilter]);

  /**
   * Filter receivables based on search query
   */
  const filteredReceivables = receivables.filter(
    (receivable) =>
      receivable.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receivable.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (receivable.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  /**
   * Handle payment dialog
   */
  const handlePayment = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setPaymentDialogOpen(true);
  };

  /**
   * Handle history dialog
   */
  const handleHistory = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    setHistoryDialogOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Header title="Công nợ phải thu" subtitle="Quản lý công nợ khách hàng" />

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
                  <p className="text-2xl font-bold">{formatCurrency(statistics.totalReceivables)}</p>
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
                    {formatCurrency(statistics.overdueReceivables)}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số khách hàng nợ</p>
                  <p className="text-2xl font-bold">{statistics.totalCustomersWithReceivables}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-info/10 p-2">
                  <Calendar className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng quá hạn</p>
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
          ) : filteredReceivables.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Không có công nợ
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Thử thay đổi từ khóa tìm kiếm"
                  : "Chưa có công nợ phải thu nào trong hệ thống"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ngày đến hạn</TableHead>
                  <TableHead className="text-right">Công nợ</TableHead>
                  <TableHead className="text-right">Quá hạn</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable) => (
                  <TableRow key={receivable.customerId} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{receivable.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {receivable.customerCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {receivable.customerPhone && (
                        <p className="text-sm">{receivable.customerPhone}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {receivable.paymentDueDate ? (
                        <div>
                          <p className="text-sm">{formatDate(receivable.paymentDueDate)}</p>
                          {receivable.isOverdue && (
                            <Badge variant="destructive" className="mt-1 text-xs">
                              Quá hạn {receivable.overdueDays} ngày
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-primary">
                        {formatCurrency(receivable.totalReceivables)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {receivable.isOverdue ? (
                        <span className="font-semibold text-destructive">
                          {formatCurrency(receivable.overdueAmount)}
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
                          <DropdownMenuItem onClick={() => handlePayment(receivable)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Thu tiền
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleHistory(receivable)}>
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
      <ReceivablePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        receivable={selectedReceivable}
        onSuccess={() => {
          loadData();
          setSelectedReceivable(null);
        }}
      />
      <ReceivableHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        receivable={selectedReceivable}
      />
    </div>
  );
}

