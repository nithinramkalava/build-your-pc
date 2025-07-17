import React from "react";
import { Download, ExternalLink } from "lucide-react";

// Define types for the build recommendation results
interface ComponentDetails {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Details structure varies greatly by component type
  [key: string]: any;
}

interface ComponentInfo {
  name: string;
  price: string;
  price_inr: string;
  details: ComponentDetails;
}

export interface BuildRecommendation {
  components: {
    [key: string]: ComponentInfo;
  };
  selection_order: string[];
  total_cost_usd: string;
  total_cost_inr: string;
  budget_inr: string;
  budget_usd: string;
  status: string;
  remaining_budget_inr?: string;
  selection_errors?: {
    [key: string]: string;
  };
  error?: string;
}

interface BuildResultDisplayProps {
  pcBuild: BuildRecommendation;
  onRestart: () => void;
}

const BuildResultDisplay: React.FC<BuildResultDisplayProps> = ({
  pcBuild,
  onRestart,
}) => {
  // Format price for display
  const formatPrice = (price: string): string => {
    if (!price) return "N/A";
    return price;
  };

  // Format and render a value based on its type
  const formatValue = (value: unknown): React.ReactNode => { // Changed any to unknown
    if (value === null || value === undefined) {
      return "N/A";
    } else if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.join(", ");
      } else {
        // For nested objects like retailer_prices, create a simple representation
        return (
          <div className="pl-2 border-l border-gray-300">
            {Object.entries(value).map(([nestedKey, nestedValue]) => (
              <div key={nestedKey} className="mt-1">
                <span className="text-gray-500">{nestedKey}: </span>
                {formatValue(nestedValue)}
              </div>
            ))}
          </div>
        );
      }
    } else if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    } else {
      return String(value);
    }
  };

  // Function to filter out complex objects we don't want to display directly
  const shouldDisplayDetail = (key: string, value: unknown): boolean => { // Changed any to unknown
    // Skip extremely large objects or specific keys we don't want to show
    const keysToSkip = [
      "retailer_prices",
      "rank",
      "ml_score",
      "pcpartpicker_url",
      "url",
      "uri"
    ];

    if (keysToSkip.includes(key.toLowerCase())) {
      return false;
    }

    // If it's an object with too many items, skip it
    if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length > 10) {
      return false;
    }

    return true;
  };

  // Format key for display
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ")
      .replace(/Tdp/i, "TDP")
      .replace(/Ssd/i, "SSD")
      .replace(/Hdd/i, "HDD")
      .replace(/Usb/i, "USB")
      .replace(/Pcie/i, "PCIe")
      .replace(/Wifi/i, "WiFi")
      .replace(/Bluetooth/i, "Bluetooth")
      .replace(/Rgb/i, "RGB");
  };

  // Function to get URL from component details
  const getComponentUrl = (details: ComponentDetails): string | null => {
    const urlKeys = ["pcpartpicker_url", "url", "uri"];
    for (const key of urlKeys) {
      for (const detailKey of Object.keys(details)) {
        // Check if detailKey exists and is truthy before trying to access it
        if (details[detailKey] && detailKey.toLowerCase() === key ) {
          return details[detailKey] as string; // Cast to string assuming URL is string
        }
      }
    }
    return null;
  };

  // Download build as JSON
  const downloadBuildJson = () => {
    const buildData = {
      build_info: {
        total_cost_inr: pcBuild.total_cost_inr,
        total_cost_usd: pcBuild.total_cost_usd,
        budget_inr: pcBuild.budget_inr,
        budget_usd: pcBuild.budget_usd,
        status: pcBuild.status,
        remaining_budget_inr: pcBuild.remaining_budget_inr,
        generated_date: new Date().toISOString()
      },
      components: Object.entries(pcBuild.components).map(([type, component]) => ({
        type: type,
        name: component.name,
        price_inr: component.price_inr,
        price_usd: component.price,
        pcpartpicker_url: getComponentUrl(component.details),
        details: component.details
      }))
    };

    const jsonString = JSON.stringify(buildData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pc-build-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white p-6 rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold mb-2 text-gray-900">
              Your Custom PC Build
            </h2>
            <p className="text-gray-600 mb-6">
              Based on your requirements, here&apos;s the optimized build
              recommendation
            </p>

            <div className="flex flex-col md:flex-row justify-between gap-4 bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
              <div className="text-center">
                <span className="text-gray-500 block text-sm mb-1">
                  Budget:
                </span>
                <div className="text-xl font-semibold text-gray-900">
                  {pcBuild.budget_inr}
                </div>
              </div>
              <div className="text-center">
                <span className="text-gray-500 block text-sm mb-1">
                  Total Cost:
                </span>
                <div className="text-xl font-semibold text-gray-900">
                  {pcBuild.total_cost_inr}
                </div>
              </div>
              <div className="text-center">
                <span className="text-gray-500 block text-sm mb-1">
                  Status:
                </span>
                <div
                  className={`text-xl font-semibold ${
                    pcBuild.status.includes("Over budget")
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {pcBuild.status}
                </div>
              </div>
            </div>

            {pcBuild.remaining_budget_inr && (
              <div className="text-emerald-600 mb-4">
                Remaining Budget: {pcBuild.remaining_budget_inr}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {pcBuild.selection_order.map((type) => {
              const component = pcBuild.components[type];
              if (!component) return null;

              // Get the URL for this component
              const componentUrl = getComponentUrl(component.details);

              return (
                <div
                  key={type}
                  className="bg-gray-50 p-4 rounded-lg transition-all hover:bg-gray-100 border border-gray-200"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="md:w-1/4 mb-2 md:mb-0">
                      <h3 className="font-semibold text-gray-600 capitalize">
                        {type}
                      </h3>
                    </div>
                    <div className="md:w-3/4">
                      <div className="font-semibold text-gray-900 text-lg mb-1">
                        {component.name}
                      </div>
                      <div className="text-blue-600 mb-3">
                        {formatPrice(component.price_inr)}
                      </div>

                      {/* PC Part Picker link if available */}
                      {componentUrl && (
                        <div className="mb-3">
                          <a
                            href={componentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View on PCPartPicker
                          </a>
                        </div>
                      )}

                      {component.details &&
                        Object.keys(component.details).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(component.details)
                              .filter(([key, value]) => shouldDisplayDetail(key, value))
                              .map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                  <div className="flex">
                                    <span className="text-gray-500 mr-1">
                                      {formatKey(key)}:
                                    </span>
                                    <span className="text-gray-700 break-words"> {/* Changed from text-gray-300 */}
                                      {formatValue(value)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Display Selection Errors */}
           {pcBuild.selection_errors && Object.keys(pcBuild.selection_errors).length > 0 && (
                <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Selection Issues</h3>
                    <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                        {Object.entries(pcBuild.selection_errors).map(([key, value]) => (
                            <li key={key}>
                                <span className="font-medium capitalize">{key}:</span> {value}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Display General Error */}
            {pcBuild.error && (
                <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">System Error</h3>
                    <p className="text-red-600 text-sm">{pcBuild.error}</p>
                </div>
            )}

          <div className="mt-8 text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadBuildJson}
                className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Build Details
              </button>
              <button
                onClick={onRestart}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold border border-blue-600"
              >
                Start a New Build
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildResultDisplay;