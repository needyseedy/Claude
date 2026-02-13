# CLAUDE.md

This file provides guidance for AI assistants (and developers) working with the **Claude** repository (`needyseedy/Claude`).

## Repository Overview

This repository is in its initial setup phase. As the project evolves, this document should be updated to reflect the current state of the codebase, tooling, and conventions.

## Project Structure

```
Claude/
├── CLAUDE.md          # AI assistant guidance and project conventions
└── (additional files to be added as the project develops)
```

## Development Workflow

### Branch Naming

- Feature branches follow the pattern: `claude/<description>-<id>`
- Always develop on feature branches; never push directly to `main`

### Commit Conventions

- Write clear, descriptive commit messages
- Use imperative mood in subject lines (e.g., "Add feature" not "Added feature")
- Keep subject lines under 72 characters
- Use the body for additional context when the change is non-trivial

### Git Practices

- Fetch specific branches when possible: `git fetch origin <branch-name>`
- Push with upstream tracking: `git push -u origin <branch-name>`
- Keep commits atomic — one logical change per commit

## Build & Test

> **Note:** No build system or test framework has been configured yet. Update this section when tooling is added.

When build and test tooling is set up, document:
- How to install dependencies
- How to run the build
- How to run tests (unit, integration, e2e)
- How to lint and format code

## Code Conventions

> **Note:** Establish and document conventions here as code is added to the repository.

Recommended baseline conventions:
- Prefer clarity over cleverness
- Keep functions small and focused
- Name variables and functions descriptively
- Avoid premature abstraction — wait until a pattern repeats before extracting

## AI Assistant Guidelines

When working in this repository, AI assistants should:

1. **Read before writing** — Always read existing files before proposing changes
2. **Stay focused** — Only make changes that are directly requested or clearly necessary
3. **Avoid over-engineering** — Don't add features, refactoring, or "improvements" beyond what was asked
4. **Don't guess** — If something is unclear, ask for clarification
5. **Test changes** — Run available tests and builds after making changes
6. **Update this file** — When adding significant tooling, dependencies, or conventions, update CLAUDE.md to reflect the current state

## Updating This Document

As the project grows, keep this file current by adding:
- New dependencies and how to install them
- Build and test commands
- Architecture decisions and patterns
- File/directory organization rationale
- Environment setup requirements
- CI/CD pipeline details
