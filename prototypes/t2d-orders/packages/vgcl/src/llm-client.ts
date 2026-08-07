export interface LLMClient {
    generateInitial(narrative: string): Promise<string>;
    repair(repairPrompt: string): Promise<string>;
}

/**
 * MockLLMClient simulate realistic two-attempt LLM behavior for an OFFLINE demo
 * (no API key required). Attempt 1 intentionally omits the 'indication' field on a
 * STAT lab order - a common real-world LLM omission.  Attempt 2 applies the fix
 * that a correctly functioning LLM would produce after reading the Validator's 
 * diagnostic.
 * 
 * Swap this for OpenAiLLMClient once a real API key is available.
 */
export class MockLLMClient implements LLMClient {
    async generateInitial(_narrative: string): Promise<string> {
        return ` 
            patient JaneSmith {
                a1c:   8.1
                fpg:   9.0
                egfr:  25
                comorbidities: ["CKD"]
            }

            lab L2_BMP_STAT {
                test: "Basic Metabolic Panel"
                priority: STAT
            }
        `.trim();
    }
    async repair(_repairPrompt: string): Promise<string> {
        return `
            patient JaneSmith {
                a1c:   8.1
                fpg:   9.0
                egfr:  25
                comorbidities: ["CKD"]
            }

            lab L2_BMP_STAT {
                test: "Basic Metabolic Panel"
                priority: STAT
                indication: "Altered mental status, rule out DKA"
            }
        `.trim();
    }
 }

 /**
  * Stub for a real LLM provider, NOT wired to any network call in the prototype
  * , no async REST dependency should be introduced into the validation path. This
  * class only shows where a real HTTP call would go if the CLI is later extended 
  * outside the offline demo.
  */
 export class OpenAILLMClient implements LLMClient {
    constructor(private apiKey: string, private model='gpt-4o-mini') {}

    async generateInitial(_narrative: string): Promise<string> {
        throw new Error(`Not implemented in prototype — wire fetch() to OpenAI 
            API here.`);
    }
    async repair(_repairPrompt: string): Promise<string> {
        throw new Error(`Not implemented in prototype — wire fetch() to OpenAI 
            API here.`);
    }
 }