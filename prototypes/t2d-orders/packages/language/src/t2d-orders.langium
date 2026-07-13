grammar T2DOrders

// Entry Rule
entry ClinicalModel:
    (patients+=PatientData | rules+=DiagnosisRule | safetyRules+=SafetyRule)*;

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
        'when' condition=Condition
        'then' 'diagnosis' ':' result=DiagnosisResult
    '}';

Condition:
    field=MetricField op=CompOp value=NUMBER;

DiagnosisResult returns string:
    'T2D' | 'Prediabetes' | 'Normal';

MetricField returns string:
    'a1c' | 'fpg';

CompOp returns string:
    '>=' | '>' | '<=' | '<';

// Safety Rule (eGFR-based medication constraint)
SafetyRule:
    'safety' name=ID '{'
        'when' 'egfr' op=CompOp threshold=NUMBER
        'then' level=SafetyLevel ':' message=STRING
    '}';

SafetyLevel returns string:
    'CRITICAL' | 'WARNING';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
