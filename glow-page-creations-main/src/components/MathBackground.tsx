const MathBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Large background symbols - very subtle */}
      <span className="absolute top-[3%] left-[5%] text-6xl text-primary/15 font-mono rotate-12">π</span>
      <span className="absolute top-[8%] right-[8%] text-5xl text-primary/15 font-mono -rotate-6">∑</span>
      <span className="absolute top-[20%] left-[3%] text-4xl text-primary/20 font-mono rotate-45">∫</span>
      <span className="absolute top-[5%] left-[35%] text-2xl text-primary/15 font-mono">x² + y² = r²</span>
      <span className="absolute top-[30%] right-[5%] text-5xl text-primary/15 font-mono rotate-12">√</span>
      <span className="absolute top-[40%] left-[2%] text-4xl text-primary/20 font-mono -rotate-12">∞</span>
      <span className="absolute top-[3%] right-[30%] text-xl text-primary/15 font-mono">E = mc²</span>
      
      {/* Medium symbols - scattered */}
      <span className="absolute top-[50%] right-[3%] text-3xl text-primary/15 font-mono rotate-6">θ</span>
      <span className="absolute top-[60%] left-[5%] text-2xl text-primary/20 font-mono -rotate-6">∆</span>
      <span className="absolute top-[70%] right-[8%] text-xl text-primary/15 font-mono">∂f/∂x</span>
      <span className="absolute top-[75%] left-[3%] text-3xl text-primary/15 font-mono rotate-15">λ</span>
      <span className="absolute top-[85%] right-[5%] text-2xl text-primary/20 font-mono -rotate-8">Ω</span>
      <span className="absolute top-[90%] left-[10%] text-xl text-primary/15 font-mono">lim</span>
      
      {/* Top area equations */}
      <span className="absolute top-[12%] left-[20%] text-lg text-primary/10 font-mono rotate-3">sin²θ + cos²θ = 1</span>
      <span className="absolute top-[18%] right-[20%] text-lg text-primary/10 font-mono -rotate-3">a² + b² = c²</span>
      
      {/* Triangles - spread across */}
      <div className="absolute top-[15%] right-[15%] w-20 h-20 border-2 border-primary/20 rotate-12" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      <div className="absolute top-[55%] left-[8%] w-16 h-16 border-2 border-primary/15 -rotate-6" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      <div className="absolute top-[80%] right-[25%] w-14 h-14 border-2 border-primary/15 rotate-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      <div className="absolute top-[35%] left-[12%] w-10 h-10 border-2 border-primary/20 rotate-45" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      
      {/* Squares - scattered */}
      <div className="absolute top-[25%] right-[5%] w-14 h-14 border-2 border-primary/15 rotate-45" />
      <div className="absolute top-[65%] right-[12%] w-12 h-12 border-2 border-primary/20 rotate-12" />
      <div className="absolute top-[45%] left-[5%] w-10 h-10 border-2 border-primary/15 rotate-30" />
      <div className="absolute top-[88%] left-[20%] w-8 h-8 border-2 border-primary/20 rotate-15" />
      
      {/* Circles - spread across */}
      <div className="absolute top-[10%] left-[60%] w-16 h-16 border-2 border-primary/15 rounded-full" />
      <div className="absolute top-[35%] right-[10%] w-20 h-20 border-2 border-primary/10 rounded-full" />
      <div className="absolute top-[60%] left-[15%] w-12 h-12 border-2 border-primary/20 rounded-full" />
      <div className="absolute top-[75%] right-[15%] w-14 h-14 border-2 border-primary/15 rounded-full" />
      <div className="absolute top-[92%] left-[40%] w-10 h-10 border-2 border-primary/15 rounded-full" />
      
      {/* Bottom area symbols */}
      <span className="absolute bottom-[15%] left-[30%] text-xl text-primary/15 font-mono rotate-6">∫ f(x)dx</span>
      <span className="absolute bottom-[8%] right-[25%] text-lg text-primary/10 font-mono -rotate-3">dy/dx</span>
      <span className="absolute bottom-[20%] right-[40%] text-2xl text-primary/15 font-mono">α</span>
      <span className="absolute bottom-[5%] left-[50%] text-xl text-primary/15 font-mono rotate-8">β</span>
      
      {/* Hexagons */}
      <div className="absolute top-[50%] right-[20%] w-16 h-16 border-2 border-primary/15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      <div className="absolute top-[20%] left-[45%] w-12 h-12 border-2 border-primary/10 rotate-30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      
      {/* Additional scattered symbols */}
      <span className="absolute top-[42%] right-[35%] text-lg text-primary/10 font-mono">Σⁿᵢ₌₁</span>
      <span className="absolute top-[28%] left-[55%] text-xl text-primary/10 font-mono rotate-6">∏</span>
      <span className="absolute top-[68%] left-[45%] text-lg text-primary/15 font-mono -rotate-3">log</span>
      <span className="absolute top-[82%] right-[45%] text-xl text-primary/10 font-mono">eⁱˣ</span>
      
      {/* Corner decorations */}
      <div className="absolute top-[5%] left-[85%] w-8 h-8 border-2 border-primary/15 rotate-45" />
      <div className="absolute top-[95%] right-[85%] w-6 h-6 border-2 border-primary/15 rounded-full" />
    </div>
  );
};

export default MathBackground;