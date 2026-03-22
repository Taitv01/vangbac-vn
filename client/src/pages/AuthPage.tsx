import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { loginApi, registerApi } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Mật khẩu không khớp", path: ["confirm"] });

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirm: "" },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const result = await loginApi(values.email, values.password);
      if (!result.success) {
        toast({ title: "Lỗi đăng nhập", description: result.error, variant: "destructive" });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
        toast({ title: "Đăng nhập thành công", description: `Xin chào ${result.user.name}` });
      }
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    try {
      const result = await registerApi(values.email, values.name, values.password, values.phone);
      if (!result.success) {
        const errMsg = typeof result.error === "string"
          ? result.error
          : Object.values(result.error).flat().join(", ");
        toast({ title: "Lỗi đăng ký", description: errMsg, variant: "destructive" });
      } else {
        toast({ title: "Đăng ký thành công", description: `Chào mừng ${result.user.name}` });
      }
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "radial-gradient(ellipse at top, hsl(30 20% 10%) 0%, hsl(30 15% 7%) 70%)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #d4a017, #8a6500)" }}>
          <Coins size={24} className="text-black" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#d4a017" }}>VàngBạc.VN</h1>
          <p className="text-xs text-muted-foreground">Theo dõi tài sản kim loại quý</p>
        </div>
      </div>

      <Card className="w-full max-w-sm border-yellow-900/40">
        <CardHeader className="pb-4">
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "bg-yellow-700 text-black" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("login")}
              data-testid="tab-login"
            >Đăng nhập</button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "register" ? "bg-yellow-700 text-black" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("register")}
              data-testid="tab-register"
            >Đăng ký</button>
          </div>
        </CardHeader>

        <CardContent>
          {mode === "login" ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField name="email" control={loginForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@gmail.com" {...field} data-testid="input-login-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={loginForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPwd ? "text" : "password"} placeholder="••••••" {...field} data-testid="input-login-password" />
                        <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold" disabled={loading} data-testid="btn-login">
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
                <FormField name="name" control={registerForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ tên</FormLabel>
                    <FormControl><Input placeholder="Nguyễn Văn A" {...field} data-testid="input-reg-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="email" control={registerForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="example@gmail.com" {...field} data-testid="input-reg-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="phone" control={registerForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại (tùy chọn)</FormLabel>
                    <FormControl><Input placeholder="0901234567" {...field} data-testid="input-reg-phone" /></FormControl>
                  </FormItem>
                )} />
                <FormField name="password" control={registerForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mật khẩu</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPwd ? "text" : "password"} placeholder="Tối thiểu 6 ký tự" {...field} data-testid="input-reg-password" />
                        <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="confirm" control={registerForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhập lại mật khẩu</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••" {...field} data-testid="input-reg-confirm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold mt-2" disabled={loading} data-testid="btn-register">
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Dữ liệu được lưu trữ bảo mật · Miễn phí hoàn toàn
      </p>
    </div>
  );
}
