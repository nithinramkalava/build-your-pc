import { NextResponse } from 'next/server';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// Define the Message interface
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// The system prompt from RecommendationBuilder
const SYSTEM_PROMPT = `You are an expert PC building recommendation assistant with deep knowledge of computer hardware, software requirements, and usage patterns. Your goal is to have a natural conversation with users to understand their PC needs, while inferring technical requirements from their responses. Follow these guidelines:
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

// GitHub Models configuration
const githubToken = process.env.GITHUB_TOKEN;
const modelName = "Meta-Llama-3.1-8B-Instruct"; // You can use other models like "google/gemma-7b-it"
const endpoint = "https://models.inference.ai.azure.com";

export async function POST(request: Request) {
  // Check if the token is configured
  if (!githubToken) {
    console.error('Error: GITHUB_TOKEN environment variable is not set.');
    return NextResponse.json(
      { error: 'API authentication token is missing.' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    // Get messages from the frontend request body
    const userMessages: Message[] = body.messages;

    if (!userMessages || !Array.isArray(userMessages)) {
      return NextResponse.json(
        { error: 'Messages are required in the request body' },
        { status: 400 }
      );
    }

    // Format messages for the GitHub Models API
    const apiMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages
    ];

    // Initialize the Azure AI Inference Client
    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(githubToken)
    );

    console.log(`Sending request to GitHub Models API with model: ${modelName}`);

    // Make the API call to GitHub Models
    const response = await client.path("/chat/completions").post({
      body: {
        messages: apiMessages,
        model: modelName,
        temperature: 0.7,
        max_tokens: 1024, // Larger limit for the recommendation responses
        top_p: 0.9,
      },
    });

    // Check for unexpected responses (errors)
    if (isUnexpected(response)) {
      const errorDetails = response.body?.error;
      console.error(
        "GitHub Models API Error:",
        errorDetails || `Status: ${response.status}`
      );
      throw new Error(response.body?.error?.message || `GitHub Models API error: ${response.status}`);
    }

    // Extract the response content
    const responseContent = response.body.choices?.[0]?.message?.content;

    if (!responseContent) {
      console.error("No content found in GitHub Models API response:", response.body);
      throw new Error("Received an empty or invalid response from the API.");
    }

    console.log("Received response from GitHub Models API.");

    // Return the successful response to the frontend
    return NextResponse.json({
      response: responseContent.trim(),
    });

  } catch (error: unknown) {
    console.error('Error processing chat request:', error);

    // Provide a more informative error message to the frontend
    let errorMessage = 'Failed to process request.';
    
    if (error instanceof Error) {
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ENOTFOUND')) {
        errorMessage = "Could not connect to the GitHub Models service. Check network connectivity.";
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage = "Authentication failed. Check if your GitHub Token is valid and correctly configured.";
      } else if (error.message?.includes('404') || error.message?.includes('Model not found')) {
        errorMessage = `The model '${modelName}' might not be available or the endpoint is incorrect.`;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        response: `Sorry, I encountered an issue connecting to the AI model service. Details: ${errorMessage}`
      },
      { status: 500 }
    );
  }
} 