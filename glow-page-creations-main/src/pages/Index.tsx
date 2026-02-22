import { useRef, useEffect, useState } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatSidebar from "@/components/ChatSidebar";
import MathBackground from "@/components/MathBackground";
import { useChat } from "@/hooks/useChat";

const Index = () => {
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    currentConversationId,
    loadConversation,
    newConversation,
    stopResponse
  } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ESC key to return to welcome screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        newConversation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newConversation]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden relative">
      {/* Global Math Background */}
      <MathBackground />
      
      <ChatHeader onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin min-h-0 relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <WelcomeScreen />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-3 py-4 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                attachments={message.attachments}
              />
            ))}
            {isTyping && (
              <ChatMessage content="" isUser={false} isTyping />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="max-w-3xl mx-auto w-full px-0 sm:px-4 flex-shrink-0 relative z-10">
        <ChatInput onSend={sendMessage} disabled={isTyping} isTyping={isTyping} onStop={stopResponse} />
      </div>

      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => id && loadConversation(id)}
        onNewConversation={newConversation}
      />
    </div>
  );
};

export default Index;
