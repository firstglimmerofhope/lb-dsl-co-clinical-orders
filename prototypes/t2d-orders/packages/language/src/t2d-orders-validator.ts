import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type {
    T2DOrdersAstType,
    ClinicalModel,
    PatientData,
    DiagnosisRule,
    SafetyRule
} from './generated/ast.js';
import type { T2DOrdersServices } from './t2d-orders-module.js';

// ADA/Diabetes Canada clinical thresholds (evidence-based constants)
const ADA_THRESHOLDS = {
    A1C_T2D: 6.5,       // ADA 2025: A1C ≥ 6.5% → T2D
    FPG_T2D: 7.0,       // ADA 2025: FPG ≥ 7.0 mmol/L → T2D
    A1C_PRE_LOW: 5.7,   // ADA: Prediabetes lower bound
    FPG_PRE_LOW: 5.6,
    EGFR_CRITICAL: 30,  // Metformin contraindicated below 30
    EGFR_WARN: 45,      // Metformin dose reduction below 45
};

export function registerValidationChecks(services: T2DOrdersServices): void {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.T2DOrdersValidator;
    const checks: ValidationChecks<T2DOrdersAstType> = {
        PatientData:    validator.checkPatientMetricRanges,
        DiagnosisRule:  validator.checkDiagnosisThresholds,
        SafetyRule:     validator.checkSafetyThresholds,
        ClinicalModel:  validator.checkModelHasDiagnosisRules,
    };
    registry.register(checks, validator);
}

export class T2DOrdersValidator {

    /** Guard: patient metric values must be physiologically plausible */
    checkPatientMetricRanges(patient: PatientData, accept: ValidationAcceptor): void {
        if (patient.a1c < 3.0 || patient.a1c > 20.0) {
            accept('error', `A1C value ${patient.a1c}% is outside plausible range (3–20%). Check input.`, {
                node: patient, property: 'a1c'
            });
        }
        if (patient.fpg < 2.0 || patient.fpg > 40.0) {
            accept('error', `FPG value ${patient.fpg} mmol/L is outside plausible range (2–40). Check input.`, {
                node: patient, property: 'fpg'
            });
        }
        if (patient.egfr < 1 || patient.egfr > 150) {
            accept('error', `eGFR value ${patient.egfr} is outside plausible range (1–150). Check input.`, {
                node: patient, property: 'egfr'
            });
        }
    }

    /** Guard: DSL rule thresholds must match ADA/Diabetes Canada guidelines */
    checkDiagnosisThresholds(rule: DiagnosisRule, accept: ValidationAcceptor): void {
        const { field, op, value } = rule.condition;
        if (field === 'a1c' && rule.result === 'T2D') {
            if (op === '>=' && Math.abs(value - ADA_THRESHOLDS.A1C_T2D) > 0.05) {
                accept('warning',
                    `ADA guideline: A1C T2D threshold should be ≥${ADA_THRESHOLDS.A1C_T2D}%, got ${value}%.`,
                    { node: rule.condition, property: 'value' });
            }
        }
        if (field === 'fpg' && rule.result === 'T2D') {
            if (op === '>=' && Math.abs(value - ADA_THRESHOLDS.FPG_T2D) > 0.05) {
                accept('warning',
                    `ADA guideline: FPG T2D threshold should be ≥${ADA_THRESHOLDS.FPG_T2D} mmol/L, got ${value}.`,
                    { node: rule.condition, property: 'value' });
            }
        }
    }

    /** Guard: safety rule eGFR cutoffs must match ADA/Diabetes Canada guidelines */
    checkSafetyThresholds(rule: SafetyRule, accept: ValidationAcceptor): void {
        if (rule.level === 'CRITICAL' && rule.threshold !== ADA_THRESHOLDS.EGFR_CRITICAL) {
            accept('warning',
                `Expected CRITICAL eGFR cutoff = ${ADA_THRESHOLDS.EGFR_CRITICAL}, got ${rule.threshold}. Verify against Diabetes Canada CPG.`,
                { node: rule, property: 'threshold' });
        }
        if (rule.level === 'WARNING' && rule.threshold !== ADA_THRESHOLDS.EGFR_WARN) {
            accept('warning',
                `Expected WARNING eGFR cutoff = ${ADA_THRESHOLDS.EGFR_WARN}, got ${rule.threshold}. Verify against ADA SoC.`,
                { node: rule, property: 'threshold' });
        }
    }

    /** Guard: every model must declare at least one DiagnosisRule */
    checkModelHasDiagnosisRules(model: ClinicalModel, accept: ValidationAcceptor): void {
        if (model.rules.length === 0) {
            accept('warning',
                'No DiagnosisRule declared. The forward-chaining engine has nothing to fire.',
                { node: model });
        }
    }
}