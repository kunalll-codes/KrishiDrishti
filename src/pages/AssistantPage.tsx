import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import { streamChatMessage } from '../services/api';
import { Send, Mic, MicOff, Bot, User } from 'lucide-react';

interface AssistantPageProps {
  language: Language;
  onLanguageToggle: (lang: Language) => void;
  geminiConfigured: boolean;
}

export function AssistantPage({ language, onLanguageToggle, geminiConfigured }: AssistantPageProps) {
  const t = getTranslation(language);

  // Initial welcome message
  const getInitialMessages = (): ChatMessage[] => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        language === 'hi'
          ? 'नमस्ते! मैं कृषि सहायक हूँ। फसलों की देखभाल, सिंचाई, कीट रोकथाम और खेती से संबंधित सवाल पूछें।'
          : 'Hello! I am Krishi Assistant. Ask me questions about crop care, irrigation schedules, disease management, and cultivation.',
      timestamp: 'Just now',
      isDemo: false,
      isStreaming: false,
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Smooth scroll container to bottom without jumping page
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Scroll to bottom on initial message load
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // Speech Recognition setup (Browser native Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not initialize SpeechRecognition:', err);
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      setSpeechNotice(
        language === 'hi'
          ? 'आपके ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। कृपया लिखकर प्रश्न पूछें।'
          : 'Speech recognition is not supported in this browser environment. Please type your question.'
      );
      setTimeout(() => setSpeechNotice(null), 5000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setSpeechNotice(null);
        recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech start error:', e);
        setIsListening(false);
      }
    }
  };

  // Progressive streaming message send
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMsgId = `ai-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      isDemo: false,
    };

    // Append both user message and assistant streaming placeholder immediately
    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll smoothly to show the new assistant message bubble
    setTimeout(() => scrollToBottom(true), 30);

    let lastScrollTime = 0;

    try {
      // Build conversation history payload from preceding messages (retain up to 16 messages for deep crop context)
      const historyPayload = messages
        .filter((m) => m.content && m.content.trim().length > 0)
        .slice(-16)
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

      const res = await streamChatMessage(
        text,
        historyPayload,
        language,
        (_chunk, fullText, isDemo) => {
          // Progressively update assistant message content as chunks stream in
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: fullText,
                    isDemo: isDemo ?? msg.isDemo,
                    isStreaming: true,
                  }
                : msg
            )
          );

          // Keep chat scrolled near the newest content without jumping the page
          const now = Date.now();
          if (now - lastScrollTime > 60) {
            lastScrollTime = now;
            scrollToBottom(false);
          }
        }
      );

      // Finalize assistant message with isStreaming: false (removes cursor)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: res.reply || msg.content,
                isDemo: res.isDemo,
                isStreaming: false,
              }
            : msg
        )
      );

      setTimeout(() => scrollToBottom(true), 40);
    } catch (err: any) {
      console.error('Chat stream error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  language === 'hi'
                    ? 'माफ़ कीजिए, उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें अथवा स्थानीय कृषि विशेषज्ञ से संपर्क करें।'
                    : "I'm having trouble connecting to the agricultural AI service. Please check your connection and try again.",
                isDemo: true,
                isStreaming: false,
              }
            : msg
        )
      );
      setTimeout(() => scrollToBottom(true), 40);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    { key: 'q1', text: t.q1 },
    { key: 'q2', text: t.q2 },
    { key: 'q3', text: t.q3 },
    { key: 'q4', text: t.q4 },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-24 md:pb-16 flex flex-col h-[calc(100vh-5rem)] max-h-[850px]" id="assistant-page-container">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {t.assistantTitle}
            </h1>
            {!geminiConfigured && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                {t.demoMode}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-700">
            {t.assistantSubtitle}
          </p>
        </div>

        {/* Small Assistant Language Toggle */}
        <div className="flex items-center bg-stone-200/80 p-0.5 rounded-md border border-stone-300 text-xs font-medium shrink-0">
          <button
            onClick={() => onLanguageToggle('en')}
            className={`px-2 py-1 rounded transition-colors ${
              language === 'en' ? 'bg-white text-stone-900 font-semibold shadow-2xs' : 'text-stone-700'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageToggle('hi')}
            className={`px-2 py-1 rounded transition-colors ${
              language === 'hi' ? 'bg-white text-emerald-950 font-semibold shadow-2xs' : 'text-stone-700'
            }`}
          >
            हिं
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col overflow-hidden min-h-0">
        
        {/* Messages Scroll Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
          id="chat-messages-area"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 text-sm shadow-2xs ${
                    isUser
                      ? 'bg-emerald-800 text-white rounded-tr-xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-tl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.content ? (
                    <div className="text-stone-900 leading-relaxed text-sm">
                      <Markdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-stone-800">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 text-stone-800">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-stone-950">{children}</strong>,
                          h1: ({ children }) => <h1 className="text-base font-bold text-stone-950 mt-2.5 mb-1.5">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold text-stone-950 mt-2 mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold text-stone-900 mt-1.5 mb-1">{children}</h3>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-emerald-600 pl-3 py-0.5 my-2 text-stone-700 italic">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="bg-stone-200/80 text-stone-800 px-1 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {msg.content}
                      </Markdown>
                      {/* Subtle blinking typing cursor while actively streaming */}
                      {msg.isStreaming && (
                        <span
                          className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-emerald-700 animate-pulse rounded-xs"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ) : (
                    /* Initial thinking state before the first chunk arrives */
                    <div className="flex items-center gap-1.5 py-1 text-stone-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                      <span className="text-xs text-stone-500 font-medium ml-1.5">
                        {language === 'hi' ? 'कृषि सहायक सोच रहा है...' : 'Krishi Assistant is thinking...'}
                      </span>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                      isUser ? 'text-emerald-200 justify-end' : 'text-stone-700 justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isDemo && (
                      <span className="font-mono bg-amber-100 text-amber-900 px-1 rounded">
                        demo
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-200 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-700 shrink-0">
            {t.quickSuggestionsTitle}
          </span>
          {quickQuestions.map((q) => (
            <button
              key={q.key}
              onClick={() => handleSendMessage(q.text)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-700 hover:text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors shrink-0 disabled:opacity-50"
            >
              {q.text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        {speechNotice && (
          <div className="px-3.5 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs flex items-center justify-between animate-fade-in">
            <span>{speechNotice}</span>
            <button
              onClick={() => setSpeechNotice(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2 text-sm leading-none"
              aria-label="Dismiss notice"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
          {/* Speech recognition button */}
          <button
            type="button"
            onClick={toggleListening}
            title={speechSupported ? t.micTip : 'Voice input not available on this browser'}
            disabled={isLoading}
            className={`p-2.5 rounded-lg border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 ${
              isListening
                ? 'bg-red-500 text-white border-red-600 animate-pulse'
                : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
            }`}
            aria-label={t.micTip}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? t.listening : t.assistantPlaceholder}
            disabled={isLoading}
            id="chat-input-field"
            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all min-h-[44px] disabled:opacity-60"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            id="chat-send-btn"
            className="p-2.5 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs"
            aria-label={t.btnSend}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Safety Advisory Footer note */}
      <div className="mt-2.5 px-2 text-center">
        <p className="text-[11px] text-stone-700 leading-tight">
          {language === 'hi'
            ? 'सहायक सामान्य कृषि मार्गदर्शन प्रदान करता है। रासायनिक खुराक के लिए स्थानीय कृषि विज्ञान केंद्र (KVK) से परामर्श लें।'
            : 'Assistant provides general crop care guidance. Verify specific pesticide formulations with your local KVK or extension centre.'}
        </p>
      </div>

    </div>
  );
}
