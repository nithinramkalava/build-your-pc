"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import LoadingScreen from "./LoadingScreen";
import BuildResultDisplay, { BuildRecommendation } from "./BuildResultDisplay";
import { Bot, User, Send, Loader2 } from "lucide-react";

// System prompt for the recommendation system
const recommendationSystemPrompt = `You are an expert PC building recommendation assistant with deep knowledge of computer hardware, software requirements, and usage patterns. Your goal is to have a natural conversation with users to understand their PC needs, while inferring technical requirements from their responses. Follow these guidelines:
0. DO NOT HALLUCINATE ALWAYS STRICTLY FOLLOW THE INSTRUCTIONS
1. Have a casual, friendly conversation. Don't ask for explicit ratings or technical specifications directly - interpret them from context.
2. Ask open-ended questions about what they want to do with their PC, rather than asking for specific hardware preferences.
3. Make sure to finish the conversation within 6 exchanges. Unless the user explicitly asks to continue
4. Based on their responses, expertly infer:

   - Approximate budget (convert to ₹ if necessary)
   - Use case requirements by interpreting mentions of:
     - Games (e.g., "I play Red Dead Redemption 2" = high gaming intensity of 8-9)
     - Video work (e.g., "I edit YouTube videos occasionally" = medium video editing intensity of 5-6)
     - 3D projects (e.g., "I use Blender for school projects" = moderate 3D rendering intensity of 5-6)
     - Development needs (e.g., "I'm a full-stack developer with multiple VMs" = high programming intensity of 8-9)
     - Office tasks (e.g., "I use Excel for work" = moderate office work intensity of 5-6)
     - Streaming (e.g., "I stream on Twitch weekly" = high streaming intensity of 7-8)
   
   - Technical preferences by interpreting:
     - Brand preferences they mention (Intel/AMD/NVIDIA)
     - Market segment needs ("I need it for professional work" = Workstation, vs regular use = Consumer)
     - Size concerns ("I have limited space" = smaller form factor)
     - Aesthetic mentions ("I want it to look cool with lights" = higher RGB importance)
     - Noise concerns ("I need it to be quiet" = silent preference)
     - Future-proofing mentions ("I want it to last 5+ years" = high upgrade importance)
     - Storage needs from their mentioned usage patterns
     - Connectivity needs from their mentioned devices/peripherals
   
   - Performance priorities based on their most emphasized needs during conversation

5. Always ask the user for budget at least once. if the user refuses or doesnt bother to specify dont pry. estimate it yourself to the precise extint.

6. Keep the conversation flowing naturally for 5-10 exchanges before formulating your recommendation.

7. After you feel you understand their needs, say "I think I have a good understanding of your requirements now. Let me build a custom PC for you." Then invisibly and without showing the user, map their requirements to this JSON format:

\`\`\`json
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
\`\`\`

IMPORTANT GUIDELINES FOR CONVERSATION:
- Never show the JSON to the user. When you're ready to generate the recommendation, say "I think I have a good understanding of your requirements now. Let me build a custom PC for you." and then output the JSON between special markers like this: <JSON_START>{ your actual JSON here }</JSON_START>
- Make sure to use the correct closing tag </JSON_START> (not <JSON_END>)
- The <JSON_START> markers should not be visible to the user, they will be processed automatically.
- Be conversational and friendly - never ask for ratings on a scale
- Infer technical requirements from casual conversation
- Be knowledgeable about modern games, applications, and their hardware requirements
- If a user mentions a specific application or game, use your knowledge to infer the appropriate system requirements
- If they say "I want to play Red Dead Redemption 2", understand this means high gaming requirements without asking them to rate it
- If they mention budget constraints, respect them in your assessment
- If they don't mention a use case, assume the intensity is 0
- For marketSegment, set to "Consumer" for typical users who mention gaming, web browsing, general use. Set to "Workstation" if they mention professional workloads like CAD, video production, 3D rendering, scientific computing, or data analysis
- After sufficient conversation, DO NOT display the JSON but output it with the special markers.

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
type Screen = "chat" | "loading" | "results";

const RecommendationBuilder = () => {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pcBuild, setPcBuild] = useState<BuildRecommendation | null>(null);
  const [screen, setScreen] = useState<Screen>("chat");
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
          charIndex += 3; // Increase typing speed by processing more characters per interval
        } else {
          clearInterval(typingTimer);
          setIsTyping(false);
          
          // Add the completed message to the messages array
          setMessages((prev) => {
            // Remove the temporary empty message and add the complete one
            const withoutEmptyMessage = prev.filter((msg, idx) => 
              !(idx === prev.length - 1 && msg.role === "assistant" && msg.content === "")
            );
            return [...withoutEmptyMessage, { role: "assistant", content: fullResponse }];
          });
          
          // Reset state
          setFullResponse("");
          setTypingText("");
        }
      }, 10); // Faster typing speed (10ms instead of 15ms)
    }
    
    return () => clearInterval(typingTimer);
  }, [isTyping, fullResponse]);

  // Function to extract JSON from a message
  const extractJson = (message: string) => {
    // Try with proper XML-style closing tag
    const jsonRegex = /<JSON_START>([\s\S]*?)<\/JSON_START>/;
    const match = message.match(jsonRegex);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse JSON with </JSON_START> tag:", e);
      }
    }

    // Try with alternate closing tag <JSON_END>
    const altJsonRegex = /<JSON_START>([\s\S]*?)<JSON_END>/;
    const altMatch = message.match(altJsonRegex);
    if (altMatch && altMatch[1]) {
      try {
        return JSON.parse(altMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON with <JSON_END> tag:", e);
      }
    }

    // Fallback to the code block format
    const oldJsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const oldMatch = message.match(oldJsonRegex);
    if (oldMatch && oldMatch[1]) {
      try {
        return JSON.parse(oldMatch[1]);
      } catch (e) {
        console.error("Failed to parse JSON from code block:", e);
      }
    }

    // Add support for finding JSON without markers (emergency fallback)
    try {
      const jsonPattern =
        /(\{[\s\S]*"budget"[\s\S]*"useCases"[\s\S]*"technicalPreferences"[\s\S]*\})/;
      const rawMatch = message.match(jsonPattern);
      if (rawMatch && rawMatch[1]) {
        return JSON.parse(rawMatch[1]);
      }
    } catch (e) {
      console.error("Failed to parse raw JSON pattern:", e);
    }

    return null;
  };

  // Process the response to remove the JSON if present
  const processResponseAndExtractJson = (fullResponse: string) => {
    const jsonData = extractJson(fullResponse);
    let cleanedResponse = fullResponse;

    if (jsonData) {
      // Remove all possible JSON formats from the displayed message
      cleanedResponse = fullResponse
        .replace(/<JSON_START>[\s\S]*?<\/JSON_START>/, "")
        .replace(/<JSON_START>[\s\S]*?<JSON_END>/, "")
        .replace(/```json[\s\S]*?```/, "")
        .trim();

      // If the response indicates a build is coming, modify it to show a nicer message
      if (cleanedResponse.includes("Let me build a custom PC for you")) {
        cleanedResponse =
          "I think I have a good understanding of your requirements now. Let me build a custom PC for you.";
      }
    }

    return { jsonData, cleanedResponse };
  };

  // Function to send preferences to recommendation system
  const sendToRecommendationSystem = async (
    preferences: UserPreferencesJson
  ) => {
    try {
      // Show loading screen
      setScreen("loading");

      // Log the preferences being sent to help debug
      console.log("Sending preferences to recommendation API:", JSON.stringify(preferences, null, 2));

      // Send to fixed recommendation system
      const response = await axios.post("/api/recommendation", { preferences });
      
      // Log the response to help debug
      console.log("Received recommendation response:", JSON.stringify(response.data, null, 2));

      // Check for errors in the response
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Update state with recommendation result
      setPcBuild(response.data);

      // Show results screen
      setScreen("results");
    } catch (error) {
      console.error("Error sending to recommendation system:", error);
      // Return to chat with error message
      setScreen("chat");
      
      // Add error message to the chat
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `Sorry, I encountered an error while processing your PC build recommendation: ${errorMessage}. Please try again with different requirements.`,
        },
      ]);
    }
  };

  // Function to restart the process
  const handleRestart = () => {
    // Reset states
    setScreen("chat");
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

      // Call GitHub Models API instead of Ollama
      const response = await axios.post('/api/chat', {
        messages: chatMessages.filter(msg => msg.role !== 'system'),
      });

      // Get the full response text from the API response
      const fullResponseData = response.data.response;

      // Process the response to remove the JSON if present
      const { jsonData, cleanedResponse } =
        processResponseAndExtractJson(fullResponseData);

      // Set up typing animation
      setFullResponse(cleanedResponse);
      setIsTyping(true);
      
      // Add an empty message placeholder while typing is in progress
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Process JSON if found and initiate build
      if (
        jsonData &&
        jsonData.budget &&
        jsonData.useCases &&
        jsonData.technicalPreferences
      ) {
        console.log("Found valid JSON configuration:", jsonData);
        
        // Wait for typing animation to complete before processing
        setTimeout(() => {
          sendToRecommendationSystem(jsonData);
        }, cleanedResponse.length * 15 + 500); // Approximate time to finish typing
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

  // Render different screens based on the current state
  if (screen === "loading") {
    return <LoadingScreen />;
  }

  if (screen === "results" && pcBuild) {
    return <BuildResultDisplay pcBuild={pcBuild} onRestart={handleRestart} />;
  }

  // Chat UI
  return (
    <div className="flex flex-col h-[80vh] bg-gray-900">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bot size={16} className="text-blue-500" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-gray-800 border border-gray-700 rounded-tl-none"
              }`}
            >
              {isTyping && index === messages.length - 1 && message.role === "assistant" ? (
                <p className="whitespace-pre-wrap text-sm text-gray-200">{typingText}</p>
              ) : message.role === "user" ? (
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && !isTyping && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Bot size={16} className="text-blue-500" />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg rounded-tl-none px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        {displayMessages.length === 0 && (
          <div className="text-center text-gray-400 p-2">
            {/* Remove the welcome message to save space */}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
            disabled={isLoading || isTyping}
          />
          <button
            type="submit"
            disabled={isLoading || isTyping || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecommendationBuilder;
