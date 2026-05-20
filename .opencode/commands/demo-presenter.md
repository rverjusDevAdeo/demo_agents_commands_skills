---
description: Generates a structured presentation card for an animal passed as argument.
agent: demo-english
---

# Demo Presenter

Produce a **presentation card** for the animal passed as argument.
The content language depends on the agent running the command, and the output format (YAML, JSON, markdown, ...) depends on the active skill.

## Variables

ANIMAL: $ARGUMENTS

## Guardrail

- If `ANIMAL` is empty, STOP immediately and ask the user to provide an animal as argument (e.g. `/demo-presenter cat`).

## Card schema

Whatever the output format, the card must contain **exactly these 4 fields**:

- `name`: the animal's name
- `habitat`: where it lives (1 sentence)
- `diet`: what it eats (1 sentence)
- `fun_facts`: a list of **3** short anecdotes (1 sentence each)

## Instructions

- Do not add **any extra field** to the schema above.
- Do not change the field order.
- No preamble or conclusion around the card: only the card is output.
- If no format skill is active, use a clear markdown block (headings + list).

## Report

- Output the complete card for `ANIMAL`, and nothing else.
