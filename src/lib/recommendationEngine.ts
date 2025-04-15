import { Pool, PoolClient } from 'pg';
import { UserPreferencesJson, Part, PartType, SelectedParts } from './types';

// Define component tables (matching Python)
const componentTables: Record<string, string> = {
    cpu: 'cpu_specs',
    motherboard: 'motherboard_specs',
    cooler: 'cooler_specs',
    memory: 'memory_specs',
    gpu: 'gpu_specs',
    storage: 'ssd_specs',
    case: 'case_specs',
    psu: 'psu_specs',
};

// Default budget allocation (matching Python)
const defaultBudgetAllocation: Record<string, number> = {
    cpu: 0.20,
    motherboard: 0.16,
    cooler: 0.05,
    memory: 0.12,
    gpu: 0.28,
    case: 0.07,
    psu: 0.06,
    storage: 0.06,
};

const componentOrder: PartType[] = [
    'cpu',
    'motherboard',
    'cooler',
    'memory',
    'gpu',
    'storage',
    'case',
    'psu',
];

const INR_TO_USD = 0.012; // Approximate conversion rate

interface ComponentSelectionOptions {
    componentType: PartType;
    budget: number;
    baseQuery: string;
    cheapestQuery: string;
    lastResortQuery: string;
    baseParams: any[];
    cheapestParams: any[];
    lastResortParams: any[];
    requiredComponents?: PartType[];
}

export class PCRecommendationSystem {
    private userPrefs: UserPreferencesJson;
    private useMlRanking: boolean;
    private useDynamicBudget: boolean;
    private pool: Pool;
    private selectedComponents: SelectedParts = {};
    private budgetAllocation: Record<string, number>;

    constructor(preferences: UserPreferencesJson, useMlRanking = true, useDynamicBudget = true) {
        this.userPrefs = preferences;
        this.useMlRanking = useMlRanking;
        this.useDynamicBudget = useDynamicBudget;
        this.budgetAllocation = { ...defaultBudgetAllocation }; // Start with defaults

        console.log(`Initializing RecommendationSystem with ml_ranking=${this.useMlRanking}, dynamic_budget=${this.useDynamicBudget}`);

        // Initialize DB Pool
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL environment variable is not set");
        }
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Required for Supabase
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });

        // Adjust budget if dynamic budget is enabled
        if (this.useDynamicBudget) {
            this._adjustBudgetAllocation();
        } else {
            console.log("Dynamic budget allocation is OFF. Using static defaults.");
        }
    }

    // --- Private Helper Methods (to be translated) ---

    private _adjustBudgetAllocation(): void {
        console.debug("Adjusting budget allocation dynamically.");
        // Reset to default before applying adjustments
        this.budgetAllocation = { ...defaultBudgetAllocation };
        const useCases = this.userPrefs.useCases;
        const perfPriorities = this.userPrefs.performancePriorities;

        // --- Adjustments Logic (Direct translation from Python) ---
        if (useCases?.gaming?.needed && (useCases.gaming.intensity ?? 0) > 5) {
            this.budgetAllocation['gpu'] = (this.budgetAllocation['gpu'] ?? 0) + 0.05;
            this.budgetAllocation['cpu'] = (this.budgetAllocation['cpu'] ?? 0) - 0.02;
            this.budgetAllocation['storage'] = (this.budgetAllocation['storage'] ?? 0) - 0.01;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.01;
            this.budgetAllocation['motherboard'] = (this.budgetAllocation['motherboard'] ?? 0) - 0.01;
        }

        if ((useCases?.videoEditing?.needed && (useCases.videoEditing.intensity ?? 0) > 5) ||
            (useCases?.rendering3D?.needed && (useCases.rendering3D.intensity ?? 0) > 5)) {
            this.budgetAllocation['cpu'] = (this.budgetAllocation['cpu'] ?? 0) + 0.05;
            this.budgetAllocation['memory'] = (this.budgetAllocation['memory'] ?? 0) + 0.03;
            this.budgetAllocation['gpu'] = (this.budgetAllocation['gpu'] ?? 0) - 0.03;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.02;
            this.budgetAllocation['psu'] = (this.budgetAllocation['psu'] ?? 0) - 0.01;
            this.budgetAllocation['motherboard'] = (this.budgetAllocation['motherboard'] ?? 0) - 0.02;
        }

        if (useCases?.programming?.needed && (useCases.programming.intensity ?? 0) > 5) {
            this.budgetAllocation['cpu'] = (this.budgetAllocation['cpu'] ?? 0) + 0.03;
            this.budgetAllocation['memory'] = (this.budgetAllocation['memory'] ?? 0) + 0.02;
            this.budgetAllocation['gpu'] = (this.budgetAllocation['gpu'] ?? 0) - 0.03;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.01;
            this.budgetAllocation['motherboard'] = (this.budgetAllocation['motherboard'] ?? 0) - 0.01;
        }

        if ((perfPriorities?.cpu ?? 0) > 7) {
            this.budgetAllocation['cpu'] = (this.budgetAllocation['cpu'] ?? 0) + 0.03;
            this.budgetAllocation['gpu'] = (this.budgetAllocation['gpu'] ?? 0) - 0.02;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.01;
        }

        if ((perfPriorities?.gpu ?? 0) > 7) {
            this.budgetAllocation['gpu'] = (this.budgetAllocation['gpu'] ?? 0) + 0.03;
            this.budgetAllocation['cpu'] = (this.budgetAllocation['cpu'] ?? 0) - 0.02;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.01;
        }

        if ((perfPriorities?.ram ?? 0) > 7) {
            this.budgetAllocation['memory'] = (this.budgetAllocation['memory'] ?? 0) + 0.02;
            this.budgetAllocation['gpu'] = (this.budgetAllocation['gpu'] ?? 0) - 0.01;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.01;
        }

        if ((perfPriorities?.storageSpeed ?? 0) > 7) {
            this.budgetAllocation['storage'] = (this.budgetAllocation['storage'] ?? 0) + 0.02;
            this.budgetAllocation['case'] = (this.budgetAllocation['case'] ?? 0) - 0.01;
            this.budgetAllocation['psu'] = (this.budgetAllocation['psu'] ?? 0) - 0.01;
        }
        // --- End Adjustments ---

        // --- Normalization (Direct translation from Python) ---
        let total = Object.values(this.budgetAllocation).reduce((sum, val) => sum + (val ?? 0), 0);

        if (total <= 0) {
            console.warn("Budget allocations summed to zero or less. Resetting to defaults.");
            this.budgetAllocation = { ...defaultBudgetAllocation };
            total = 1.0;
        }

        for (const key in this.budgetAllocation) {
            this.budgetAllocation[key] = (this.budgetAllocation[key] ?? 0) / total;
            if (this.budgetAllocation[key] < 0) {
                console.warn(`Negative allocation for ${key} after normalization. Setting to 0.`);
                this.budgetAllocation[key] = 0;
            }
        }

        const finalTotal = Object.values(this.budgetAllocation).reduce((sum, val) => sum + (val ?? 0), 0);
        if (finalTotal > 0 && Math.abs(finalTotal - 1.0) > 1e-6) {
            console.debug("Re-normalizing after clipping negative allocations.");
            for (const key in this.budgetAllocation) {
                this.budgetAllocation[key] = (this.budgetAllocation[key] ?? 0) / finalTotal;
            }
        }
        // --- End Normalization ---
        console.log("Final Budget Allocation:", this.budgetAllocation);
    }

    private _getComponentBudget(componentType: keyof typeof defaultBudgetAllocation): number {
        const totalBudgetINR = this.userPrefs.budget ?? 0;
        const allocation = this.budgetAllocation[componentType] ?? 0;
        const componentBudgetINR = totalBudgetINR * allocation;
        const componentBudgetUSD = componentBudgetINR * INR_TO_USD;
        return componentBudgetUSD;
    }

    private _getMarketSegment(): string {
        return this.userPrefs.technicalPreferences?.marketSegment ?? 'Consumer';
    }

    private _getOrderByClause(tableAlias: string): string {
        // Ensure column names like "rank" are quoted if they are keywords or contain special chars
        const rankColumn = '"rank"'; // Use double quotes for case sensitivity/keywords
        const mlScoreColumn = 'ml_score';
        const priceColumn = 'price_num';

        if (this.useMlRanking) {
            return `
                ORDER BY
                    COALESCE(${tableAlias}.${rankColumn}, 9999) ASC,
                    ${tableAlias}.${mlScoreColumn} DESC NULLS LAST, -- Higher score is better
                    ${tableAlias}.${priceColumn} ASC
            `;
        } else {
            console.debug(`ML Ranking OFF. Ordering by price only for ${tableAlias}.`);
            return `
                ORDER BY
                    ${tableAlias}.${priceColumn} ASC
            `;
        }
    }

    private async _executeQuery(client: PoolClient, query: string, params: any[] = []): Promise<any[]> {
        try {
            // console.debug(`Executing Query: ${query.replace(/\s+/g, ' ').trim()} | Params: ${JSON.stringify(params)}`);
            const result = await client.query(query, params);
            // console.debug(`Query returned ${result.rows.length} rows.`);
            return result.rows;
        } catch (error: any) {
            console.error(`Database Query Error: ${error.message}`);
            console.error(`Query: ${query}`);
            console.error(`Params: ${JSON.stringify(params)}`);
            // console.error(`Stack: ${error.stack}`);
            throw new Error(`Database query failed: ${error.message}`);
        }
    }

    // Placeholder for the complex fallback logic
    private async _execute_query_with_fallbacks(
        client: PoolClient,
        options: { /* Define options structure later */ }
    ): Promise<{ results: any[], description: any[] | null }> {
        // TODO: Translate the complex fallback logic from Python
        console.warn("_execute_query_with_fallbacks not fully implemented yet.");
        return { results: [], description: null };
    }

    // --- Public Method (to be translated) ---

    public async buildRecommendation(): Promise<any> {
        console.log("Starting PC build recommendation...");
        let client: PoolClient | null = null;
        const errors: { [key: string]: string } = {};

        try {
            client = await this.pool.connect();
            await client.query('BEGIN'); // Start transaction

            // --- Component Selection (Translate each select_* method) ---
            const selectionSteps: PartType[] = componentOrder; // Use the defined order

            for (const componentType of selectionSteps) {
                // Skip selection if a critical error already occurred for this component type in a previous step (unlikely with current structure, but good practice)
                if (errors[componentType]) continue; 

                let selectionResult: Part | null = null;
                try {
                    console.log(`\n--- Selecting ${componentType.toUpperCase()} ---`);
                    switch (componentType) {
                        case 'cpu':
                            selectionResult = await this.selectCPU(client);
                            break;
                        case 'motherboard':
                            selectionResult = await this.selectMotherboard(client);
                            break;
                        case 'cooler':
                            selectionResult = await this.selectCooler(client);
                            // Handle cases where cooler might be optional (stock cooler)
                            if (!selectionResult && !errors['cooler']) {
                                console.log("No separate cooler selected (possibly using stock or optional).");
                                // Placeholder stored within selectCooler method if applicable
                            }
                            break;
                        case 'memory':
                            selectionResult = await this.selectMemory(client);
                            break;
                        case 'gpu':
                            selectionResult = await this.selectGPU(client);
                             // Handle cases where GPU might be optional (iGPU)
                            if (!selectionResult && !errors['gpu'] && this.selectedComponents.cpu?.integrated_graphics === 'Yes') { // Check specific value
                                console.log("No discrete GPU selected (likely using integrated graphics).");
                                 // Placeholder stored within selectGPU method if applicable
                            }
                            break;
                        case 'storage':
                            selectionResult = await this.selectStorage(client);
                            break;
                        case 'case':
                            selectionResult = await this.selectCase(client);
                            break;
                        case 'psu':
                            selectionResult = await this.selectPsu(client);
                            break;
                    }
                    // Storing happens within the individual select methods via _process_and_store_component

                } catch (err: any) {
                    console.error(`Error selecting ${componentType}: ${err.message}`);
                    errors[componentType] = `Failed to select ${componentType}: ${err.message}`;
                     // Decide if error is critical (e.g., cannot proceed without CPU/Mobo)
                    if (['cpu', 'motherboard'].includes(componentType)) {
                         // Allow process to continue to report all errors, but final build might be incomplete
                         console.error(`Critical component ${componentType} selection failed. Build may be incomplete.`);
                         // Optionally throw: throw new Error(`Critical component ${componentType} selection failed: ${err.message}`);
                    }
                }
            }
            // --- End Component Selection Loop ---

            // --- Assemble Final Recommendation ---
            console.log("\n--- Assembling Final Recommendation ---");
            if (Object.keys(this.selectedComponents).length === 0 && Object.keys(errors).length > 0) {
                 // If absolutely nothing was selected, throw the combined errors
                 throw new Error(`Failed to select any components. Errors: ${JSON.stringify(errors)}`);
            }

            let totalCostUSD = 0;
            const finalComponents: any = {};

            // Use componentOrder to ensure consistent output order
            for (const compType of componentOrder) {
                const partTypeKey = compType as PartType;
                const compData = this.selectedComponents[partTypeKey];

                // Include selected components (even placeholders like stock cooler/iGPU if stored)
                if (compData && compData.id !== undefined) { // Check for id presence (0 is valid for placeholders)
                     const isPlaceholder = compData.id === 0;
                     let priceUSD = 0;
                     let details: any = { ...compData }; // Start with data stored during selection

                     if (!isPlaceholder && compData.id) {
                         // Fetch full details again for the final output only for real components
                         // Avoid fetching if details are already sufficient from selection
                         // For simplicity, we refetch; optimization could store more during selection
                         try {
                             const fullDetailsResult = await this._executeQuery(client, `SELECT * FROM ${componentTables[compType]} WHERE id = $1`, [compData.id]);
                             if (fullDetailsResult.length > 0) {
                                 details = { ...details, ...fullDetailsResult[0] }; // Merge stored selection data with full DB data
                             }
                         } catch (fetchErr: any) {
                             console.warn(`Could not fetch full details for ${compType} ID ${compData.id}: ${fetchErr.message}`);
                         }
                         // Use price_num if available and valid, otherwise parse from price string or use stored numeric price
                         priceUSD = Number(details.price_num > 0 ? details.price_num : (compData.price ?? 0));
                         if (isNaN(priceUSD) || priceUSD <= 0) {
                            // Attempt to parse from the original price string if numeric price is invalid/missing
                            const priceMatch = String(details.price)?.match(/[^\d.-]/g);
                            priceUSD = priceMatch ? parseFloat(priceMatch[0]) : 0;
                         }
                         totalCostUSD += priceUSD;
                     } else {
                         // For placeholders, price is 0
                         priceUSD = 0;
                         details.price = "$0.00"; // Ensure placeholders have a price string
                     }


                     // Clean up details object (remove nulls, NaNs, redundant fields like id/name/price/price_num)
                     const cleanedDetails: any = {};
                     for (const key in details) {
                         if (!['id', 'name', 'price', 'price_num'].includes(key) && details[key] !== null && details[key] !== 'NaN' && details[key] !== undefined) {
                             cleanedDetails[key] = details[key];
                         }
                     }

                     finalComponents[compType] = {
                         id: compData.id, // Include ID (0 for placeholders)
                         name: compData.name,
                         price: details.price ?? `$${Number(compData.price ?? 0).toFixed(2)}`, // Original price string or formatted selection price
                         price_usd_num: priceUSD,
                         price_inr: `₹${(priceUSD / INR_TO_USD).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                         details: cleanedDetails
                     };
                } else if (errors[partTypeKey]) {
                     // Include errors for components that failed selection
                     finalComponents[partTypeKey] = {
                         id: null,
                         name: `Error Selecting ${partTypeKey}`,
                         price: "N/A",
                         price_usd_num: 0,
                         price_inr: "N/A",
                         details: { error: errors[partTypeKey] }
                     };
                 } else if (!this.selectedComponents[partTypeKey]) {
                    // Indicate component was skipped or not found if no error was recorded but it's missing
                     finalComponents[partTypeKey] = {
                         id: null,
                         name: `Not Selected / Found`,
                         price: "N/A",
                         price_usd_num: 0,
                         price_inr: "N/A",
                         details: {}
                     };
                 }
            }

            const totalCostINR = totalCostUSD / INR_TO_USD;
            const budgetINR = this.userPrefs.budget ?? 0;

            const recommendation = {
                components: finalComponents,
                selection_order: componentOrder,
                total_cost_usd: `$${totalCostUSD.toFixed(2)}`,
                total_cost_inr: `₹${totalCostINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                budget_inr: `₹${budgetINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                budget_usd: `$${(budgetINR * INR_TO_USD).toFixed(2)}`,
                selection_errors: Object.keys(errors).length > 0 ? errors : undefined,
                status: totalCostINR <= budgetINR ? "Within budget" : `Over budget by ₹${(totalCostINR - budgetINR).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                ...(totalCostINR <= budgetINR && { remaining_budget_inr: `₹${(budgetINR - totalCostINR).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` })
            };

            await client.query('COMMIT'); // Commit transaction
            console.log("Recommendation built successfully.");
            return recommendation;

        } catch (error: any) {
            console.error("Error building recommendation:", error);
            if (client) {
                await client.query('ROLLBACK'); // Rollback on error
                 console.log("Transaction rolled back due to error.");
            }
            return {
                error: `Recommendation process failed: ${error.message}`,
                details: JSON.stringify(errors) || undefined
            };
        } finally {
            if (client) {
                client.release(); // Release client back to pool
                 console.log("Database client released.");
            }
        }
    }

    public async close(): Promise<void> {
        console.log("Closing database pool.");
        await this.pool.end();
    }

    /**
     * Parses price string (e.g., "$123.45") into a number.
     * Handles potential null, undefined, or non-numeric values.
     */
    private _parsePrice(price: any): number {
        if (typeof price === 'number') {
            return price > 0 ? price : 0; // Return 0 if price is not positive
        }
        if (typeof price === 'string') {
            // Remove currency symbols, commas, etc.
            const priceString = price.replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus
            const priceNum = parseFloat(priceString);
            return !isNaN(priceNum) && priceNum > 0 ? priceNum : 0;
        }
        return 0; // Default to 0 if parsing fails or type is wrong
    }


    /**
     * Processes query results, handles pricing, and stores the component.
     * Stores more details fetched from the query to reduce refetching later.
     */
    private _process_and_store_component(
        results: any[],
        description: any[] | null, // Currently unused, but kept for potential future use
        componentType: PartType,
        originalBudget: number // USD
    ): Part | null {
        if (!results || results.length === 0) {
             console.warn(`${componentType}: No results passed to _process_and_store_component.`);
             return null; // Explicitly return null if no results
        }

        const partData = { ...results[0] }; // Clone the first result row

        // --- Price Handling ---
        // Prioritize 'price_num' if it exists and is valid, otherwise parse 'price'
        let priceNum = this._parsePrice(partData.price_num);
        if (priceNum <= 0) { // If price_num is invalid or missing, try parsing 'price'
            priceNum = this._parsePrice(partData.price);
        }
        partData.price_num = priceNum; // Ensure price_num is always set numerically (and >= 0)

        // --- Rank Handling (Add defaults if columns expected but missing) ---
        partData.rank = partData.rank ?? 9999;
        partData.ml_score = partData.ml_score ?? 0;

        // --- Over Budget Warning ---
        if (priceNum > originalBudget) {
            console.warn(`Selected ${componentType} price $${priceNum.toFixed(2)} exceeds original budget $${originalBudget.toFixed(2)}`);
        }

        // --- Store Component ---
        this.selectedComponents[componentType] = {
            id: partData.id,
            name: partData.name,
            price: priceNum, // Store the NUMERIC USD price consistently
            ...partData // Include all other fetched columns
        };

        console.log(`Selected ${componentType.toUpperCase()}: ${partData.name} ($${priceNum.toFixed(2)}) Rank: ${partData.rank ?? 'N/A'}`);
        // Ensure the returned object matches the Part type potentially expected by callers
        const storedPart = this.selectedComponents[componentType];
        return storedPart ?? null; // Return the stored part or null
    }


    // --- Component Selection Methods (Translated from Python logic) ---

    /**
     * Generic method to select a component with fallback logic.
     */
    private async selectComponent(client: PoolClient, options: ComponentSelectionOptions): Promise<Part | null> {
        const { componentType, budget, baseQuery, cheapestQuery, lastResortQuery,
                baseParams, cheapestParams, lastResortParams, requiredComponents } = options;

        // Check required components
        if (requiredComponents) {
            for (const reqComp of requiredComponents) {
                if (!this.selectedComponents[reqComp]) {
                    throw new Error(`${reqComp} must be selected before choosing a ${componentType}`);
                }
            }
        }

        // Execute queries with fallbacks
        let results: any[] = [];
        const executeAndCheck = async (query: string, params: any[], logMsg: string): Promise<boolean> => {
            console.log(`${componentType}: ${logMsg}`);
            try {
                results = await this._executeQuery(client, query, params);
                return results.length > 0;
            } catch (error: any) {
                console.warn(`${componentType}: Query failed during fallback step '${logMsg}': ${error.message}`);
                return false;
            }
        };

        // Try with original budget
        if (await executeAndCheck(baseQuery, baseParams, "Trying query within budget...")) {
            console.log(`${componentType}: Found component within budget.`);
        } 
        // Try with 1.5x budget
        else if (await executeAndCheck(baseQuery, [budget * 1.5, ...baseParams.slice(1)], "Trying with 1.5x budget...")) {
            console.log(`${componentType}: Found component with 1.5x budget.`);
        }
        // Try with 2.0x budget
        else if (await executeAndCheck(baseQuery, [budget * 2.0, ...baseParams.slice(1)], "Trying with 2.0x budget...")) {
            console.log(`${componentType}: Found component with 2.0x budget.`);
        }
        // Try with 2.5x budget
        else if (await executeAndCheck(baseQuery, [budget * 2.5, ...baseParams.slice(1)], "Trying with 2.5x budget...")) {
            console.log(`${componentType}: Found component with 2.5x budget.`);
        }
        // Try cheapest compatible
        else if (await executeAndCheck(cheapestQuery, cheapestParams, "No result within budget, trying cheapest compatible...")) {
            console.log(`${componentType}: Found cheapest compatible component.`);
        }
        // Try last resort
        else if (await executeAndCheck(lastResortQuery, lastResortParams, "No compatible cheapest found, trying last resort...")) {
            console.log(`${componentType}: Found last resort component.`);
        }
        else {
            throw new Error(`Could not find any suitable ${componentType} after all fallbacks.`);
        }

        return this._process_and_store_component(results, null, componentType, budget);
    }

    // --- Individual Component Selection Implementations ---

    private async selectCPU(client: PoolClient): Promise<Part | null> {
        const budget = this._getComponentBudget('cpu');
        const marketSegment = this._getMarketSegment();
        const platformPref = this.userPrefs.technicalPreferences?.cpuPlatform;
        console.log(`Starting CPU Selection - Budget: $${budget.toFixed(2)}, Segment: ${marketSegment}, Platform: ${platformPref}`);

        let platformFilter = '';
        if (platformPref?.toUpperCase() === 'AMD') platformFilter = " AND manufacturer = 'AMD'";
        else if (platformPref?.toUpperCase() === 'INTEL') platformFilter = " AND manufacturer = 'Intel'";

        // Base query with rank and ml_score
        const baseQuery = `
            SELECT *, "rank", ml_score FROM cpu_specs
            WHERE price_num <= $1 AND price_num > 0 AND market_segment = $2 ${platformFilter}
            ${this._getOrderByClause('cpu_specs')}
            LIMIT 5
        `;

        // Cheapest query
        const cheapestQuery = `
            SELECT *, "rank", ml_score FROM cpu_specs
            WHERE price_num > 0 AND market_segment = $1 ${platformFilter}
            ORDER BY price_num ASC
            LIMIT 1
        `;

        // Last resort query
        const lastResortQuery = `
            SELECT *, "rank", ml_score FROM cpu_specs 
            WHERE price_num > 0 ${platformFilter} 
            ORDER BY price_num ASC 
            LIMIT 1
        `;

        // Absolute last resort query (any platform)
        const absoluteLastResortQuery = `
            SELECT *, "rank", ml_score FROM cpu_specs 
            WHERE price_num > 0 
            ORDER BY price_num ASC 
            LIMIT 1
        `;

        try {
            // Try with original budget and market segment
            let results = await this._executeQuery(client, baseQuery, [budget, marketSegment]);
            
            // If no results, try with 1.5x budget
            if (!results.length) {
                console.log("CPU - No results with original budget, trying 1.5x budget");
                results = await this._executeQuery(client, baseQuery, [budget * 1.5, marketSegment]);
            }
            
            // If still no results, try with 2x budget
            if (!results.length) {
                console.log("CPU - No results with 1.5x budget, trying 2x budget");
                results = await this._executeQuery(client, baseQuery, [budget * 2, marketSegment]);
            }
            
            // If still no results, try with 2.5x budget
            if (!results.length) {
                console.log("CPU - No results with 2x budget, trying 2.5x budget");
                results = await this._executeQuery(client, baseQuery, [budget * 2.5, marketSegment]);
            }
            
            // If still no results, try cheapest in segment
            if (!results.length) {
                console.log("CPU - No results with 2.5x budget, trying cheapest in segment");
                results = await this._executeQuery(client, cheapestQuery, [marketSegment]);
            }
            
            // If still no results, try last resort (any platform)
            if (!results.length) {
                console.log("CPU - No results with cheapest in segment, trying last resort");
                results = await this._executeQuery(client, lastResortQuery, []);
            }
            
            // If still no results, try absolute last resort (any platform)
            if (!results.length) {
                console.warn("CPU - Fallback queries failed, trying absolute last resort (any platform)");
                results = await this._executeQuery(client, absoluteLastResortQuery, []);
            }

            if (!results.length) {
                throw new Error("No compatible CPU found after all fallbacks");
            }

            return this._process_and_store_component(results, null, 'cpu', budget);
        } catch (error: any) {
            console.error(`Error selecting CPU: ${error.message}`);
            throw error; // Re-raise critical error
        }
    }

     private async selectMotherboard(client: PoolClient): Promise<Part | null> {
        const cpu = this.selectedComponents.cpu;
        if (!cpu || !cpu.id) {
            throw new Error("CPU must be selected before choosing a Motherboard");
        }
        const cpuId = cpu.id;
        const budget = this._getComponentBudget('motherboard');

        const selectClause = 'SELECT m.*, c.*, m."rank", m.ml_score, m.price_num'; 
        const fromJoinClause = `FROM get_compatible_motherboards($1) c JOIN motherboard_specs m ON c.id = m.id`;
        const baseWhere = `m.price_num <= $2 AND m.price_num > 0`;
        const cheapestWhere = `m.price_num > 0`;
        const orderBy = this._getOrderByClause('m');
        const cheapestOrderBy = 'ORDER BY m.price_num ASC';

        const baseQuery = `${selectClause} ${fromJoinClause} WHERE ${baseWhere} ${orderBy} LIMIT 1`;
        const cheapestQuery = `${selectClause} ${fromJoinClause} WHERE ${cheapestWhere} ${cheapestOrderBy} LIMIT 1`;
        const lastResortQuery = `SELECT *, "rank", ml_score FROM motherboard_specs WHERE price_num > 0 ORDER BY price_num ASC LIMIT 1`;

        return this.selectComponent(client, {
            componentType: 'motherboard',
            budget: budget,
            requiredComponents: ['cpu'],
            baseQuery: baseQuery,
            cheapestQuery: cheapestQuery,
            lastResortQuery: lastResortQuery,
            baseParams: [cpuId, budget],
            cheapestParams: [cpuId],
            lastResortParams: [],
        });
    }

    private async selectCooler(client: PoolClient): Promise<Part | null> {
        const cpu = this.selectedComponents.cpu;
        if (!cpu || !cpu.id) {
             throw new Error("CPU must be selected before choosing a Cooler");
        }
        const cpuId = cpu.id;
        const budget = this._getComponentBudget('cooler');

        const cpuTdp = this._parsePrice(cpu.tdp);
        const comesWithCooler = cpu.cooler === 'Yes' || (cpuTdp > 0 && cpuTdp < 70); // Adjusted TDP check

        const selectClause = 'SELECT cs.*, cs."rank", cs.ml_score, cs.price_num';
        const fromJoinClause = `FROM get_compatible_cpu_coolers($1) c JOIN cooler_specs cs ON c.id = cs.id`;
        const baseWhere = `cs.price_num <= $2 AND cs.price_num > 0`;
        const cheapestWhere = `cs.price_num > 0`;
        const orderBy = this._getOrderByClause('cs');
        const cheapestOrderBy = 'ORDER BY cs.price_num ASC';

        const baseQuery = `${selectClause} ${fromJoinClause} WHERE ${baseWhere} ${orderBy} LIMIT 1`;
        const cheapestQuery = `${selectClause} ${fromJoinClause} WHERE ${cheapestWhere} ${cheapestOrderBy} LIMIT 1`;
        const lastResortQuery = `SELECT *, "rank", ml_score FROM cooler_specs WHERE price_num > 0 ORDER BY price_num ASC LIMIT 1`;

        try {
             const selectedCooler = await this.selectComponent(client, {
                 componentType: 'cooler',
                 budget: budget,
                 requiredComponents: ['cpu'],
                 baseQuery: baseQuery,
                 cheapestQuery: cheapestQuery,
                 lastResortQuery: lastResortQuery,
                 baseParams: [cpuId, budget],
                 cheapestParams: [cpuId],
                 lastResortParams: [],
             });
             return selectedCooler;
         } catch (error: any) {
            if (comesWithCooler) {
                console.warn(`Failed to select aftermarket cooler, falling back to stock cooler: ${error.message}`);
                this.selectedComponents['cooler'] = { id: 0, name: 'Stock Cooler (Fallback)', price: 0 };
                return null;
            } else {
                console.error(`Failed to select required cooler: ${error.message}`);
                throw error;
            }
        }
    }

    private async selectMemory(client: PoolClient): Promise<Part | null> {
        const motherboard = this.selectedComponents.motherboard;
        const cpu = this.selectedComponents.cpu;
        if (!motherboard || !motherboard.id || !cpu || !cpu.id) {
            throw new Error("Motherboard and CPU must be selected before choosing Memory");
        }
        const moboId = motherboard.id;
        const cpuId = cpu.id;
        const budget = this._getComponentBudget('memory');

        const selectClause = 'SELECT m.*, m."rank", m.ml_score, m.price_num';
        const fromJoinClause = `FROM get_compatible_ram($1, $2) r JOIN memory_specs m ON r.id = m.id`;
        const baseWhere = `m.price_num <= $3 AND m.price_num > 0`;
        const cheapestWhere = `m.price_num > 0`;
        const orderBy = this._getOrderByClause('m');
        const cheapestOrderBy = 'ORDER BY m.price_num ASC';

        const baseQuery = `${selectClause} ${fromJoinClause} WHERE ${baseWhere} ${orderBy} LIMIT 1`;
        const cheapestQuery = `${selectClause} ${fromJoinClause} WHERE ${cheapestWhere} ${cheapestOrderBy} LIMIT 1`;

        const moboMemType = motherboard.memory_type;
        const typeFilter = moboMemType ? `AND type = ${client.escapeLiteral(moboMemType)}` : '';
        const lastResortQuery = `SELECT *, "rank", ml_score FROM memory_specs WHERE price_num > 0 ${typeFilter} ORDER BY price_num ASC LIMIT 1`;

        return this.selectComponent(client, {
            componentType: 'memory',
            budget: budget,
            requiredComponents: ['motherboard', 'cpu'],
            baseQuery: baseQuery,
            cheapestQuery: cheapestQuery,
            lastResortQuery: lastResortQuery,
            baseParams: [moboId, cpuId, budget],
            cheapestParams: [moboId, cpuId],
            lastResortParams: [],
        });
    }

    private async selectGPU(client: PoolClient): Promise<Part | null> {
        const motherboard = this.selectedComponents.motherboard;
        const cpu = this.selectedComponents.cpu;
        if (!motherboard || !motherboard.id || !cpu) {
             throw new Error("Motherboard and CPU must be selected before choosing a GPU");
        }
        const moboId = motherboard.id;
        const budget = this._getComponentBudget('gpu');
        const marketSegment = this._getMarketSegment();
        const platformPref = this.userPrefs.technicalPreferences?.gpuPlatform;

        const hasIGPU = cpu.integrated_graphics === 'Yes';

        let brandFilter = '';
        if (platformPref?.toUpperCase() === 'NVIDIA') brandFilter = " AND g.brand = 'NVIDIA'";
        else if (platformPref?.toUpperCase() === 'AMD') brandFilter = " AND g.brand = 'AMD'";
        else if (platformPref?.toUpperCase() === 'INTEL') brandFilter = " AND g.brand = 'Intel'";

        const selectClause = 'SELECT g.*, g."rank", g.ml_score, g.price_num';
        const fromJoinClause = `FROM get_compatible_video_cards($1) v JOIN gpu_specs g ON v.id = g.id`;
        const baseWhere = `g.price_num <= $2 AND g.price_num > 0 AND g.market_segment = $3 ${brandFilter}`;
        const cheapestWhere = `g.price_num > 0 AND g.market_segment = $2 ${brandFilter}`;
        const orderBy = this._getOrderByClause('g');
        const cheapestOrderBy = 'ORDER BY g.price_num ASC';

        const baseQuery = `${selectClause} ${fromJoinClause} WHERE ${baseWhere} ${orderBy} LIMIT 1`;
        const cheapestQuery = `${selectClause} ${fromJoinClause} WHERE ${cheapestWhere} ${cheapestOrderBy} LIMIT 1`;
        const lastResortQuery = `${selectClause} ${fromJoinClause} WHERE g.price_num > 0 ORDER BY g.price_num ASC LIMIT 1`;
        const absoluteLastResortQuery = `SELECT *, "rank" as gpu_rank FROM gpu_specs WHERE price_num > 0 ORDER BY price_num ASC LIMIT 1`;

        try {
            const selectedGpu = await this.selectComponent(client, {
                componentType: 'gpu',
                budget: budget,
                requiredComponents: ['motherboard', 'cpu'],
                baseQuery: baseQuery,
                cheapestQuery: cheapestQuery,
                lastResortQuery: lastResortQuery,
                baseParams: [moboId, budget, marketSegment],
                cheapestParams: [moboId, marketSegment],
                lastResortParams: [moboId],
            });
             return selectedGpu;
        } catch (error: any) {
             if (hasIGPU) {
                console.warn(`Failed to select discrete GPU, falling back to integrated graphics: ${error.message}`);
                this.selectedComponents['gpu'] = { id: 0, name: 'Integrated Graphics (Fallback)', price: 0 };
                return null;
            } else {
                console.error(`Failed to select required discrete GPU: ${error.message}`);
                throw error;
            }
        }
    }

    private async selectStorage(client: PoolClient): Promise<Part | null> {
        const motherboard = this.selectedComponents.motherboard;
        if (!motherboard || !motherboard.id) {
            throw new Error("Motherboard must be selected before choosing Storage");
        }
        const moboId = motherboard.id;
        const budget = this._getComponentBudget('storage');

        // Simplified query structure for storage
        const baseQuery = `
            SELECT ss.* 
            FROM get_compatible_ssd($1) s 
            JOIN ssd_specs ss ON s.id = ss.id 
            WHERE ss.price_num <= $2 AND ss.price_num > 0 
            ORDER BY ss.price_num DESC LIMIT 1
        `;
        
        const cheapestQuery = `
            SELECT ss.* 
            FROM get_compatible_ssd($1) s 
            JOIN ssd_specs ss ON s.id = ss.id 
            WHERE ss.price_num > 0 
            ORDER BY ss.price_num ASC LIMIT 1
        `;
        
        const lastResortQuery = `
            SELECT * 
            FROM ssd_specs 
            WHERE price_num > 0 
            ORDER BY price_num ASC LIMIT 1
        `;

        return this.selectComponent(client, {
            componentType: 'storage',
            budget: budget,
            requiredComponents: ['motherboard'],
            baseQuery: baseQuery,
            cheapestQuery: cheapestQuery,
            lastResortQuery: lastResortQuery,
            baseParams: [moboId, budget],
            cheapestParams: [moboId],
            lastResortParams: [],
        });
    }

     private async selectCase(client: PoolClient): Promise<Part | null> {
        const motherboard = this.selectedComponents.motherboard;
        const gpu = this.selectedComponents.gpu;
        if (!motherboard || !motherboard.id) {
            throw new Error("Motherboard must be selected before choosing a Case");
        }

        const gpuId = (gpu && gpu.id !== 0) ? gpu.id : null;
        const moboId = motherboard.id;
        const budget = this._getComponentBudget('case');

        const baseParams = [gpuId, moboId, budget];
        const cheapestParams = [gpuId, moboId];

        // Simplified query structure for case
        const baseQuery = `
            SELECT cs.* 
            FROM get_compatible_case($1, $2) c 
            JOIN case_specs cs ON c.id = cs.id 
            WHERE cs.price_num <= $3 AND cs.price_num > 0 
            ORDER BY cs.price_num DESC LIMIT 1
        `;
        
        const cheapestQuery = `
            SELECT cs.* 
            FROM get_compatible_case($1, $2) c 
            JOIN case_specs cs ON c.id = cs.id 
            WHERE cs.price_num > 0 
            ORDER BY cs.price_num ASC LIMIT 1
        `;
        
        // Simplified last resort query with form factor filter
        const moboFormFactor = motherboard.form_factor;
        const formFactorFilter = moboFormFactor ? `AND type = $1` : '';
        const lastResortQuery = `
            SELECT * 
            FROM case_specs 
            WHERE price_num > 0 ${formFactorFilter}
            ORDER BY price_num ASC LIMIT 1
        `;
        
        const lastResortParams = moboFormFactor ? [moboFormFactor] : [];

        return this.selectComponent(client, {
            componentType: 'case',
            budget: budget,
            requiredComponents: ['motherboard'],
            baseQuery: baseQuery,
            cheapestQuery: cheapestQuery,
            lastResortQuery: lastResortQuery,
            baseParams: baseParams,
            cheapestParams: cheapestParams,
            lastResortParams: lastResortParams,
        });
    }

    private async selectPsu(client: PoolClient): Promise<Part | null> {
        const pcCase = this.selectedComponents.case;
        const cpu = this.selectedComponents.cpu;
        const gpu = this.selectedComponents.gpu;

        if (!pcCase || !pcCase.id || !cpu || !cpu.id) {
            throw new Error("Case and CPU must be selected before choosing PSU");
        }

        const caseId = pcCase.id;
        const cpuId = cpu.id;
        const gpuId = (gpu && gpu.id !== 0) ? gpu.id : null;
        const budget = this._getComponentBudget('psu');

        let requiredWattage = 200;
        try {
             const cpuTdpResult = await this._executeQuery(client, 'SELECT tdp FROM cpu_specs WHERE id = $1', [cpuId]);
             const gpuTdpResult = gpuId ? await this._executeQuery(client, 'SELECT tdp FROM gpu_specs WHERE id = $1', [gpuId]) : [];

             const parseTdp = (tdpString: string | null | undefined): number => {
                 if (!tdpString) return 0;
                 const match = tdpString.match(/(\d+)/);
                 return match ? parseInt(match[0], 10) : 0;
             };

             const cpuTdp = parseTdp(cpuTdpResult[0]?.tdp);
             const gpuTdp = gpuTdpResult.length > 0 ? parseTdp(gpuTdpResult[0]?.tdp) : 0;

             const totalTdp = cpuTdp + gpuTdp;
             requiredWattage = Math.ceil(totalTdp * 1.5 + 50);
             requiredWattage = Math.max(requiredWattage, 450);

             console.log(`Calculated Required Wattage: ${requiredWattage}W (CPU TDP: ${cpuTdp}, GPU TDP: ${gpuTdp})`);
        } catch (tdpError: any) {
            requiredWattage = 550;
            console.error(`Failed to calculate required wattage: ${tdpError.message}. Using default fallback: ${requiredWattage}W`);
        }

        const selectClause = 'SELECT ps.*, ps."rank", ps.ml_score, ps.price_num';
        const fromJoinClause = `FROM get_compatible_psu($1, $2) p JOIN psu_specs ps ON p.id = ps.id`;
        const baseWhere = `ps.price_num <= $3 AND ps.price_num > 0`;
        const cheapestWhere = `ps.price_num > 0`;
        const orderBy = this._getOrderByClause('ps');
        const cheapestOrderBy = 'ORDER BY ps.price_num ASC';

        const baseQuery = `${selectClause} ${fromJoinClause} WHERE ${baseWhere} ${orderBy} LIMIT 1`;
        const cheapestQuery = `${selectClause} ${fromJoinClause} WHERE ${cheapestWhere} ${cheapestOrderBy} LIMIT 1`;
        const lastResortQuery = `SELECT *, "rank", ml_score FROM psu_specs WHERE wattage >= $1 AND price_num > 0 ORDER BY price_num ASC LIMIT 1`;

        return this.selectComponent(client, {
            componentType: 'psu',
            budget: budget,
            requiredComponents: ['case', 'cpu'],
            baseQuery: baseQuery,
            cheapestQuery: cheapestQuery,
            lastResortQuery: lastResortQuery,
            baseParams: [requiredWattage, caseId, budget],
            cheapestParams: [requiredWattage, caseId],
            lastResortParams: [requiredWattage],
        });
    }
    // --- End Component Selection Methods ---
}

// Types are now imported from ./types.ts
// Removed duplicate type definitions here 