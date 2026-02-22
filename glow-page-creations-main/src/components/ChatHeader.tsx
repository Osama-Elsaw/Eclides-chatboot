import { Sparkles, Menu, LogOut, Triangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ChatHeaderProps {
  onMenuClick?: () => void;
}

const ChatHeader = ({ onMenuClick }: ChatHeaderProps) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("تم تسجيل الخروج بنجاح 👋");
  };

  return (
    <header className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="text-muted-foreground hover:text-foreground"
        title="تسجيل الخروج"
      >
        <LogOut className="w-5 h-5" />
      </Button>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-xl sm:text-2xl font-bold text-primary">∑</span>
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-primary animate-pulse-glow" />
          <Triangle className="absolute -bottom-0.5 -left-0.5 w-2 h-2 text-primary/60 fill-primary/30" />
        </div>
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-bold">
            <span className="text-gradient">Euclides</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 justify-center">
            <span>📐</span>
            <span>خبير الرياضيات</span>
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </header>
  );
};

export default ChatHeader;