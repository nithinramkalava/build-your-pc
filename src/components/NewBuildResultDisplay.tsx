import React from "react";
import { CheckCircle, RefreshCw, DollarSign, Zap, Monitor, Cpu, HardDrive, MemoryStick, Home, ShoppingCart, Download, ExternalLink } from "lucide-react";

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

const NewBuildResultDisplay: React.FC<BuildResultDisplayProps> = ({
  pcBuild,
  onRestart,
}) => {
  // Component icons mapping
  const componentIcons: { [key: string]: React.ReactNode } = {
    cpu: <Cpu className="w-6 h-6" />,
    gpu: <Monitor className="w-6 h-6" />,
    "video-card": <Monitor className="w-6 h-6" />,
    memory: <MemoryStick className="w-6 h-6" />,
    motherboard: <Cpu className="w-6 h-6" />,
    "power-supply": <Zap className="w-6 h-6" />,
    "internal-hard-drive": <HardDrive className="w-6 h-6" />,
    case: <Monitor className="w-6 h-6" />,
    default: <Monitor className="w-6 h-6" />
  };

  // Format price for display
  const formatPrice = (price: string): string => {
    if (!price) return "N/A";
    return price;
  };

  // Get component display name
  const getComponentDisplayName = (componentType: string): string => {
    const names: { [key: string]: string } = {
      "cpu": "Processor",
      "gpu": "Graphics Card",
      "video-card": "Graphics Card",
      "memory": "RAM",
      "motherboard": "Motherboard",
      "power-supply": "Power Supply",
      "internal-hard-drive": "Storage",
      "case": "Case",
      "cpu-cooler": "CPU Cooler"
    };
    return names[componentType] || componentType.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get key specifications for each component
  const getKeySpecs = (componentType: string, details: ComponentDetails): string[] => {
    const specs: string[] = [];
    
    switch (componentType) {
      case "cpu":
        if (details.cores) specs.push(`${details.cores} Cores`);
        if (details.base_clock) specs.push(`${details.base_clock} Base Clock`);
        if (details.boost_clock) specs.push(`${details.boost_clock} Boost Clock`);
        break;
      case "gpu":
      case "video-card":
        if (details.memory) specs.push(`${details.memory} VRAM`);
        if (details.core_clock) specs.push(`${details.core_clock} Core Clock`);
        if (details.boost_clock) specs.push(`${details.boost_clock} Boost Clock`);
        break;
      case "memory":
        if (details.speed) specs.push(`${details.speed} Speed`);
        if (details.modules) specs.push(`${details.modules} Configuration`);
        if (details.color) specs.push(`${details.color} Color`);
        break;
      case "motherboard":
        if (details.socket) specs.push(`${details.socket} Socket`);
        if (details.form_factor) specs.push(`${details.form_factor} Form Factor`);
        if (details.memory_max) specs.push(`${details.memory_max} Max RAM`);
        break;
      case "power-supply":
        if (details.wattage) specs.push(`${details.wattage}W`);
        if (details.efficiency) specs.push(`${details.efficiency} Efficiency`);
        if (details.modular) specs.push(details.modular);
        break;
      case "internal-hard-drive":
        if (details.capacity) specs.push(`${details.capacity} Capacity`);
        if (details.type) specs.push(`${details.type} Type`);
        if (details.interface) specs.push(`${details.interface} Interface`);
        break;
      case "case":
        if (details.type) specs.push(`${details.type} Type`);
        if (details.color) specs.push(`${details.color} Color`);
        if (details.side_panel) specs.push(`${details.side_panel} Side Panel`);
        break;
      default:
        // Generic fallback - pick first few non-empty properties
        Object.entries(details).slice(0, 3).forEach(([key, value]) => {
          if (value && typeof value === "string" && value.length < 50) {
            specs.push(`${key.replace(/_/g, " ")}: ${value}`);
          }
        });
    }
    
    return specs.slice(0, 3); // Limit to 3 specs
  };

  // Get PCPartPicker URL from component details
  const getPCPartPickerUrl = (details: ComponentDetails): string | null => {
    const urlKeys = ["pcpartpicker_url", "url", "uri"];
    for (const key of urlKeys) {
      if (details[key] && typeof details[key] === "string") {
        return details[key];
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
        pcpartpicker_url: getPCPartPickerUrl(component.details),
        specifications: getKeySpecs(type, component.details)
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

  const isOverBudget = pcBuild.remaining_budget_inr && parseFloat(pcBuild.remaining_budget_inr.replace(/[^0-9.-]/g, "")) < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Your Perfect
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              PC Build
            </span>
          </h1>
          <p className="text-gray-600 text-lg">
            Custom-selected components optimized for your needs and budget
          </p>
        </div>

        {/* Budget Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(pcBuild.total_cost_inr)}
              </div>
              <div className="text-gray-500">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(pcBuild.budget_inr)}
              </div>
              <div className="text-gray-500">Budget</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {pcBuild.remaining_budget_inr ? formatPrice(pcBuild.remaining_budget_inr) : 'N/A'}
              </div>
              <div className="text-gray-500">Remaining</div>
            </div>
          </div>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pcBuild.selection_order.map((componentType, index) => {
            const component = pcBuild.components[componentType];
            if (!component) return null;

            const keySpecs = getKeySpecs(componentType, component.details);
            const icon = componentIcons[componentType] || componentIcons.default;
            const pcPartPickerUrl = getPCPartPickerUrl(component.details);

            return (
              <div key={componentType} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getComponentDisplayName(componentType)}
                      </h3>
                      <span className="text-blue-600 font-semibold">
                        {formatPrice(component.price_inr)}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium mb-3 line-clamp-2">
                      {component.name}
                    </p>
                    {pcPartPickerUrl && (
                      <div className="mb-3">
                        <a
                          href={pcPartPickerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View on PCPartPicker
                        </a>
                      </div>
                    )}
                    <div className="space-y-1">
                      {keySpecs.map((spec, specIndex) => (
                        <div key={specIndex} className="text-sm text-gray-500">
                          {spec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Messages */}
        {pcBuild.selection_errors && Object.keys(pcBuild.selection_errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-red-700 font-semibold mb-3">Component Selection Notes:</h3>
            <div className="space-y-2">
              {Object.entries(pcBuild.selection_errors).map(([componentType, error]) => (
                <div key={componentType} className="text-red-600 text-sm">
                  <span className="font-medium">{getComponentDisplayName(componentType)}: </span>
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={downloadBuildJson}
            className="flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Build Details
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Build Another PC
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="flex items-center justify-center px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-600 text-sm bg-gray-100 rounded-lg p-4">
          <p>
            💡 Tip: Save this build configuration or share it with friends. All components have been 
            verified for compatibility and optimized for your specific use case.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewBuildResultDisplay;
