import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Coins } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { loginApi, registerApi, googleLoginApi, facebookLoginApi } from "@/hooks/use-auth";
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

const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
const labelClass = "text-sm font-medium leading-none";
const errorClass = "text-sm font-medium text-destructive";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // @ts-ignore — google.accounts loaded via script tag
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        toast({ title: "Lỗi", description: "Google SDK chưa tải xong, vui lòng thử lại", variant: "destructive" });
        setLoading(false);
        return;
      }
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        callback: async (response: any) => {
          try {
            const result = await googleLoginApi(response.credential);
            if (result.success) {
              queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
              toast({ title: "Đăng nhập thành công", description: `Xin chào ${result.user.name}` });
            } else {
              toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
          } catch (e: any) {
            toast({ title: "Lỗi", description: e.message, variant: "destructive" });
          } finally {
            setLoading(false);
          }
        },
      });
      google.accounts.id.prompt();
    } catch (e: any) {
      toast({ title: "Lỗi", description: "Không thể kết nối Google", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const FB = (window as any).FB;
      if (!FB) {
        toast({ title: "Lỗi", description: "Facebook SDK chưa tải xong, vui lòng thử lại", variant: "destructive" });
        setLoading(false);
        return;
      }
      FB.login(async (response: any) => {
        if (response.authResponse) {
          try {
            const result = await facebookLoginApi(response.authResponse.accessToken);
            if (result.success) {
              queryClient.invalidateQueries({ queryKey: ["/api/holdings"] });
              toast({ title: "Đăng nhập thành công", description: `Xin chào ${result.user.name}` });
            } else {
              toast({ title: "Lỗi", description: result.error, variant: "destructive" });
            }
          } catch (e: any) {
            toast({ title: "Lỗi", description: e.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Đã hủy", description: "Bạn đã hủy đăng nhập Facebook", variant: "destructive" });
        }
        setLoading(false);
      }, { scope: "email,public_profile" });
    } catch {
      toast({ title: "Lỗi", description: "Không thể kết nối Facebook", variant: "destructive" });
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
          {/* Social Login Buttons */}
          <div className="space-y-2 mb-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-10 rounded-md border border-border bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              data-testid="btn-google"
            >
              <GoogleIcon />
              Tiếp tục với Google
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full h-10 rounded-md border border-border text-white text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50"
              style={{ background: "#1877F2" }}
              data-testid="btn-facebook"
            >
              <FacebookIcon />
              Tiếp tục với Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">hoặc</span>
            <div className="flex-1 h-px bg-border" />
          </div>

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
                <input id="reg-name" placeholder="Nguyễn Văn A" className={inputClass} data-testid="input-reg-name" {...registerForm.register("name")} />
                {registerForm.formState.errors.name && <p className={errorClass}>{registerForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-email" className={labelClass}>Email</label>
                <input id="reg-email" type="email" placeholder="example@gmail.com" className={inputClass} data-testid="input-reg-email" {...registerForm.register("email")} />
                {registerForm.formState.errors.email && <p className={errorClass}>{registerForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-phone" className={labelClass}>Số điện thoại (tùy chọn)</label>
                <input id="reg-phone" placeholder="0901234567" className={inputClass} data-testid="input-reg-phone" {...registerForm.register("phone")} />
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-password" className={labelClass}>Mật khẩu</label>
                <div className="relative">
                  <input id="reg-password" type={showPwd ? "text" : "password"} placeholder="Tối thiểu 6 ký tự" className={inputClass} data-testid="input-reg-password" {...registerForm.register("password")} />
                  <button type="button" className="absolute right-3 top-2.5 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {registerForm.formState.errors.password && <p className={errorClass}>{registerForm.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="reg-confirm" className={labelClass}>Nhập lại mật khẩu</label>
                <input id="reg-confirm" type="password" placeholder="••••••" className={inputClass} data-testid="input-reg-confirm" {...registerForm.register("confirm")} />
                {registerForm.formState.errors.confirm && <p className={errorClass}>{registerForm.formState.errors.confirm.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold mt-2" disabled={loading} data-testid="btn-register">
                {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground mt-6 text-center space-y-1">
        <p>Dữ liệu được lưu trữ bảo mật · Miễn phí hoàn toàn</p>
        <p className="pt-2 border-t border-border/30 mt-2">
          <span className="font-medium" style={{ color: "#d4a017" }}>Thái Văn Tài</span>
          {" · "}Mobi/Zalo: <a href="tel:0967686821" className="hover:text-yellow-400 transition-colors">0967 6868 21</a>
          {" · "}Email: <a href="mailto:Thaivantai.tcnh@gmail.com" className="hover:text-yellow-400 transition-colors">Thaivantai.tcnh@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
