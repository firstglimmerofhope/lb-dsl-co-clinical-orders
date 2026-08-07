import { parseDocument } from 'langium/test';
import { type LangiumServices } from 'langium/lsp';
import { type ClinicalModel } from '../../language/out/generated/ast.js';
import {type LLMClient} from './llm-client.js';
import { buildRepairPrompt } from './prompts.js';

export interface LoopAttempt {
    attempt: number;
    candidateDsl: string;
    diagnostics: string[];
    passed: boolean;
}

export interface LoopResult {
    success: boolean;
    finalDsl?: string;
    trace: LoopAttempt[];
}

export async function runClosedLoop(
    narrative: string,
    services: LangiumServices,
    llm: LLMClient,
    maxRetries = 3
): Promise<LoopResult> {
    // Ensure that service has been registered.
    services.shared.ServiceRegistry.register(services);

    const trace: LoopAttempt[] = [];
    let candidate = await llm.generateInitial(narrative);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // parseDocument creates an in-memory LangiumDocument directly from a
        // string - no temp file needed. This is the official Langium API for
        // programmatic parsing.
        const document = await parseDocument<ClinicalModel>(services, candidate);
        await services.shared.workspace.DocumentBuilder.build([document], { 
            validation: true });
        
        const errors = (document.diagnostics ?? []).filter(d => d.severity === 1);
        const diagnosticMessages = errors.map(e => e.message);

        trace.push({ attempt, candidateDsl: candidate, diagnostics: 
            diagnosticMessages, passed: errors.length === 0 });

        if (errors.length === 0) {
            return { success: true, finalDsl: candidate, trace};
        }

        const repairPrompt = buildRepairPrompt(narrative, candidate, 
            diagnosticMessages);

        candidate = await llm.repair(repairPrompt);

    }
    return { success: false, trace};
}