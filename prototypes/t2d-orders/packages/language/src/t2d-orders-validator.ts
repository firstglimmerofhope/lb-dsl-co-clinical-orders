import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type {
    T2DOrdersAstType,
    PatientData,
    MedicationOrder,
    LabOrder,
} from './generated/ast.js';
import type { T2DOrdersServices } from './t2d-orders-module.js';

// Local JSON terminology cache — per [PIT-2], no real-time RxNorm/LOINC REST calls
const KNOWN_T2D_DRUGS = new Set([
    'Metformin', 'Empagliflozin', 'Dapagliflozin', 'Semaglutide',
    'Tirzepatide', 'Sitagliptin', 'Linagliptin', 'Glimepiride',
    'Atorvastatin', 'Rosuvastatin', 'Lisinopril', 'Losartan', 'Glargine', 'Lispro'
]);

const DOSE_RANGES: Record<string, [number, number]> = {
    Metformin: [500, 2000],
    Empagliflozin: [10, 25],
    Dapagliflozin: [5, 10],
    Atorvastatin: [10, 80]
};

export function registerValidationChecks(services: T2DOrdersServices): void {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.T2DOrdersValidator;
    const checks: ValidationChecks<T2DOrdersAstType> = {
        PatientData:    validator.checkPatientRanges,
        MedicationOrder: validator.checkMedicationOrder,
        LabOrder: validator.checkLabOrder,
    };
    registry.register(checks, validator);
}

export class T2DOrdersValidator {

    checkMedicationOrder(order: MedicationOrder, accept: ValidationAcceptor): void {
        // Rule 1: drug must be in local terminology cache (RxNorm-mapped subset)
        if (!KNOWN_T2D_DRUGS.has(order.drug)) {
            accept('warning', `Drug "${order.drug}" is not in the local T2D RxNorm cache. Verify spelling or extend the cache.`, {
                node: order,
                property: 'drug'
            });
        }

        // Rule 2: dose must fall within clinically plausible range
        const range = DOSE_RANGES[order.drug];
        if (range && (order.dose < range[0] || order.dose > range[1])) {
            accept('error', `Dose ${order.dose}${order.unit} for ${order.drug} is outside the clinically valid range [${range[0]}-${range[1]}${order.unit}].`, {
                node: order,
                property: 'dose'
            });
        }

        // Rule 3: route must be one of the FDA-mapped enum values (already enforced by grammar,
        // but we double check here in case grammar is relaxed later)  PO = by mouth / oral 
        // IV = intravenous PR = per rectum SC = subcutaneous
        const validRoutes = ['PO', 'IV', 'PR', 'SC'];
        if (!validRoutes.includes(order.route)) {
            accept('error', `Route "${order.route}" is not a recognized administration route.`, {
                node: order,
                property: 'route'
            });
        }
    }

    checkLabOrder(order: LabOrder, accept: ValidationAcceptor): void {
        // Rule 4: STAT priority requires a documented indication (billing/medical necessity)
        if (order.priority === 'STAT' && !order.indication) {
            accept('error', `STAT lab order "${order.test}" requires an "indication" field for medical necessity.`, {
                node: order,
                property: 'priority'
            });
        }
    }

    checkPatientRanges(patient: PatientData, accept: ValidationAcceptor): void {
        if (patient.a1c < 3.0 || patient.a1c > 20.0) {
            accept('error', `A1C value ${patient.a1c}% is outside plausible clinical range [3.0-20.0].`, {
                node: patient,
                property: 'a1c'
            });
        }

        if (patient.fpg < 3.0 || patient.fpg > 20.0) {
            accept('error', `FPG value ${patient.fpg}% is outside plausible clinical range [3.0-20.0].`, {
                node: patient,
                property: 'fpg'
            });
        }

        if (patient.egfr < 0 || patient.egfr > 150) {
            accept('error', `eGFR value ${patient.egfr} is outside plausible clinical range [0-150].`, {
                node: patient,
                property: 'egfr'
            });
        }
    }
}