import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Coins } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const inputClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
const labelClass = "text-sm font-medium leading-none";
const errorClass = "text-sm font-medium text-destructive";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className={labelClass}>Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="example@gmail.com"
                  className={inputClass}
                  data-testid="input-login-email"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className={errorClass}>{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className={labelClass}>Mật khẩu</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••"
                    className={inputClass}
                    data-testid="input-login-password"
                    {...loginForm.register("password")}
                  />
                  <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className={errorClass}>{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold" disabled={loading} data-testid="btn-login">
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="reg-name" className={labelClass}>Họ tên</label>
                <input
                  id="reg-name"
                  placeholder="Nguyễn Văn A"
                  className={inputClass}
                  data-testid="input-reg-name"
                  {...registerForm.register("name")}
                />
                {registerForm.formState.errors.name && (
                  <p className={errorClass}>{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-email" className={labelClass}>Email</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="example@gmail.com"
                  className={inputClass}
                  data-testid="input-reg-email"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className={errorClass}>{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-phone" className={labelClass}>Số điện thoại (tùy chọn)</label>
                <input
                  id="reg-phone"
                  placeholder="0901234567"
                  className={inputClass}
                  data-testid="input-reg-phone"
                  {...registerForm.register("phone")}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-password" className={labelClass}>Mật khẩu</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    className={inputClass}
                    data-testid="input-reg-password"
                    {...registerForm.register("password")}
                  />
                  <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className={errorClass}>{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-confirm" className={labelClass}>Nhập lại mật khẩu</label>
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="••••••"
                  className={inputClass}
                  data-testid="input-reg-confirm"
                  {...registerForm.register("confirm")}
                />
                {registerForm.formState.errors.confirm && (
                  <p className={errorClass}>{registerForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold mt-2" disabled={loading} data-testid="btn-register">
                {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Dữ liệu được lưu trữ bảo mật · Miễn phí hoàn toàn
      </p>
    </div>
  );
}
