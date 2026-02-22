import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Triangle, Circle, Square } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import MathBackground from "@/components/MathBackground";

const emailSchema = z.string().email("البريد الإلكتروني غير صالح");
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast.error("البريد الإلكتروني غير صالح");
      return false;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        } else {
          toast.error("حدث خطأ أثناء تسجيل الدخول");
        }
      } else {
        toast.success("تم تسجيل الدخول بنجاح!");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name || undefined,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("هذا البريد الإلكتروني مسجل بالفعل");
        } else {
          toast.error("حدث خطأ أثناء إنشاء الحساب");
        }
      } else {
        toast.success("تم إنشاء الحساب بنجاح!");
      }
    } catch {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-hidden">
      <MathBackground />
      
      <div className="w-full max-w-md space-y-8 z-10">
        {/* Logo with geometric decorations */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4 overflow-hidden">
            {/* Math symbols on the icon */}
            <span className="absolute top-1 left-1 text-xs text-primary/60 font-mono">π</span>
            <span className="absolute top-1 right-1 text-xs text-primary/60 font-mono">∑</span>
            <span className="absolute bottom-1 left-1 text-xs text-primary/60 font-mono">∫</span>
            <span className="absolute bottom-1 right-1 text-xs text-primary/60 font-mono">√</span>
            
            {/* Geometric shapes */}
            <Triangle className="absolute top-2 left-2 w-3 h-3 text-primary/40" />
            <Circle className="absolute bottom-2 right-2 w-3 h-3 text-primary/40" />
            <Square className="absolute top-2 right-2 w-3 h-3 text-primary/40 rotate-12" />
            
            {/* Main symbol */}
            <div className="text-3xl font-bold text-primary">∑</div>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Euclides AI</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "تسجيل الدخول للمتابعة" : "إنشاء حساب جديد"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">الاسم (اختياري)</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pr-10"
                  dir="rtl"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10"
                dir="rtl"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                dir="rtl"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "جاري التحميل..." : isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline text-sm"
          >
            {isLogin ? "ليس لديك حساب؟ إنشاء حساب جديد" : "لديك حساب بالفعل؟ تسجيل الدخول"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
