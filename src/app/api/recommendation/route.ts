import { NextResponse } from "next/server";
import { PCRecommendationSystem } from '@/lib/recommendationEngine';
import { UserPreferencesJson } from "@/lib/types";

export async function POST(request: Request) {
  let recSystem = null;
  
  try {
    const { preferences } = (await request.json()) as { preferences: UserPreferencesJson };

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required in the request body" },
        { status: 400 }
      );
    }
    
    // Validate basic structure of preferences
    if (!preferences.budget || !preferences.useCases || !preferences.technicalPreferences) {
      return NextResponse.json(
        { error: "Invalid preferences structure. Must include budget, useCases, and technicalPreferences." },
        { status: 400 }
      );
    }

    // Log the received preferences
    console.log("Received preference request:", JSON.stringify(preferences, null, 2));

    // Instantiate the TypeScript recommendation system
    // The flags for ML ranking and dynamic budget can be controlled here if needed
    recSystem = new PCRecommendationSystem(preferences);

    // Generate recommendation using the TypeScript engine
    console.log("Generating recommendation using TypeScript engine...");
    const recommendationResult = await recSystem.buildRecommendation();
    console.log("Recommendation generated.");

    // Check if the engine returned an error object
    if (recommendationResult && recommendationResult.error) {
      console.error("Recommendation Engine Error:", recommendationResult.error, recommendationResult.details);
      return NextResponse.json(
        {
          error: "Failed to generate recommendation",
          details: recommendationResult.error, // Provide the engine error message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(recommendationResult);

  } catch (error) {
    console.error("Recommendation API error:", error);
    // Ensure we attempt to close the pool even if instantiation or other parts fail
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  } finally {
    // Ensure we close the connection pool
    if (recSystem) {
      await recSystem.close();
    }
  }
}
