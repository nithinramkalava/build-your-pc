"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Monitor, 
  Zap, 
  HardDrive, 
  MemoryStick, 
  Fan, 
  Box, 
  Power,
  Check,
  Search,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Info,
  DollarSign,
  Star,
  Filter,
  X,
  CircuitBoard,
  ExternalLink,
  Download
} from "lucide-react";

type Part = {
  id: number;
  name: string;
  price: number | string | null;
  capacity?: number;
};

export type PartType =
  | "cpu"
  | "motherboard"
  | "cpuCooler"
  | "gpu"
  | "case"
  | "psu"
  | "ram"
  | "storage";

type SelectedParts = { [K in PartType]?: Part };

const partOrder: PartType[] = [
  "cpu",
  "motherboard",
  "cpuCooler",
  "gpu",
  "case",
  "psu",
  "ram",
  "storage",
];

const partDetails = {
  cpu: {
    name: "Processor",
    icon: <Cpu className="w-6 h-6" />,
    description: "The brain of your computer",
    color: "from-red-500 to-orange-500"
  },
  motherboard: {
    name: "Motherboard",
    icon: <CircuitBoard className="w-6 h-6" />,
    description: "Connects all components together",
    color: "from-green-500 to-emerald-500"
  },
  cpuCooler: {
    name: "CPU Cooler",
    icon: <Fan className="w-6 h-6" />,
    description: "Keeps your processor cool",
    color: "from-cyan-500 to-blue-500"
  },
  gpu: {
    name: "Graphics Card",
    icon: <Monitor className="w-6 h-6" />,
    description: "Handles graphics and gaming",
    color: "from-purple-500 to-pink-500"
  },
  case: {
    name: "Case",
    icon: <Box className="w-6 h-6" />,
    description: "Houses all your components",
    color: "from-gray-500 to-slate-500"
  },
  psu: {
    name: "Power Supply",
    icon: <Power className="w-6 h-6" />,
    description: "Powers your entire system",
    color: "from-yellow-500 to-amber-500"
  },
  ram: {
    name: "Memory (RAM)",
    icon: <MemoryStick className="w-6 h-6" />,
    description: "Temporary storage for active tasks",
    color: "from-indigo-500 to-violet-500"
  },
  storage: {
    name: "Storage",
    icon: <HardDrive className="w-6 h-6" />,
    description: "Permanent storage for your files",
    color: "from-teal-500 to-green-500"
  }
};

const NewSkilledBuilder = () => {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [selectedParts, setSelectedParts] = useState<SelectedParts>({});
  const [partsData, setPartsData] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStageClick = (stageIndex: number) => {
    if (stageIndex < currentPartIndex) {
      const newSelectedParts = { ...selectedParts };
      for (let i = stageIndex; i < partOrder.length; i++) {
        delete newSelectedParts[partOrder[i]];
      }
      setSelectedParts(newSelectedParts);
      setCurrentPartIndex(stageIndex);
    }
  };

  const currentPart = partOrder[currentPartIndex];
  const isComplete = currentPartIndex >= partOrder.length;

  const handlePartSelect = (part: Part) => {
    console.log(`[Client] Selected ${currentPart}:`, {
      id: part.id,
      name: part.name,
      price: part.price,
      priceType: typeof part.price,
    });
    setSelectedParts((prev) => ({
      ...prev,
      [currentPart]: part,
    }));
    setCurrentPartIndex((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    if (currentPartIndex > 0) {
      setCurrentPartIndex(currentPartIndex - 1);
    }
  };

  useEffect(() => {
    const fetchParts = async () => {
      if (isComplete) return;

      setLoadingParts(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();

        switch (currentPart) {
          case "motherboard":
            if (selectedParts.cpu?.id)
              queryParams.set("cpu_id", selectedParts.cpu.id.toString());
            break;
          case "cpuCooler":
            if (selectedParts.cpu?.id)
              queryParams.set("cpu_id", selectedParts.cpu.id.toString());
            break;
          case "gpu":
            if (selectedParts.motherboard?.id)
              queryParams.set(
                "mobo_id",
                selectedParts.motherboard.id.toString()
              );
            break;
          case "case":
            if (selectedParts.gpu?.id && selectedParts.motherboard?.id) {
              queryParams.set("gpu_id", selectedParts.gpu.id.toString());
              queryParams.set(
                "mobo_id",
                selectedParts.motherboard.id.toString()
              );
            }
            break;
          case "psu":
            if (
              selectedParts.case?.id &&
              selectedParts.cpu?.id &&
              selectedParts.gpu?.id
            ) {
              queryParams.set("case_id", selectedParts.case.id.toString());
              queryParams.set("cpu_id", selectedParts.cpu.id.toString());
              queryParams.set("gpu_id", selectedParts.gpu.id.toString());
            }
            break;
          case "ram":
            if (selectedParts.motherboard?.id && selectedParts.cpu?.id) {
              queryParams.set(
                "mobo_id",
                selectedParts.motherboard.id.toString()
              );
              queryParams.set("cpu_id", selectedParts.cpu.id.toString());
            }
            break;
          case "storage":
            if (selectedParts.motherboard?.id) {
              queryParams.set(
                "mobo_id",
                selectedParts.motherboard.id.toString()
              );
            }
            break;
        }

        const url = `/api/parts/${currentPart}?${queryParams.toString()}`;
        console.log(`[Client] Fetching parts for ${currentPart} from: ${url}`);

        const res = await fetch(url);
        const textResponse = await res.text();

        if (!res.ok) {
          console.error(`[Client] API Error response: ${textResponse}`);
          throw new Error(
            `Failed to fetch parts: ${res.status} ${res.statusText}`
          );
        }

        let data: Part[];
        try {
          data = JSON.parse(textResponse) as Part[];

          if (currentPart === "storage" && data.length > 0) {
            console.log("Storage data sample:", {
              firstItem: data[0],
              hasCapacityField: "capacity" in data[0],
              capacityType: typeof data[0].capacity,
              capacityValue: data[0].capacity,
            });
          }
        } catch (parseError) {
          console.error("[Client] Failed to parse JSON response:", parseError);
          console.error("[Client] Raw response:", textResponse);
          throw new Error("Invalid response from server");
        }

        // For storage components, append capacity to name for better display
        if (currentPart === "storage") {
          data = data.map((part) => {
            if (part.capacity !== undefined) {
              const capacityNum =
                typeof part.capacity === "string"
                  ? parseFloat(part.capacity)
                  : part.capacity;

              part.capacity = capacityNum;

              const capacityText =
                capacityNum >= 1000
                  ? `${(capacityNum / 1000).toFixed(1)}TB`
                  : `${capacityNum}GB`;

              if (!part.name.includes("GB") && !part.name.includes("TB")) {
                return {
                  ...part,
                  name: `${part.name} (${capacityText})`,
                };
              }
            }
            return part;
          });
        }

        console.log(
          `[Client] Received ${currentPart} data (${data.length} items):`,
          data.slice(0, 3).map((part) => ({
            id: part.id,
            name: part.name,
            price: part.price,
            priceType: typeof part.price,
          }))
        );

        setPartsData(data);
      } catch (err: unknown) {
        console.error("[Client] Error fetching parts:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoadingParts(false);
      }
    };

    fetchParts();
    setSearchTerm("");
  }, [currentPart, isComplete, selectedParts]);

  const filteredParts = partsData.filter(
    (part) =>
      part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  const calculateTotal = () => {
    const parts = Object.values(selectedParts);
    console.log(
      "[Client] All selected parts for total calculation:",
      parts.map((part) => ({
        name: part?.name,
        price: part?.price,
        priceType: typeof part?.price,
      }))
    );
    let hasMissingPrice = false;
    const total = parts.reduce((sum, part) => {
      if (part) {
        let price: number = 0;
        if (typeof part.price === "number") {
          price = part.price;
        } else if (typeof part.price === "string") {
          const priceMatch = part.price.match(/(\d+(\.\d+)?)/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0]);
          } else {
            hasMissingPrice = true;
          }
        } else {
          hasMissingPrice = true;
        }

        console.log(
          `[Client] Processing part: ${part.name}, raw price: ${
            part.price
          }, converted price: ${price}, type: ${typeof price}`
        );
        return sum + price;
      }
      return sum;
    }, 0);

    console.log(
      `[Client] Calculated total before conversion: ${total}, hasMissingPrice: ${hasMissingPrice}`
    );
    const formattedTotal = (total * 83).toLocaleString("en-IN");
    return {
      totalText: hasMissingPrice ? `${formattedTotal} + extra` : formattedTotal,
      hasMissingPrice,
    };
  };

  const { totalText, hasMissingPrice } = calculateTotal();

  const formatPrice = (price: number | string | null | undefined) => {
    if (price === null || price === undefined) return "Price unavailable";

    let numericPrice: number = 0;
    if (typeof price === "number") {
      numericPrice = price;
    } else if (typeof price === "string") {
      const priceMatch = price.match(/(\d+(\.\d+)?)/);
      if (priceMatch) {
        numericPrice = parseFloat(priceMatch[0]);
      } else {
        return "Price unavailable";
      }
    } else {
      return "Price unavailable";
    }

    return `₹${(numericPrice * 83).toLocaleString("en-IN")}`;
  };

  const formatCapacity = (capacityGB: number | undefined) => {
    if (!capacityGB) return "";

    if (capacityGB >= 1000) {
      return `${(capacityGB / 1000).toFixed(1)} TB`;
    } else {
      return `${capacityGB} GB`;
    }
  };

  // Extract PCPartPicker URL from part data
  const getPCPartPickerUrl = (part: Part): string | null => {
    if (!part || typeof part !== 'object') return null;
    
    // Check various possible URL field names
    const urlFields = ['pcpartpicker_url', 'url', 'link', 'pcpartpicker_link'];
    
    for (const field of urlFields) {
      if ((part as any)[field] && typeof (part as any)[field] === 'string') {
        return (part as any)[field];
      }
    }
    
    return null;
  };

  // Download build as JSON
  const downloadBuildJson = () => {
    const buildData = {
      build_info: {
        total_components: Object.keys(selectedParts).length,
        total_cost: totalText,
        has_missing_prices: hasMissingPrice,
        generated_date: new Date().toISOString(),
        build_type: "Expert Builder"
      },
      components: Object.entries(selectedParts).map(([type, part]) => ({
        type: type,
        name: part?.name || "Unknown",
        price: part?.price || "Not available",
        capacity: part?.capacity,
        pcpartpicker_url: getPCPartPickerUrl(part!)
      }))
    };

    const jsonString = JSON.stringify(buildData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skilled-pc-build-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getProgressPercentage = () => {
    return (currentPartIndex / partOrder.length) * 100;
  };

  // Welcome Screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center space-y-6 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full">
              <Monitor className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
              Expert PC
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Builder
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Take full control of your PC build. Select each component step by step with advanced filtering and compatibility checking.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {partOrder.map((partType, index) => {
              const part = partDetails[partType];
              return (
                <div key={partType} className="bg-white/80 rounded-lg p-3 border border-gray-200 text-center shadow-sm">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${part.color} flex items-center justify-center mx-auto mb-2`}>
                    {part.icon}
                  </div>
                  <h3 className="text-gray-900 font-semibold text-sm mb-1">{part.name}</h3>
                  <p className="text-gray-500 text-xs">{part.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setHasStarted(true);
                setCurrentPartIndex(0);
              }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Monitor className="w-5 h-5 mr-2" />
              Start Building
            </button>
            <p className="text-gray-500 text-sm mt-4">
              Step-by-step component selection with compatibility verification
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Component Selection Screen
  if (!isComplete) {
    const currentPartDetail = partDetails[currentPart];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${currentPartDetail.color} flex items-center justify-center`}>
                  {currentPartDetail.icon}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Select {currentPartDetail.name}
                  </h1>
                  <p className="text-gray-600">{currentPartDetail.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-900 font-semibold">
                  Step {currentPartIndex + 1} of {partOrder.length}
                </div>
                <div className="text-gray-500 text-sm">
                  {((currentPartIndex + 1) / partOrder.length * 100).toFixed(0)}% Complete
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePreviousStep}
                disabled={currentPartIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-2">
                {partOrder.map((partType, index) => {
                  const isCompleted = index < currentPartIndex;
                  const isCurrent = index === currentPartIndex;
                  const part = partDetails[partType];
                  
                  return (
                    <button
                      key={partType}
                      onClick={() => handleStageClick(index)}
                      disabled={index > currentPartIndex}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        isCurrent
                          ? `bg-gradient-to-br ${part.color} text-white`
                          : isCompleted
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-500'
                      } ${index <= currentPartIndex ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      {part.icon}
                    </button>
                  );
                })}
              </div>

              <div className="w-24"></div> {/* Spacer */}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${currentPartDetail.name}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 focus:border-purple-500 focus:outline-none placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Component Grid */}
          <div className="space-y-6">
            {loadingParts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-gray-700">Loading components...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-lg mb-2">Error loading components</div>
                <div className="text-gray-600">{error}</div>
              </div>
            ) : filteredParts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-600 text-lg">No components found</div>
                <div className="text-gray-500">Try adjusting your search terms</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredParts.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => handlePartSelect(part)}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:border-purple-500 transition-all duration-200 cursor-pointer group hover:scale-105 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentPartDetail.color} flex items-center justify-center`}>
                        {currentPartDetail.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 font-semibold">
                          {formatPrice(part.price)}
                        </div>
                        {currentPart === "storage" && part.capacity && (
                          <div className="text-gray-500 text-sm">
                            {formatCapacity(part.capacity)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-gray-900 font-semibold mb-2 group-hover:text-purple-600 transition-colors">
                      {part.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600 text-sm">Compatible</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Completion Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Build Complete!
          </h1>
          <p className="text-gray-600 text-lg">
            Your custom PC build is ready. All components are verified for compatibility.
          </p>
        </div>

        {/* Build Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Components</h2>
              {Object.entries(selectedParts).map(([type, part]) => {
                const partDetail = partDetails[type as PartType];
                const pcPartPickerUrl = getPCPartPickerUrl(part!);
                return (
                  <div key={type} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${partDetail.color} flex items-center justify-center`}>
                        {partDetail.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-500 text-sm">{partDetail.name}</div>
                        <div className="text-gray-900 font-medium">{part?.name}</div>
                        {type === "storage" && part?.capacity && (
                          <div className="text-gray-500 text-sm">
                            {formatCapacity(part.capacity)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-gray-900 font-semibold">
                          {formatPrice(part?.price)}
                        </div>
                      </div>
                    </div>
                    {pcPartPickerUrl && (
                      <div className="pl-14">
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
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Build Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Components</span>
                  <span className="text-gray-900 font-semibold">{Object.keys(selectedParts).length}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                  <span className="text-gray-700 font-medium">Total Cost</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ₹{totalText}
                    </div>
                    {hasMissingPrice && (
                      <div className="text-sm text-gray-600">
                        + components with missing prices
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={downloadBuildJson}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Build Details</span>
                </button>
                
                <button
                  onClick={() => {
                    setHasStarted(false);
                    setCurrentPartIndex(0);
                    setSelectedParts({});
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  <Monitor className="w-5 h-5" />
                  <span>Build Another PC</span>
                </button>
                
                <button
                  onClick={() => window.location.href = "/"}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm bg-gray-100 rounded-lg p-4">
          <p>
            🎉 Congratulations! Your PC build is complete and all components are compatible. 
            Consider saving this configuration for future reference.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewSkilledBuilder;
