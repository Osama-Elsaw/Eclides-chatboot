import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface Attachment {
  id: string;
  type: "image" | "file";
  name: string;
  url: string;
  file?: File;
}

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  attachments?: Attachment[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Compress image before converting to base64
const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  // Compress images for faster processing
  if (file.type.startsWith("image/")) {
    return compressImage(file, 1200, 0.7);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve("فشل في قراءة الملف");
    reader.readAsText(file);
  });
};

// Declare global pdfjsLib type
declare global {
  interface Window {
    pdfjsLib: {
      getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PDFDocument> };
      GlobalWorkerOptions: { workerSrc: string };
    };
  }
}

interface PDFDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PDFPage>;
}

interface PDFPage {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

// Load PDF.js from CDN
const loadPdfJs = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Convert PDF pages to images for AI vision - optimized for speed
const convertPdfToImages = async (file: File): Promise<string[]> => {
  const images: string[] = [];
  
  try {
    await loadPdfJs();
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = Math.min(pdf.numPages, 3); // Max 3 pages for fast response
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const scale = 1.0; // Lower scale for faster processing
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      
      if (!context) continue;
      
      // Limit max dimensions
      const maxDim = 1000;
      let width = viewport.width;
      let height = viewport.height;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Convert to JPEG with lower quality for speed
      const imageData = canvas.toDataURL("image/jpeg", 0.6);
      images.push(imageData);
    }
  } catch (error) {
    console.error("Error converting PDF to images:", error);
  }
  
  return images;
};

const getModeWelcome = (mode: string): { userMessage: string; botMessage: string } => {
  switch (mode) {
    case "smart":
      return {
        userMessage: "🧠 تفعيل وضع المحادثات الذكية",
        botMessage: "🎉 أهلاً بك في Super Mode! أنا الآن في أقصى قدراتي الذكية. اسألني أي سؤال معقد أو اطلب مني تحليل أي موضوع بعمق!"
      };
    case "fast":
      return {
        userMessage: "⚡ تفعيل وضع الردود السريعة",
        botMessage: "⚡ أهلاً بك في Fast Response! أنا أسرع ما يمكن الآن. ردودي ستكون مختصرة ومباشرة جداً!"
      };
    case "creative":
      return {
        userMessage: "✨ تفعيل وضع الإبداع اللامحدود",
        botMessage: "🎨 أهلاً بك في Unlimited Creation! أنا الآن في أفضل حالاتي الإبداعية. سأقدم لك إجابات مفصلة وشاملة مع كل التفاصيل التي تحتاجها!"
      };
    case "medical":
      return {
        userMessage: "🏥 تفعيل وضع المساعد الطبي",
        botMessage: "👨‍⚕️ أهلاً بك في وضع المساعد الطبي! أنا متخصص في المعلومات الطبية والصحية. اسألني عن الأعراض، الأمراض، الأدوية، أو أي استفسار طبي. تذكر: هذه معلومات توعوية فقط ولا تغني عن استشارة الطبيب!"
      };
    case "math":
      return {
        userMessage: "🔢 تفعيل وضع حل الرياضيات",
        botMessage: "📐 أهلاً بك في وضع حل الرياضيات! أنا خبير في حل المعادلات والمسائل الرياضية. أرسل لي أي معادلة أو مسألة رياضية وسأحلها لك خطوة بخطوة مع الشرح المفصل!"
      };
    default:
      return {
        userMessage: "",
        botMessage: "مرحباً! كيف يمكنني مساعدتك؟"
      };
  }
};

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stopResponse = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
    }
  }, [abortController]);

  const exitMode = useCallback(() => {
    setCurrentMode(null);
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const loadedMessages: Message[] = data.map((msg) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user,
        attachments: msg.attachments as unknown as Attachment[] | undefined,
      }));
      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
    }
  }, []);

  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setCurrentMode(null);
  }, []);

  const activateMode = useCallback((mode: string) => {
    const { userMessage, botMessage } = getModeWelcome(mode);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
    };
    
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      content: botMessage,
      isUser: false,
    };
    
    setCurrentMode(mode);
    setMessages([userMsg, botMsg]);
  }, []);

  const saveMessage = async (conversationId: string, message: Message) => {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      content: message.content,
      is_user: message.isUser,
      attachments: message.attachments as unknown as Json,
    });
  };

  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    await supabase
      .from("conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  };

  const sendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    let conversationId = currentConversationId;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("User not authenticated");
      setIsTyping(false);
      return;
    }

    // Create new conversation if needed
    if (!conversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ title: content.slice(0, 50), user_id: user.id })
        .select()
        .single();

      if (!error && data) {
        conversationId = data.id;
        setCurrentConversationId(data.id);
      }
    } else {
      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    // Save user message
    if (conversationId) {
      await saveMessage(conversationId, userMessage);
    }

    try {
      const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === "image" && attachment.file) {
            const base64 = await fileToBase64(attachment.file);
            messageContent.push({
              type: "image_url",
              image_url: { url: base64 }
            });
          } else if (attachment.type === "file" && attachment.file) {
            const fileName = attachment.name.toLowerCase();
            
            // Handle PDF files - convert to images for AI vision
            if (fileName.endsWith(".pdf")) {
              messageContent.push({
                type: "text",
                text: `📄 جاري تحليل ملف PDF: ${attachment.name}`
              });
              
              const pdfImages = await convertPdfToImages(attachment.file);
              if (pdfImages.length > 0) {
                for (let i = 0; i < pdfImages.length; i++) {
                  messageContent.push({
                    type: "image_url",
                    image_url: { url: pdfImages[i] }
                  });
                }
                messageContent.push({
                  type: "text",
                  text: `تم تحويل ${pdfImages.length} صفحة من الـ PDF إلى صور للتحليل. اقرأ كل صفحة بدقة وحل الأسئلة الموجودة.`
                });
              } else {
                messageContent.push({
                  type: "text",
                  text: `فشل في قراءة ملف الـ PDF. يرجى التأكد من أن الملف غير تالف.`
                });
              }
            }
            // Handle text files
            else if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".json") || fileName.endsWith(".csv") || fileName.endsWith(".xml") || fileName.endsWith(".html") || fileName.endsWith(".css") || fileName.endsWith(".js")) {
              const fileText = await readTextFile(attachment.file);
              messageContent.push({
                type: "text",
                text: `--- محتوى الملف: ${attachment.name} ---\n${fileText}\n--- نهاية الملف ---`
              });
            }
            // Handle DOCX, PPTX as images (user should convert or screenshot)
            else if (fileName.endsWith(".docx") || fileName.endsWith(".doc") || fileName.endsWith(".pptx") || fileName.endsWith(".ppt")) {
              messageContent.push({
                type: "text",
                text: `⚠️ ملف ${attachment.name}: لتحليل ملفات Word أو PowerPoint، يرجى تحويلها إلى PDF أو صورة ثم رفعها مرة أخرى.`
              });
            }
            // Handle images uploaded as files
            else if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".gif") || fileName.endsWith(".webp")) {
              const base64 = await fileToBase64(attachment.file);
              messageContent.push({
                type: "image_url",
                image_url: { url: base64 }
              });
            }
            // Other files
            else {
              messageContent.push({
                type: "text",
                text: `[ملف مرفق: ${attachment.name}] - هذا النوع من الملفات غير مدعوم للتحليل. الأنواع المدعومة: صور (PNG, JPG)، PDF، ملفات نصية.`
              });
            }
          }
        }
      }
      
      if (content) {
        messageContent.push({ type: "text", text: content });
      }

      const chatHistory: Array<{ role: string; content: unknown }> = [];
      
      if (currentMode) {
        let modeInstruction = "";
        switch (currentMode) {
          case "smart":
            modeInstruction = "أنت في وضع Super Mode. قدم إجابات شاملة ومفصلة وتحليلية.";
            break;
          case "fast":
            modeInstruction = "أنت في وضع Speed Mode. كن سريعاً جداً! أجب بجملة أو جملتين فقط. لا تطيل.";
            break;
          case "creative":
            modeInstruction = "أنت في وضع Unlimited Creation. قدم إجابات مفصلة جداً وشاملة مع كل التفاصيل الممكنة. اشرح كل نقطة بالتفصيل الممل.";
            break;
          case "medical":
            modeInstruction = `أنت في وضع المساعد الطبي المتخصص. أنت طبيب افتراضي ذو خبرة واسعة. يجب أن:
- تقدم معلومات طبية دقيقة وموثوقة بناءً على أحدث الأبحاث العلمية
- تشرح الأمراض والأعراض والعلاجات بطريقة مفهومة
- تذكر دائماً أن هذه معلومات توعوية ولا تغني عن استشارة الطبيب المختص
- تستخدم المصطلحات الطبية مع شرحها بشكل مبسط
- تحذر من الأعراض الخطيرة التي تستدعي زيارة الطبيب فوراً
- لا تصف أدوية أو جرعات محددة دون تأكيد ضرورة استشارة الطبيب`;
            break;
          case "math":
            modeInstruction = `أنت في وضع حل الرياضيات المتخصص. أنت خبير رياضيات محترف. يجب أن:
- تحل المعادلات والمسائل الرياضية خطوة بخطوة بالتفصيل
- تستخدم التنسيق الرياضي الواضح (يمكنك استخدام رموز مثل ² ³ √ π ∑ ∫ ≤ ≥ ≠ ∞)
- تشرح كل خطوة ولماذا تمت
- تذكر القوانين والنظريات المستخدمة
- تتعامل مع الجبر، الهندسة، حساب التفاضل والتكامل، الإحصاء، وغيرها
- تقدم طرق حل بديلة إن وجدت
- تتحقق من صحة الحل في النهاية`;
            break;
        }
        if (modeInstruction) {
          chatHistory.push({ role: "system", content: modeInstruction });
        }
      }
      
      for (const msg of messages) {
        if (msg.isUser) {
          chatHistory.push({
            role: "user",
            content: msg.content || "[رسالة سابقة مع مرفقات]"
          });
        } else {
          chatHistory.push({
            role: "assistant",
            content: msg.content
          });
        }
      }
      
      chatHistory.push({
        role: "user",
        content: messageContent.length === 1 && messageContent[0].type === "text" 
          ? messageContent[0].text 
          : messageContent
      });

      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("يرجى تسجيل الدخول أولاً");
      }

      // Create AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: chatHistory }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في الاتصال");
      }

      if (!response.body) {
        throw new Error("لا يوجد رد من الخادم");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMessageId = (Date.now() + 1).toString();
      let messageAdded = false;
      let textBuffer = "";

      // Process stream with immediate updates
      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") return;

            try {
              const parsed = JSON.parse(jsonStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                assistantContent += deltaContent;
                
                // Add message on first content received
                if (!messageAdded) {
                  messageAdded = true;
                  setIsTyping(false);
                  setMessages((prev) => [
                    ...prev,
                    { id: assistantMessageId, content: assistantContent, isUser: false },
                  ]);
                } else {
                  // Update existing message
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.findIndex(m => m.id === assistantMessageId);
                    if (lastIndex !== -1) {
                      newMessages[lastIndex] = { ...newMessages[lastIndex], content: assistantContent };
                    }
                    return newMessages;
                  });
                }
              }
            } catch {
              // Incomplete JSON - put back and wait for more
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      };

      await processStream();

      // Save assistant message
      if (conversationId && assistantContent) {
        const assistantMsg: Message = {
          id: assistantMessageId,
          content: assistantContent,
          isUser: false,
        };
        await saveMessage(conversationId, assistantMsg);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        isUser: false,
      };
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.content !== "" || msg.isUser);
        return [...filtered, errorMessage];
      });
    } finally {
      setIsTyping(false);
      setAbortController(null);
    }
  }, [messages, currentMode, currentConversationId]);

  return { 
    messages, 
    isTyping, 
    sendMessage, 
    activateMode, 
    currentMode,
    exitMode,
    currentConversationId,
    loadConversation,
    newConversation,
    stopResponse
  };
};
