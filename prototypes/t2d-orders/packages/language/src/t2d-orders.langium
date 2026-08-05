grammar T2DOrders

// Entry Rule
entry ClinicalModel:
    patients+=PatientData*
    rules+=DiagnosisRule*
    safetyRules+=SafetyRule*
    medications+=MedicationOrder*
    labs+=LabOrder*;

// Patient Data (raw clinical indicators)
PatientData:
    'patient' name=ID '{'
        'a1c'    ':' a1c=NUMBER          // HbA1c percentage, e.g. 7.8
        'fpg'    ':' fpg=NUMBER          // Fasting Plasma Glucose mmol/L, e.g. 8.2
        'egfr'   ':' egfr=NUMBER         // eGFR mL/min/1.73m², e.g. 85
        ('comorbidities' ':' '[' comorbidities+=STRING (',' comorbidities+=STRING)* ']')?
    '}';

// Diagnosis Rule (forward-chaining: IF metric THEN conclusion)
DiagnosisRule:
    'rule' name=ID '{'
        'if' condition=RuleCondition
        'then' conclusion=STRING
    '}';

// Safety Rule (eGFR-based medication constraint)
SafetyRule:
    'safety' name=ID '{'
        'if' condition=SafetyCondition
        'then' alertText=STRING
    '}';

MedicationOrder:
    'medication' name=ID '{'
        'drug'  ':' drug=STRING
        'dose'  ':' dose=NUMBER
        'unit'  ':' unit=STRING
        'route' ':' route=RouteEnum
        'frequency' ':' frequency=STRING
        ('indication'   ':' indication=STRING)?
    '}';

LabOrder:
    'lab' name=ID '{'
        'test'  ':' test=STRING
        ('specimen' ':' specimen=STRING)?
        'priority'  ':' priority=PriorityEnum
        ('indication'   ':' indication=STRING)?
    '}';

RouteEnum returns string:
    'PO' | 'IV' | 'PR' | 'SC';

PriorityEnum returns string:
    'STAT' | 'Routine' | 'TimedAM';

RuleCondition:
    field=('a1c' | 'fpg') op=CompOp threshold=NUMBER;

SafetyCondition:
    field='egfr' op=CompOp threshold=NUMBER;

CompOp returns string:
    '>=' | '>' | '<=' | '<';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
