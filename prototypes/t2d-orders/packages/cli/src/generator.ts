import type { ClinicalModel, PatientData, DiagnosisRule, SafetyRule } 
    from '../../language/src/generated/ast.js';
import { CompositeGeneratorNode, NL, toString } from 'langium/generate';

// Forward-Chaining Engine

function inferDiagnosis(patient: PatientData, rules: DiagnosisRule[]): string {
    for (const rule of rules) {
        const { field, op, value } = rule.condition;
        const metricValue = field === 'a1c' ? patient.a1c : patient.fpg;
        const fired = evalOp(metricValue, op, value);
        if (fired) return rule.result;
    }
    return 'Normal';
}

function evalOp(left: number, op: string, right: number): boolean {
    switch (op) {
        case '>=': return left >= right;
        case '>':  return left > right;
        case '<=': return left <= right;
        case '<':  return left < right;
        default:   return false;
    }
}

function selectMedications(patient: PatientData, diagnosis: string): string[] {
    const meds: string[] = [];
    if (diagnosis !== 'T2D') {
        if (diagnosis === 'Prediabetes') meds.push('Lifestyle Intervention + Metformin Consideration');
        return meds;
    }
    if (patient.a1c >= 8.5 || patient.fpg >= 11.1)
        meds.push('Immediate Insulin or Combo Oral Therapy');
    meds.push('Metformin (First-Line)');
    const comorbidities = patient.comorbidities ?? [];
    if (comorbidities.includes('CKD') || comorbidities.includes('HF'))
        meds.push('SGLT2 Inhibitor (e.g., Empagliflozin) for Cardiorenal Protection');
    if (comorbidities.includes('ASCVD'))
        meds.push('GLP-1 Receptor Agonist (e.g., Semaglutide) for CV Protection');
    return meds;
}

function applySafety(patient: PatientData, meds: string[], safetyRules: SafetyRule[]): { meds: string[], alerts: string[] } {
    const alerts: string[] = [];
    let safeMeds = [...meds];
    for (const rule of safetyRules) {
        const fired = evalOp(patient.egfr, rule.op, rule.threshold);
        if (fired) {
            alerts.push(`[${rule.level}] eGFR ${patient.egfr}: ${rule.message}`);
            if (rule.level === 'CRITICAL') {
                safeMeds = safeMeds.filter(m => !m.includes('Metformin'));
                safeMeds.push('Alternative non-renal-cleared therapy required');
            }
        }
    }
    return { meds: safeMeds, alerts };
}

// Output Generator
export function generateReport(model: ClinicalModel, filePath: string, destination: string | undefined): string {
    const fileNode = new CompositeGeneratorNode();

    fileNode.append('=== LB-DSL-CO T2D Forward-Chaining Report ===', NL);
    fileNode.append(`Source: ${filePath}`, NL, NL);

    for (const patient of model.patients) {
        fileNode.append(`── Patient: ${patient.name} ──`, NL);
        fileNode.append(`   A1C: ${patient.a1c}%  |  FPG: ${patient.fpg} mmol/L  |  eGFR: ${patient.egfr}`, NL);
        if (patient.comorbidities?.length)
            fileNode.append(`   Comorbidities: ${patient.comorbidities.join(', ')}`, NL);

        const diagnosis = inferDiagnosis(patient, model.rules);
        fileNode.append(`   → Diagnosis:  ${diagnosis}`, NL);

        const meds = selectMedications(patient, diagnosis);
        const { meds: safeMeds, alerts } = applySafety(patient, meds, model.safetyRules);

        fileNode.append(`   → Medications:`, NL);
        safeMeds.forEach(m => fileNode.append(`       • ${m}`, NL));

        if (alerts.length) {
            fileNode.append(`   → Safety Alerts:`, NL);
            alerts.forEach(a => fileNode.append(`       ⚠ ${a}`, NL));
        }
        fileNode.append(NL);
    }

    return toString(fileNode);
}