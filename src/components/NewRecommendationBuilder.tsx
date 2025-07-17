"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import LoadingScreen from "./LoadingScreen";
import NewBuildResultDisplay, { BuildRecommendation } from "./NewBuildResultDisplay";
import { Bot, User, Send, Loader2, MessageSquare, RefreshCw, ArrowLeft, Sparkles, Zap } from "lucide-react";

// System prompt for the recommendation system
const recommendationSystemPrompt = `You are an expert PC building not upgrading recommendation assistant with deep knowledge of computer hardware, software requirements, and usage patterns. Your goal is to have a natural conversation with users to understand their PC needs, while inferring technical requirements from their responses. Follow these guidelines:

0. DO NOT HALLUCINATE ALWAYS STRICTLY FOLLOW THE INSTRUCTIONS
1. Have a casual and concise and short direct interactions, friendly conversation. Don't ask for explicit ratings or technical specifications directly - interpret them from context.
2. Ask open-ended questions about what they want to do with their PC, rather than asking for specific hardware preferences.
3. Make sure to finish the conversation within 6 exchanges. Unless the user explicitly asks to continue
4. Based on their responses, expertly infer:
   - Approximate budget (convert to ₹ if necessary)
   - Use case requirements by interpreting mentions of various activities
   - Technical preferences by interpreting user needs
   - Performance priorities based on their most emphasized needs during conversation

5. Always ask the user for budget at least once. if the user refuses or doesnt bother to specify dont pry. estimate it yourself to the precise extent.

6. Keep the conversation flowing naturally for 5-10 exchanges before formulating your recommendation.

7. After you feel you understand their needs, say "I think I have a good understanding of your requirements now. Let me build a custom PC for you." Then invisibly and without showing the user, map their requirements to this JSON format:

{
  "budget": 120000,
  "useCases": {
    "gaming": {"needed": true, "intensity": 8},
    "videoEditing": {"needed": false, "intensity": 0},
    "rendering3D": {"needed": false, "intensity": 0},
    "programming": {"needed": true, "intensity": 5},
    "officeWork": {"needed": true, "intensity": 3},
    "streaming": {"needed": false, "intensity": 0}
  },
  "technicalPreferences": {
    "cpuPlatform": "AMD",
    "gpuPlatform": "NVIDIA",
    "marketSegment": "Consumer",
    "formFactor": "Mid tower",
    "rgbImportance": 7,
    "noiseLevel": "Balanced",
    "upgradePathImportance": 8,
    "storage": {
      "ssdCapacity": "1TB",
      "hddCapacity": "2TB"
    },
    "connectivity": {
      "wifi": true,
      "bluetooth": true,
      "usbPorts": "Multiple USB 3.0 and USB-C"
    }
  },
  "performancePriorities": {
    "cpu": 7,
    "gpu": 9,
    "ram": 6,
    "storageSpeed": 5
  }
}

IMPORTANT GUIDELINES FOR CONVERSATION:
- Never show the JSON to the user. When you're ready to generate the recommendation, say "I think I have a good understanding of your requirements now. Let me build a custom PC for you." and then output the JSON between special markers like this: <JSON_START>{ your actual JSON here }</JSON_START>
- Make sure to use the correct closing tag </JSON_START> (not <JSON_END>)
- The <JSON_START> markers should not be visible to the user, they will be processed automatically.
- Be conversational and friendly - never ask for ratings on a scale
- Infer technical requirements from casual conversation
- Be knowledgeable about modern games, applications, and their hardware requirements

Remember to keep your questions conversational and natural. Once you've gathered enough information, say "I think I have a good understanding of your requirements now. Let me build a custom PC for you." and then output the JSON with the special markers.`;

// Define types for the user preferences structure
interface UserPreferencesJson {
  budget: number;
  useCases: {
    gaming: { needed: boolean; intensity: number };
    videoEditing: { needed: boolean; intensity: number };
    rendering3D: { needed: boolean; intensity: number };
    programming: { needed: boolean; intensity: number };
    officeWork: { needed: boolean; intensity: number };
    streaming: { needed: boolean; intensity: number };
  };
  technicalPreferences: {
    cpuPlatform?: string;
    gpuPlatform?: string;
    marketSegment: string;
    formFactor?: string;
    rgbImportance?: number;
    noiseLevel?: string;
    upgradePathImportance?: number;
    storage: {
      ssdCapacity?: string;
      hddCapacity?: string;
    };
    connectivity: {
      wifi?: boolean;
      bluetooth?: boolean;
      usbPorts?: string;
    };
  };
  performancePriorities: {
    cpu?: number;
    gpu?: number;
    ram?: number;
    storageSpeed?: number;
  };
}

// Define the screen states
type Screen = "welcome" | "chat" | "loading" | "results";

const NewRecommendationBuilder = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pcBuild, setPcBuild] = useState<BuildRecommendation | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Added for typing animation
  const [typingText, setTypingText] = useState("");
  const [fullResponse, setFullResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Initialize with system prompt
  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading, isTyping]);

  useEffect(() => {
    setMessages([{ role: "system", content: recommendationSystemPrompt }]);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  // Typing animation effect
  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    let charIndex = 0;
    
    if (isTyping && fullResponse) {
      typingTimer = setInterval(() => {
        if (charIndex <= fullResponse.length) {
          setTypingText(fullResponse.substring(0, charIndex));
          charIndex += 3;
        } else {
          clearInterval(typingTimer);
          setIsTyping(false);
          
          setMessages((prev) => {
            const withoutEmptyMessage = prev.filter((msg, idx) => 
              !(idx === prev.length - 1 && msg.role === "assistant" && msg.content === "")
            );
            return [...withoutEmptyMessage, { role: "assistant", content: fullResponse }];
          });
          
          setFullResponse("");
          setTypingText("");
        }
      }, 10);
    }
    
    return () => clearInterval(typingTimer);
  }, [isTyping, fullResponse]);

  // Function to extract JSON from a message
  const extractJson = (message: string) => {
    const jsonRegex = /<JSON_START>([\s\S]*?)<\/JSON_START>/;
    const match = message.match(jsonRegex);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }
    return null;
  };

  // Process the response to remove the JSON if present
  const processResponseAndExtractJson = (fullResponse: string) => {
    const jsonData = extractJson(fullResponse);
    let cleanedResponse = fullResponse;

    if (jsonData) {
      cleanedResponse = fullResponse
        .replace(/<JSON_START>[\s\S]*?<\/JSON_START>/, "")
        .trim();

      if (cleanedResponse.includes("Let me build a custom PC for you")) {
        cleanedResponse =
          "I think I have a good understanding of your requirements now. Let me build a custom PC for you.";
      }
    }

    return { jsonData, cleanedResponse };
  };

  // Function to send preferences to recommendation system
  const sendToRecommendationSystem = async (preferences: UserPreferencesJson) => {
    try {
      setScreen("loading");
      console.log("Sending preferences to recommendation API:", JSON.stringify(preferences, null, 2));

      const response = await axios.post("/api/recommendation", { preferences });
      console.log("Received recommendation response:", JSON.stringify(response.data, null, 2));

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setPcBuild(response.data);
      setScreen("results");
    } catch (error) {
      console.error("Error sending to recommendation system:", error);
      setScreen("chat");
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error while processing your PC build recommendation: ${errorMessage}. Please try again with different requirements.`,
        },
      ]);
    }
  };

  // Function to start chatting
  const startChatting = () => {
    setScreen("chat");
    // Add initial greeting
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Hi there! I'm your PC building assistant. I'm here to help you build the perfect PC for your needs. Let's start by understanding what you'll be using your PC for. What are your main activities - gaming, work, content creation, or something else?",
      },
    ]);
    // Focus the input after screen change
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Function to restart the process
  const handleRestart = () => {
    setScreen("welcome");
    setPcBuild(null);
    setMessages([{ role: "system", content: recommendationSystemPrompt }]);
    setInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const chatMessages = [
        ...messages,
        { role: "user", content: userMessage },
      ];

      const response = await axios.post('/api/chat', {
        messages: chatMessages.filter(msg => msg.role !== 'system'),
      });

      const fullResponseData = response.data.response;
      const { jsonData, cleanedResponse } = processResponseAndExtractJson(fullResponseData);

      setFullResponse(cleanedResponse);
      setIsTyping(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (jsonData && jsonData.budget && jsonData.useCases && jsonData.technicalPreferences) {
        console.log("Found valid JSON configuration:", jsonData);
        setTimeout(() => {
          sendToRecommendationSystem(jsonData);
        }, cleanedResponse.length * 15 + 500);
      }
    } catch (error) {
      console.error("Error:", error);
      setFullResponse("Sorry, I encountered an error. Please make sure the API is configured correctly.");
      setIsTyping(true);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    }

    setIsLoading(false);
  };

  const displayMessages = messages.filter((msg) => msg.role !== "system");

  // Welcome Screen
  if (screen === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full">
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                Smart PC
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Assistant
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Let's have a conversation about your PC needs. I'll ask you friendly questions and recommend the perfect build for you.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
              <div className="bg-white/80 rounded-xl p-6 border border-gray-200 shadow-sm">
                <Sparkles className="w-8 h-8 text-yellow-500 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligent Questions</h3>
                <p className="text-gray-600 text-sm">Natural conversation that understands your needs without technical jargon</p>
              </div>
              <div className="bg-white/80 rounded-xl p-6 border border-gray-200 shadow-sm">
                <Zap className="w-8 h-8 text-blue-500 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Aware</h3>
                <p className="text-gray-600 text-sm">Gets the best performance within your budget constraints</p>
              </div>
              <div className="bg-white/80 rounded-xl p-6 border border-gray-200 shadow-sm">
                <Bot className="w-8 h-8 text-green-500 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Knowledge</h3>
                <p className="text-gray-600 text-sm">Powered by deep hardware knowledge and compatibility checking</p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <button
                onClick={startChatting}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Building My PC
              </button>
              <p className="text-gray-500 text-sm">
                Takes about 2-3 minutes • No technical knowledge required
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (screen === "loading") {
    return <LoadingScreen />;
  }

  // Results Screen
  if (screen === "results" && pcBuild) {
    return <NewBuildResultDisplay pcBuild={pcBuild} onRestart={handleRestart} />;
  }

  // Chat Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-gray-900 font-semibold">PC Building Assistant</h2>
                <p className="text-gray-600 text-sm">Let's find your perfect PC build</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {displayMessages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/80 border border-gray-200 shadow-sm text-gray-900"
                }`}
              >
                {isTyping && index === messages.length - 1 && message.role === "assistant" ? (
                  <p className="whitespace-pre-wrap text-gray-900">{typingText}</p>
                ) : message.role === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-gray max-w-none text-gray-900">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && !isTyping && (
            <div className="flex items-start gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot size={16} className="text-blue-600" />
              </div>
              <div className="bg-white/80 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-gray-900">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me about your PC needs..."
              className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-300 focus:border-blue-500 focus:outline-none placeholder-gray-500 shadow-sm"
              disabled={isLoading || isTyping}
            />
            <button
              type="submit"
              disabled={isLoading || isTyping || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRecommendationBuilder;
