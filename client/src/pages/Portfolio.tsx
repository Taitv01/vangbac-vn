import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertHoldingSchema, type Holding, type InsertHolding } from "@shared/schema";
import { formatVND, formatDateVN, unitLabel } from "@/lib/formatters";
import { z } from "zod";

const holdingFormSchema = insertHoldingSchema.extend({
  quantity: z.coerce.number().positive("Số lượng phải > 0"),
  buyPrice: z.coerce.number().positive("Giá mua phải > 0"),
});

const BRANDS_GOLD = ["SJC", "PNJ", "DOJI", "BTMC", "Phú Quý", "Khác"];
const BRANDS_SILVER = ["BTMC", "Phú Quý", "ANCARAT", "Khác"];

function HoldingForm({ onSuccess, initial }: { onSuccess: () => void; initial?: Holding }) {
  const { toast } = useToast();
  const form = useForm<InsertHolding>({
    resolver: zodResolver(holdingFormSchema),
    defaultValues: initial ?? {
      type: "gold",
      brand: "SJC",
      product: "Vàng miếng SJC",
      unit: "luong",
      quantity: 1,
      buyPrice: 17000000,
      buyDate: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });

  const watchType = form.watch("type");
  const brands = watchType === "gold" ? BRANDS_GOLD : BRANDS_SILVER;

  const createMutation = useMutation({
    mutationFn: (data: InsertHolding) => apiRequest("POST", "/api/holdings", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      toast({ title: "Đã thêm tài sản", description: "Tài sản được lưu vào danh mục." });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertHolding) => apiRequest("PATCH", `/api/holdings/${initial!.id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      toast({ title: "Đã cập nhật" });
      onSuccess();
    },
  });

  const onSubmit = (data: InsertHolding) => {
    if (initial) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Type */}
        <FormField name="type" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Loại kim loại</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="gold">🥇 Vàng</SelectItem>
                <SelectItem value="silver">🥈 Bạc</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {/* Brand */}
        <FormField name="brand" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Thương hiệu</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-brand">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        {/* Product name */}
        <FormField name="product" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Tên sản phẩm</FormLabel>
            <FormControl>
              <Input placeholder="VD: Vàng miếng SJC 1 lượng" {...field} data-testid="input-product" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Unit + Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <FormField name="unit" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Đơn vị</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="luong">Lượng (37.5g)</SelectItem>
                  <SelectItem value="chi">Chỉ (3.75g)</SelectItem>
                  <SelectItem value="gram">Gram</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField name="quantity" control={form.control} render={({ field }) => (
            <FormItem>
              <FormLabel>Số lượng</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0.01" {...field} data-testid="input-quantity" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Buy price */}
        <FormField name="buyPrice" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Giá mua vào (VND/{unitLabel(form.watch("unit"))})</FormLabel>
            <FormControl>
              <Input type="number" step="10000" min="1" {...field} data-testid="input-buy-price" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Buy date */}
        <FormField name="buyDate" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Ngày mua</FormLabel>
            <FormControl>
              <Input type="date" {...field} data-testid="input-buy-date" />
            </FormControl>
          </FormItem>
        )} />

        {/* Note */}
        <FormField name="note" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Ghi chú (tùy chọn)</FormLabel>
            <FormControl>
              <Input placeholder="VD: Mua tại SJC Q1" {...field} value={field.value ?? ""} data-testid="input-note" />
            </FormControl>
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold" disabled={isPending} data-testid="btn-submit-holding">
          {isPending ? "Đang lưu..." : initial ? "Cập nhật" : "Thêm vào danh mục"}
        </Button>
      </form>
    </Form>
  );
}

export default function Portfolio() {
  const { data, isLoading } = useQuery<{ success: boolean; data: Holding[] }>({ queryKey: ["/api/holdings"] });
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Holding | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/holdings/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
      toast({ title: "Đã xóa tài sản" });
    },
  });

  const holdings = data?.data ?? [];

  return (
    <div className="px-4 pb-4 pt-2 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#d4a017" }}>Danh mục</h1>
          <p className="text-xs text-muted-foreground">{holdings.length} tài sản</p>
        </div>

        {/* Add dialog */}
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold gap-1" data-testid="btn-add-holding">
              <Plus size={14} /> Thêm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-yellow-400">{editItem ? "Chỉnh sửa tài sản" : "Thêm tài sản mới"}</DialogTitle>
            </DialogHeader>
            <HoldingForm
              initial={editItem ?? undefined}
              onSuccess={() => { setOpen(false); setEditItem(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Holdings list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-muted-foreground text-sm">Chưa có tài sản nào</p>
          <p className="text-muted-foreground text-xs mt-1">Nhấn "Thêm" để thêm vàng hoặc bạc</p>
        </div>
      ) : (
        <div className="space-y-3">
          {holdings.map((h) => (
            <Card key={h.id} className="border-border bg-card" data-testid={`portfolio-card-${h.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">{h.brand}</span>
                      <Badge
                        variant="outline"
                        className={h.type === "gold" ? "text-yellow-400 border-yellow-800 text-xs" : "text-slate-400 border-slate-700 text-xs"}
                      >
                        {h.type === "gold" ? "Vàng" : "Bạc"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{h.product}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Số lượng</p>
                        <p className="text-sm font-semibold">{h.quantity} {unitLabel(h.unit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Giá mua</p>
                        <p className="text-sm font-semibold">{formatVND(h.buyPrice)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tổng vốn</p>
                        <p className="text-sm font-semibold text-yellow-400">{formatVND(h.buyPrice * h.quantity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngày mua</p>
                        <p className="text-sm font-semibold">{formatDateVN(h.buyDate)}</p>
                      </div>
                    </div>
                    {h.note && <p className="text-xs text-muted-foreground mt-1 italic">📝 {h.note}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      onClick={() => { setEditItem(h); setOpen(true); }}
                      className="p-1.5 rounded hover:bg-secondary transition-colors"
                      data-testid={`btn-edit-${h.id}`}
                    >
                      <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(h.id)}
                      className="p-1.5 rounded hover:bg-red-950 transition-colors"
                      data-testid={`btn-delete-${h.id}`}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
