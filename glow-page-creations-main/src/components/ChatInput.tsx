import { useState, KeyboardEvent, useRef } from "react";
import { Send, ImagePlus, Paperclip, Camera, X, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Attachment } from "@/hooks/useChat";

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
  isTyping?: boolean;
  onStop?: () => void;
}

const ChatInput = ({ onSend, disabled, isTyping, onStop }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSend(message.trim(), attachments.length > 0 ? attachments : undefined);
      setMessage("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border-t border-border p-2 sm:p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group bg-secondary rounded-lg overflow-hidden"
            >
              {attachment.type === "image" ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2">
                  <Paperclip className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-full">
                    {attachment.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment Buttons */}
        <div className="flex gap-1">
          {/* Camera Button - Mobile Only */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "sm:hidden flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-secondary text-secondary-foreground",
              "hover:bg-secondary/80 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Image Button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-secondary text-secondary-foreground",
              "hover:bg-secondary/80 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            <ImagePlus className="w-5 h-5" />
          </button>

          {/* File Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-secondary text-secondary-foreground",
              "hover:bg-secondary/80 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e, "image")}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, "image")}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e, "file")}
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب المعادلة أو المسألة الرياضية للبدء..."
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl bg-input border border-border px-3 py-2.5 sm:px-4 sm:py-3",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "transition-all duration-200",
              "min-h-[44px] sm:min-h-[48px] max-h-[120px]",
              "scrollbar-thin text-sm sm:text-base"
            )}
            style={{ direction: "rtl" }}
          />
        </div>

        {/* Send/Stop Button */}
        {isTyping ? (
          <button
            onClick={onStop}
            className={cn(
              "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
              "bg-destructive text-destructive-foreground",
              "hover:bg-destructive/90 active:scale-95",
              "transition-all duration-200"
            )}
          >
            <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || disabled}
            className={cn(
              "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
              "transition-all duration-200",
              "glow-effect"
            )}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
