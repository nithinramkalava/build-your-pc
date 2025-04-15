import RecommendationBuilder from "@/components/RecommendationBuilder";

export default function RecommendPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-white text-center">PC Build Recommendation</h1>
      <p className="text-gray-300 text-center mb-8">
        Chat with our AI assistant to get a personalized PC build recommendation
        based on your needs and budget.
      </p>
      <RecommendationBuilder />
    </div>
  );
}
