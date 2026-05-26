# lb-dsl-co-clinical-orders

Logic-Based DSL Clinical Orders Structuring (LB-DSL-CO): composing evidence-based care pathways using Langium + Sprotty + Monaco. LLM infers clinical orders; symbolic DSL layer ensures validation and interpretability.

# LB-DSL-CO: Logic-Based DSL for Clinical Orders Structuring

A research prototype that applies Domain-Specific Language (DSL) design to structure clinical orders for effective care pathway design.

## What This Project Does

Clinical orders — medications, lab tests, diagnostics — are often entered in ad-hoc, inconsistent ways inside EHR/EMR systems. This project introduces a logic-based DSL that lets clinicians compose structured clinical orders using formal, verifiable syntax, much like wiring logic circuits but for healthcare workflows.

The system follows a neuro-symbolic pipeline:

- **Neural layer**: An LLM translates natural clinical language into candidate DSL statements
- **Symbolic layer**: The DSL grammar and validator enforce correctness, safety, and alignment with standards such as RxNorm, LOINC, SNOMED-CT, and ICD-10

## Built With

- [Langium](https://langium.org) — DSL grammar and parser generation
- [Sprotty](https://sprotty.org) — workflow graph visualization
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — browser-based DSL editing

## Repository Structure

```
experiments/   Weekly Jupyter notebooks
paper/         IEEE conference paper drafts
src/           DSL grammar and prototype source code
docs/          Project documentation
```
