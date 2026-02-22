import { Sparkles, Triangle, Circle, Square } from "lucide-react";

const WelcomeScreen = () => {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-4 py-4 overflow-hidden z-10">

      {/* Logo with geometric decorations */}
      <div className="relative mb-6 z-10">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative overflow-hidden border border-primary/20 shadow-2xl">
          {/* Math symbols on the icon */}
          <span className="absolute top-2 left-2 text-sm text-primary/60 font-mono">π</span>
          <span className="absolute top-2 right-2 text-sm text-primary/60 font-mono">∫</span>
          <span className="absolute bottom-2 left-2 text-sm text-primary/60 font-mono">√</span>
          <span className="absolute bottom-2 right-2 text-sm text-primary/60 font-mono">∞</span>
          
          {/* Geometric shapes around */}
          <Triangle className="absolute top-3 left-3 w-3 h-3 text-primary/40 fill-primary/20" />
          <Circle className="absolute bottom-3 right-3 w-3 h-3 text-primary/40 fill-primary/20" />
          <Square className="absolute top-3 right-3 w-3 h-3 text-primary/40 fill-primary/20 rotate-12" />
          
          {/* Main icon */}
          <div className="text-5xl font-bold text-primary animate-pulse-glow">∑</div>
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-primary animate-pulse" />
        
        {/* Orbiting geometric elements */}
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary/50 rotate-45 animate-spin-slow" />
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary/50 rounded-full" />
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-5 h-5 border-2 border-primary/50" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold mb-3 z-10">
        <span className="text-gradient">Euclides</span>
      </h1>
      <p className="text-lg text-muted-foreground mb-4 z-10 flex items-center gap-2">
        <span>📐</span>
        <span>خبير الرياضيات</span>
        <span>🧮</span>
      </p>

      {/* Description with emojis */}
      <div className="text-sm text-muted-foreground max-w-md z-10 leading-relaxed space-y-2">
        <p>
          مرحباً! أنا <span className="text-primary font-semibold">Euclides AI</span> 👋
        </p>
        <p className="flex items-center justify-center gap-2">
          <span>✨</span>
          <span>خبير في حل المعادلات والمسائل الرياضية</span>
        </p>
        <p className="text-xs text-muted-foreground/80 mt-3">
          أرسل أي معادلة وسأحلها لك خطوة بخطوة 📝
        </p>
      </div>

      {/* Quick examples */}
      <div className="mt-6 z-10 flex flex-wrap justify-center gap-2">
        <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          ² + ³ = ?
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          √144
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          x² - 5x + 6 = 0
        </span>
      </div>
    </div>
  );
};

export default WelcomeScreen;