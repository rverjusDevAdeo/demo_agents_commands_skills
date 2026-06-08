---
description: Analyze a directory or Python package in depth and generate exhaustive markdown documentation saved to docs/
agent: plan
model: github-copilot/claude-opus-4.5
---

# Document Package

Execute the `Workflow` step by step then `Report` the results.

## Purpose

Deep-analyze a directory or Python package and produce an exhaustive markdown reference document explaining its
structure, responsibilities, public API, internal logic, dependencies, and usage patterns. The output is saved to
`docs/<package-name>.md` and is intended to be read by a developer who is new to the code.

## Variables

TARGET_PATH: $1
OUTPUT_DIR: docs/

## Instructions

- If no `TARGET_PATH` is provided, STOP immediately and ask the user.
- If `TARGET_PATH` does not exist, STOP and report the error.
- Analyze EVERY file in the target — do not skip files, do not sample.
- Document what the code DOES, not just what it contains. Explain intent and behavior.
- For Python packages: detect `__init__.py`, public exports, entry points, and internal submodules.
- Identify design patterns, architectural choices, and non-obvious decisions worth explaining.
- Never invent behavior — only document what is actually present in the code.
- The output document must be self-contained: a reader should not need to open the source to understand the package.

## Workflow

1. **Validate Input** — Check that `TARGET_PATH` exists. Determine whether it is a Python package (contains
   `__init__.py`), a generic Python directory, or a mixed directory.

2. **Map Structure** — Run `find` or `glob` to list all files recursively. Build a complete file tree. Identify:
   - Total file count and types (`.py`, `.yaml`, `.toml`, `.json`, etc.)
   - Top-level modules and subpackages
   - Entry points (`main.py`, `__main__.py`, CLI definitions, etc.)
   - Configuration files (`pyproject.toml`, `setup.cfg`, `requirements*.txt`, etc.)

3. **Analyze Dependencies** — Read `pyproject.toml`, `setup.cfg`, or `requirements*.txt` if present. Extract:
   - External dependencies and their declared versions
   - Optional / dev dependency groups
   - Internal cross-module imports (using `grep` for `from . import`, `from .. import`, etc.)

4. **Deep-Read All Source Files** — For each `.py` file, read and extract:
   - Module-level docstring and purpose
   - All classes: their responsibilities, attributes, methods (public and private), base classes
   - All functions: signature, parameters, return type, side effects, notable behavior
   - Module-level constants and their role
   - Exception classes and when they are raised
   - Any use of decorators, metaclasses, or advanced patterns worth noting

5. **Identify Public API** — If a Python package, read `__init__.py` and determine what is exported. Cross-reference
   with actual definitions to document the intended public surface vs. internal implementation.

6. **Trace Key Flows** — Identify 2–5 representative workflows or code paths through the package (e.g., "how a request
   is processed", "how a model is trained", "how a task is dispatched"). Describe each flow step by step referencing
   actual functions and classes.

7. **Detect Patterns & Decisions** — Note architectural choices: use of abstract base classes, factory patterns,
   dependency injection, async vs. sync, error handling strategy, logging conventions, etc.

8. **Compose Documentation** — Assemble the markdown document using the structure defined in `Output Format` below.
   Write in clear, precise technical prose. Use code examples from the actual source where they aid understanding.

9. **Ensure Output Directory** — Run `mkdir -p docs/` to ensure the output directory exists.

10. **Save Document** — Derive the document filename from the directory or package name (kebab-case). Write the
    completed document to `docs/<package-name>.md`.

## Output Format

The generated markdown document must follow this structure:

```markdown
# <Package / Directory Name>

> One-sentence summary of what this package does and its role in the project.

## Overview

[2–4 paragraphs explaining purpose, context, and design philosophy.]

## Directory Structure

[Annotated file tree: each file or directory with a short inline description.]

## Dependencies

### External
[Table: dependency | version | purpose]

### Internal
[Which internal modules depend on which, and why.]

## Public API

[For each exported symbol: signature, description, usage example.]

## Modules

### `module_name.py`

**Purpose:** [One sentence.]

**Classes:**
- `ClassName` — [Responsibility, key methods, usage.]

**Functions:**
- `function_name(param: type) -> return_type` — [What it does, side effects, exceptions raised.]

**Constants:**
- `CONSTANT_NAME` — [Role and value if relevant.]

[Repeat for each module.]

## Key Flows

### Flow 1: <Name>
[Step-by-step description referencing actual functions/classes.]

### Flow 2: <Name>
[...]

## Architectural Notes

[Design patterns, non-obvious decisions, trade-offs, known limitations.]

## Usage Examples

[2–3 concrete, runnable examples showing how to use the package.]
```

## Report

```
Documentation Generated
───────────────────────
Target:   {TARGET_PATH}
Output:   docs/{package-name}.md
Files analyzed: {N} files ({M} Python modules)

Sections written:
  ✅ Overview
  ✅ Directory Structure
  ✅ Dependencies ({external} external, {internal} internal links)
  ✅ Public API ({N} exported symbols)
  ✅ Modules ({N} modules documented)
  ✅ Key Flows ({N} flows traced)
  ✅ Architectural Notes
  ✅ Usage Examples

Next: Review docs/{package-name}.md and run /explain_package on other packages to build your docs/ index.
```
