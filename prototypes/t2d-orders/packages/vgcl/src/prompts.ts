export function buildRepairPrompt(narrative: string, previousAttempt: string, 
    diagnostics: string[]): string {
    return `
      The following clinical narrative was provided: "${narrative}"
      
      Your previous DSL candidate was: ${previousAttempt}

      The DSL Validator rejected it with these errors:
      ${diagnostics.map(d => `- ${d}`).join('\n')}

      Regenerate a corrected DSL candidate that resolves every error above while
      preserving all valid content.
      `.trim();
}