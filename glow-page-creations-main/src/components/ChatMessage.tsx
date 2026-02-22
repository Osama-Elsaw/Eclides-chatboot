import { Bot, User, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment } from "@/hooks/useChat";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isTyping?: boolean;
  attachments?: Attachment[];
}

const ChatMessage = ({ content, isUser, isTyping, attachments }: ChatMessageProps) => {
  // Format content - clean up LaTeX and style properly
  const formatContent = (text: string) => {
    let formatted = text
      // Remove LaTeX dollar signs
      .replace(/\$\$/g, '')
      .replace(/\$/g, '')
      // Convert LaTeX fractions: \frac{a}{b} -> (a)/(b)
      .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
      // Convert LaTeX sqrt: \sqrt{x} -> √(x)
      .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
      // Convert \pm to ±
      .replace(/\\pm/g, '±')
      // Convert \times to ×
      .replace(/\\times/g, '×')
      // Convert \div to ÷
      .replace(/\\div/g, '÷')
      // Convert \cdot to ·
      .replace(/\\cdot/g, '·')
      // Convert \infty to ∞
      .replace(/\\infty/g, '∞')
      // Convert \pi to π
      .replace(/\\pi/g, 'π')
      // Convert \sum to Σ
      .replace(/\\sum/g, 'Σ')
      // Convert \int to ∫
      .replace(/\\int/g, '∫')
      // Convert \leq to ≤
      .replace(/\\leq/g, '≤')
      // Convert \geq to ≥
      .replace(/\\geq/g, '≥')
      // Convert \neq to ≠
      .replace(/\\neq/g, '≠')
      // Remove remaining backslash commands
      .replace(/\\[a-zA-Z]+/g, '')
      // Clean up extra braces
      .replace(/\{([^}]*)\}/g, '$1')
      // Bold text markers
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      // Highlight code
      .replace(/`(.*?)`/g, '<code class="bg-primary/10 px-1 py-0.5 rounded text-primary">$1</code>')
      // Convert line breaks
      .replace(/\n/g, '<br/>');
    
    return formatted;
  };

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg",
          isUser 
            ? "bg-gradient-to-br from-primary to-primary/80" 
            : "bg-gradient-to-br from-secondary to-secondary/80 border border-border"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
        ) : (
          <div className="relative">
            <span className="text-lg font-bold text-primary">∑</span>
            <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-primary animate-pulse" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[80%]",
          isUser ? "text-right" : "text-right"
        )}
      >
        {/* Sender Label */}
        <div className={cn(
          "text-xs text-muted-foreground mb-1 flex items-center gap-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {isUser ? (
            <span>أنت</span>
          ) : (
            <>
              <span className="text-primary">📐</span>
              <span>Euclides AI</span>
            </>
          )}
        </div>

        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className={cn(
            "mb-2 p-2 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/50",
            attachments.some(a => a.type === "image") && "grid gap-2",
            attachments.filter(a => a.type === "image").length > 1 && "grid-cols-2"
          )}>
            {attachments.map((attachment) => (
              attachment.type === "image" ? (
                <img
                  key={attachment.id}
                  src={attachment.url}
                  alt={attachment.name}
                  className="rounded-lg w-full max-w-[200px] sm:max-w-[280px] object-cover shadow-md"
                />
              ) : (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-background/50 border border-border/50"
                >
                  <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="text-xs truncate">{attachment.name}</span>
                </div>
              )
            ))}
          </div>
        )}

        {/* Text Content */}
        {(content || isTyping) && (
          <div className={cn(
            "inline-block rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-transparent text-foreground"
          )}>
            {isTyping ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">يفكر</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            ) : isUser ? (
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{content}</p>
            ) : (
              <div 
                className="text-sm sm:text-base leading-loose whitespace-pre-wrap prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(content) }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;