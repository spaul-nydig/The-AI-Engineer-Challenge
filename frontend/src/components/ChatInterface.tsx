"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "warning" | "info";
}

// Toast component for notifications
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getToastStyles = () => {
    switch (toast.type) {
      case "error":
        return "bg-red-500 text-white border-red-600";
      case "success":
        return "bg-green-500 text-white border-green-600";
      case "warning":
        return "bg-yellow-500 text-white border-yellow-600";
      case "info":
        return "bg-blue-500 text-white border-blue-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "error":
        return "❌";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📝";
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-right ${getToastStyles()}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getIcon()}</span>
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className="ml-2 text-white hover:text-gray-200 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [developerMessage, setDeveloperMessage] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toast management functions
  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Error message parsing function
  const parseErrorMessage = (error: unknown, status?: number): { message: string; type: Toast["type"] } => {
    const errorString = error instanceof Error ? error.message : 
                       typeof error === 'string' ? error : 
                       (error as { detail?: string })?.detail || 
                       "Unknown error occurred";
    
    // Check for common OpenAI API errors
    if (status === 401 || errorString.toLowerCase().includes("unauthorized") || errorString.toLowerCase().includes("invalid api key")) {
      return {
        message: "Invalid API key. Please check your OpenAI API key and try again.",
        type: "error"
      };
    }
    
    if (status === 429 || errorString.toLowerCase().includes("rate limit") || errorString.toLowerCase().includes("quota")) {
      return {
        message: "Rate limit exceeded or insufficient quota. Please check your OpenAI account.",
        type: "warning"
      };
    }
    
    if (status === 400 || errorString.toLowerCase().includes("bad request")) {
      return {
        message: "Invalid request. Please check your input and selected model.",
        type: "error"
      };
    }
    
    if (status === 404 || errorString.toLowerCase().includes("not found")) {
      return {
        message: "Model not found. Please select a different model.",
        type: "error"
      };
    }
    
    if (status === 500 || errorString.toLowerCase().includes("internal server error")) {
      return {
        message: "OpenAI service is temporarily unavailable. Please try again later.",
        type: "error"
      };
    }
    
    if (errorString.toLowerCase().includes("network") || errorString.toLowerCase().includes("fetch")) {
      return {
        message: "Network error. Please check your internet connection and try again.",
        type: "error"
      };
    }
    
    // Default error message
    return {
      message: `Error: ${errorString}`,
      type: "error"
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation with specific error messages
    if (!apiKey.trim()) {
      addToast("Please enter your OpenAI API key", "warning");
      return;
    }
    
    if (!userMessage.trim()) {
      addToast("Please enter a message", "warning");
      return;
    }

    // Clear any existing errors
    setError("");
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          developer_message: developerMessage || "You are a helpful assistant.",
          user_message: userMessage,
          model: model,
          api_key: apiKey,
        }),
      });

      // Enhanced error handling with specific status codes
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const { message, type } = parseErrorMessage(errorData.detail || errorData, response.status);
        addToast(message, type);
        setError(message);
        
        // Remove the user message if there was an error
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message that we'll build up
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            assistantContent += chunk;
            
            // Update the last message (assistant's response)
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: assistantContent,
              };
              return updated;
            });
          }
          
          // Show success toast when message is complete, or handle empty response
          if (assistantContent.trim()) {
            addToast("Message sent successfully!", "success");
          } else {
            // Empty response likely indicates an API key or authentication error
            const { message, type } = parseErrorMessage("No response received from AI. This usually indicates an invalid API key or authentication issue.", 401);
            addToast(message, type);
            setError(message);
            
            // Remove the empty assistant message
            setMessages(prev => prev.slice(0, -1));
            return;
          }
        } catch (streamError) {
          console.error("Stream reading error:", streamError);
          // Check if this looks like an authentication/API key error
          const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
          let finalError;
          
          if (errorMessage.toLowerCase().includes("connection") || 
              errorMessage.toLowerCase().includes("network") ||
              errorMessage.toLowerCase().includes("chunk")) {
            // This pattern often indicates invalid API key causing connection issues
            finalError = "Connection failed while reading AI response. This usually indicates an invalid API key or authentication issue. Please check your OpenAI API key.";
          } else {
            finalError = streamError;
          }
          
          const { message, type } = parseErrorMessage(finalError, 401);
          addToast(message, type);
          setError(message);
          
          // Remove partial assistant message
          setMessages(prev => prev.slice(0, -1));
          return;
        }
      }

      setUserMessage("");
    } catch (error) {
      console.error("Error:", error);
      const { message, type } = parseErrorMessage(error);
      addToast(message, type);
      setError(message);
      
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
    addToast("Chat cleared", "info");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <ToastNotification key={toast.id} toast={toast} onClose={removeToast} />
      ))}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Interface</h1>
          <p className="text-gray-600">Chat with OpenAI&apos;s GPT models</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                OpenAI API Key
                {apiKey.trim() && (
                  <span className="ml-2 text-xs text-green-600">✓ Entered</span>
                )}
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!apiKey.trim() && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-red-400 text-sm">⚠️</span>
                  </div>
                )}
              </div>
              {!apiKey.trim() && (
                <p className="text-xs text-red-600 mt-1">API key is required</p>
              )}
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label htmlFor="developerMessage" className="block text-sm font-medium text-gray-700 mb-1">
                System Message
              </label>
              <input
                id="developerMessage"
                type="text"
                value={developerMessage}
                onChange={(e) => setDeveloperMessage(e.target.value)}
                placeholder="You are a helpful assistant"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-12">
              <p className="text-lg">Start a conversation with the AI</p>
              <p className="text-sm mt-2">Enter your message below to get started</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="text-left mb-4">
              <div className="inline-block bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Type your message here..."
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !userMessage.trim() || !apiKey.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={clearChat}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}