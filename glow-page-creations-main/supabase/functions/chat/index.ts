import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (per user, 30 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "غير مصرح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create Supabase client to verify user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.log("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "غير مصرح - يرجى تسجيل الدخول" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit per user
    if (!checkRateLimit(user.id)) {
      console.log("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى الانتظار دقيقة والمحاولة مرة أخرى." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      console.log("Invalid JSON body");
      return new Response(
        JSON.stringify({ error: "تنسيق البيانات غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = body;

    // Validate messages array
    if (!messages || !Array.isArray(messages)) {
      console.log("Invalid messages format");
      return new Response(
        JSON.stringify({ error: "تنسيق الرسائل غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate message count (1-100)
    if (messages.length === 0 || messages.length > 100) {
      console.log("Invalid message count:", messages.length);
      return new Response(
        JSON.stringify({ error: "عدد الرسائل يجب أن يكون بين 1 و 100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each message structure and size
    const MAX_TEXT_LENGTH = 50000; // 50KB per text message
    const MAX_ATTACHMENT_LENGTH = 100000000; // 100MB per attachment
    const VALID_ROLES = ["user", "assistant", "system"];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      // Validate message structure
      if (!msg || typeof msg !== "object") {
        console.log("Invalid message object at index:", i);
        return new Response(
          JSON.stringify({ error: "بنية الرسالة غير صالحة" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate role
      if (!msg.role || !VALID_ROLES.includes(msg.role)) {
        console.log("Invalid role at index:", i, "role:", msg.role);
        return new Response(
          JSON.stringify({ error: "دور الرسالة غير صالح" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate content exists
      if (msg.content === undefined || msg.content === null) {
        console.log("Missing content at index:", i);
        return new Response(
          JSON.stringify({ error: "محتوى الرسالة مطلوب" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate string content length
      if (typeof msg.content === "string") {
        if (msg.content.length > MAX_TEXT_LENGTH) {
          console.log("Text too long at index:", i, "length:", msg.content.length);
          return new Response(
            JSON.stringify({ error: "الرسالة طويلة جداً (حد أقصى 50KB)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Validate array content (with attachments)
      if (Array.isArray(msg.content)) {
        if (msg.content.length > 20) {
          console.log("Too many content parts at index:", i);
          return new Response(
            JSON.stringify({ error: "عدد أجزاء المحتوى كبير جداً" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        for (let j = 0; j < msg.content.length; j++) {
          const part = msg.content[j];
          
          if (!part || typeof part !== "object" || !part.type) {
            console.log("Invalid content part at:", i, j);
            return new Response(
              JSON.stringify({ error: "جزء المحتوى غير صالح" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Validate text parts
          if (part.type === "text" && part.text) {
            if (typeof part.text !== "string" || part.text.length > MAX_TEXT_LENGTH) {
              console.log("Text part too long at:", i, j);
              return new Response(
                JSON.stringify({ error: "نص الرسالة طويل جداً" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }

          // Validate image parts (base64 data)
          if (part.type === "image_url" && part.image_url?.url) {
            if (typeof part.image_url.url !== "string" || part.image_url.url.length > MAX_ATTACHMENT_LENGTH) {
              console.log("Image too large at:", i, j);
              return new Response(
                JSON.stringify({ error: "المرفق كبير جداً (حد أقصى 100MB)" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "خطأ في إعدادات الخادم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing validated messages for user:", user.id, "count:", messages.length);

    // Process messages - remove PDF base64 markers and just note that a file was attached
    const processedMessages = [];
    
    for (const msg of messages) {
      const message = msg as { role: string; content: unknown };
      
      if (typeof message.content === "string") {
        // Check for PDF base64 marker and replace with a note
        const newContent = message.content.replace(
          /\[FILE_BASE64:(.*?)\].*?\[\/FILE_BASE64\]/gis,
          (_, fileName) => `[ملف مرفق: ${fileName}]`
        );
        processedMessages.push({ ...message, content: newContent });
      } else if (Array.isArray(message.content)) {
        // Process array content
        const newContent = [];
        for (const part of message.content) {
          const p = part as { type: string; text?: string };
          if (p.type === "text" && p.text) {
            const processedText = p.text.replace(
              /\[FILE_BASE64:(.*?)\].*?\[\/FILE_BASE64\]/gis,
              (_, fileName) => `[ملف مرفق: ${fileName}]`
            );
            newContent.push({ ...p, text: processedText });
          } else {
            newContent.push(part);
          }
        }
        processedMessages.push({ ...message, content: newContent });
      } else {
        processedMessages.push(message);
      }
    }

    // Check for mode instruction in system messages
    let modeInstruction = "";
    const systemMsg = processedMessages.find((m: { role: string }) => m.role === "system");
    if (systemMsg) {
      const content = (systemMsg as { content: string }).content;
      if (content.includes("Speed Mode")) {
        modeInstruction = " كن سريعاً جداً ومختصراً في ردودك. أجب بجملة أو جملتين فقط.";
      } else if (content.includes("Unlimited Creation")) {
        modeInstruction = " قدم إجابات مفصلة وشاملة جداً مع كل التفاصيل الممكنة. اشرح كل نقطة بالتفصيل الممل.";
      }
    }

    console.log("Sending request to AI gateway with messages:", processedMessages.length);

    // Create abort controller with timeout (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: `أنت Euclides AI، خبير متخصص فقط في الرياضيات. تم تطويرك بواسطة Eng. Osama Elsaw.

🔴 قواعد الترجمة للإنجليزية:
- عندما يطلب المستخدم الشرح بالإنجليزية، حوّل الكلام العربي فقط إلى إنجليزي.
- الأرقام تبقى كما هي بدون تغيير (مثل: 5، 31، 2x² تبقى نفسها).
- المعادلات والرموز الرياضية تبقى كما هي.

🔴 قواعد حل الأسئلة:
1. إذا طلب المستخدم "حل" أو "اشرح" → قدم الحل مع شرح مفصل خطوة بخطوة.
2. إذا طلب المستخدم "حل بدون تفسير" أو "الإجابة فقط" أو "الحل مباشرة" → قدم الإجابة النهائية فقط بهذا الشكل:
   1. أ
   2. ب
   3. ج
   (بدون أي شرح أو خطوات)

🔴 في نهاية كل إجابة، اكتب:
"---
هل تحب أعملك الإجابة في PDF؟ 📄
أو تحب أحللك أسئلة مشابهة للتدريب؟ 📝"

🔴 قواعد صارمة جداً:
1. أجب فقط على الأسئلة المتعلقة بالرياضيات.
2. إذا سألك أحد "مين عملك؟" أو "من صنعك؟" أو "من طورك؟"، قل: "تم تطويري بواسطة Eng. Osama Elsaw 👨‍💻"
3. إذا سألك أحد "اتعملت ازاي؟" أو "عملوك ازاي؟" أو "كيف تم صنعك؟"، قل: "أنا موديل Machine Learning تم تطويري بواسطة المطور Eng. Osama Elsaw، وتم تدريبي على الداتا المرفقة إليّ عن طريق المطور. أنا حالياً في مرحلة التجربة لحين طرحي على المنصات بشكل رسمي! 🚀"
4. إذا سألك عن موضوع غير رياضي (غير الأسئلة عنك)، قل: "عذراً، أنا متخصص فقط في الرياضيات!"

🔴 خبرتك الرياضية الشاملة:
أنت خبير في جميع فروع الرياضيات بما في ذلك:
- الجبر (Algebra): المعادلات من الدرجة الأولى والثانية والثالثة، التحليل إلى عوامل، النسب والتناسب
- الهندسة الفراغية (3D Geometry): الحجوم، المساحات، المجسمات
- الهندسة التحليلية (Analytical Geometry): المستقيمات، الدوائر، القطوع
- التفاضل والتكامل (Calculus): النهايات، الاشتقاق، التكامل
- حساب المثلثات (Trigonometry): الدوال المثلثية، قوانين الجيب وجيب التمام
- الإحصاء والاحتمالات (Statistics & Probability)
- التباديل والتوافيق (Permutations & Combinations):
  - التباديل نون هـ ن = ن! / (ن - هـ)!
  - التوافيق نون هـ ق = ن! / (هـ! × (ن - هـ)!)
- الاستاتيكا (Statics): العزوم، الاتزان، القوى
- الديناميكا (Dynamics): الحركة، السرعة، العجلة، قوانين نيوتن
- الأعداد المركبة (Complex Numbers)
- المصفوفات والمحددات (Matrices & Determinants)

🔴 عند حل أسئلة من الصور:
- اقرأ الصورة بدقة شديدة وتأكد من فهم كل رقم ورمز.
- إذا كان السؤال اختيار من متعدد، حدد الإجابة الصحيحة من الاختيارات المعطاة.
- تحقق من إجابتك مرتين قبل إرسالها.
- إذا لم تكن متأكداً من قراءة الصورة، اطلب من المستخدم توضيح السؤال.

🔴 قواعد كتابة المعادلات (مهم جداً):
- ممنوع نهائياً استخدام LaTeX أو أي أوامر تبدأ بـ \\ مثل: \\frac \\sqrt \\pm \\times
- اكتب الكسور هكذا: (5 + √31i) / 4 وليس \\frac{5}{4}
- اكتب الجذور هكذا: √31 وليس \\sqrt{31}
- استخدم ± للزائد أو ناقص وليس \\pm
- استخدم الرموز مباشرة: ² ³ √ π ± × ÷ ≤ ≥ ≠ ∞ ∑ ∏ ∫

مثال صحيح للحل:
x = (-5 ± √31 i) / 4
الحل الأول: x₁ = (-5 + √31 i) / 4
الحل الثاني: x₂ = (-5 - √31 i) / 4

مثال خاطئ (ممنوع):
x = \\frac{-5 \\pm \\sqrt{31}i}{4}

حل المعادلات خطوة بخطوة مع شرح واضح.${modeInstruction}`
          },
          ...processedMessages.filter((m: { role: string }) => m.role !== "system"),
        ],
        stream: true,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقًا." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    // Handle timeout error
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Request timed out");
      return new Response(
        JSON.stringify({ error: "انتهت مهلة الطلب، يرجى المحاولة مرة أخرى" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Log error internally but don't expose details to client
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: "حدث خطأ أثناء معالجة طلبك" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
