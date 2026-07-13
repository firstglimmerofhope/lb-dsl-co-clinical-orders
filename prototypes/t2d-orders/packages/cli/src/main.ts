import { NodeFileSystem } from 'langium/node';
import { Command } from 'commander';
import { createT2DOrdersServices } from '../../language/out/t2d-orders-module.js';
import { extractDocument } from './util.js';
import { generateReport } from './generator.js';
import { isClinicalModel } from '../../language/out/generated/ast.js';
// import * as url from 'url';
// import * as path from 'path';
// import * as fs from 'fs';

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

program.parse(process.argv);