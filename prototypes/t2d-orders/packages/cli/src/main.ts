import { NodeFileSystem } from 'langium/node';
import { Command } from 'commander';
import { createT2DOrdersServices } from '../../language/out/t2d-orders-module.js';
import { extractDocument } from './util.js';
import { generateReport } from './generator.js';
import { isClinicalModel } from '../../language/out/generated/ast.js';
// import * as url from 'url';
// import * as path from 'path';
import * as fs from 'fs';
import { runClosedLoop, MockLLMClient } from 'vgcl';

// const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const program = new Command();

program
    .name('t2d-orders')
    .description('LB-DSL-CO T2D Clinical Orders CLI');

program
    .command('run <file>')
    .description('Parse, validate, and run forward-chaining on a .t2d file')
    .action(async (fileName: string) => {
        const services = createT2DOrdersServices(NodeFileSystem).T2DOrders;
        const document = await extractDocument(fileName, services);
        const model = document.parseResult.value;

        if (!isClinicalModel(model)) {
            console.error('Parsed document root is not a ClinicalModel');
            process.exit(1);
        }

        // Print forward-chaining report to stdout
        const report = generateReport(model, fileName, undefined);
        console.log(report);
    });

program
    .command('validate <file>')
    .description('Validate a .t2d file against ADA/Diabetes Canada guidelines')
    .action(async (fileName: string) => {
        const services = createT2DOrdersServices(NodeFileSystem).T2DOrders;
        await extractDocument(fileName, services);
        console.log(`✅ Validation passed for: ${fileName}`);
    });

program
    .command('propose <narrativeFile>')
    .description(`Run VGCL closed loop: LLM proposes DSL from a narrative,
    Validator checks, LLM repairs on failure`)
    .option('--max-retries <n>', 'max repair attempts', '3')
    .action(async (narrativeFile: string, opts: { maxRetries: string}) => {
        const services = createT2DOrdersServices(NodeFileSystem).T2DOrders;
        const narrative = fs.readFileSync(narrativeFile, 'utf-8').trim();
        const llm = new MockLLMClient();

        console.log('=== LB-DSL-CO VGCL Closed-Loop Report ===');
        console.log(`Narrative: "${narrative}"\n`);

        const result = await runClosedLoop(narrative, services, llm, 
            Number(opts.maxRetries));

        for (const step of result.trace) {
            console.log(`── Attempt ${step.attempt} ──`);
            console.log(step.candidateDsl);
            if (step.passed) {
                console.log('✅ Validator: PASSED\n');
            } else {
                console.log('❌ Validator: FAILED');
                step.diagnostics.forEach(d => console.log(`   ⚠ ${d}`));
                console.log('');
            }
        }

        if (result.success) {
            console.log(`✅ Closed loop converged after ${result.trace.length} attempt(s).`);
            console.log(`⚠ REMINDER: This DSL passed symbolic validation only. 
                It is NOT clinically approved. Qualified clinician review is required 
                before any real-world use.`);
        } else {
            console.log(`❌ Closed loop did not converge within ${opts.maxRetries} attempts.`);
            process.exit(1);
        }
    })
program.parse(process.argv);