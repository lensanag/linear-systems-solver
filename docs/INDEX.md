# Documentation Index

## Main Documentation

| Document | Description |
|----------|-------------|
| [README](README.md) | Project overview, quick start, architecture |
| [AGENTS](AGENTS.md) | AI agent guide for contributing |
| [COMPONENTS](COMPONENTS.md) | React component documentation |
| [ENGINES](ENGINES.md) | Numerical algorithm documentation |
| [STORE](STORE.md) | Zustand state management guide |
| [EXPORT_IMPROVEMENTS](EXPORT_IMPROVEMENTS.md) | Export rendering architecture and improvements |

## Quick Links

### For Users
- See [README](README.md) → "Supported Methods" for available algorithms
- Use Examples selector to see pre-built systems
- Export solutions via the menu in the solution panel

### For Developers
- Start with [AGENTS](AGENTS.md) → "Code Conventions"
- Understand [STORE](STORE.md) → "Execute Button Logic"
- Review [ENGINES](ENGINES.md) → "Fraction System"

### For AI Agents
- Read [AGENTS](AGENTS.md) first - it covers:
  - Critical implementation details
  - Common pitfalls to avoid
  - Code conventions
  - Testing guidelines

## File Structure Reference

```
docs/
├── README.md                  # Project overview
├── AGENTS.md                 # AI agent guide (START HERE)
├── COMPONENTS.md             # Component documentation
├── ENGINES.md                # Algorithm documentation
├── STORE.md                  # State management
├── EXPORT_IMPROVEMENTS.md    # Export rendering improvements
└── INDEX.md                  # This file
```

## Common Tasks

### Adding a New Algorithm
1. Read [ENGINES](ENGINES.md) → "Common Interface"
2. Implement in `src/engines/numeric/`
3. See [AGENTS](AGENTS.md) → "Adding a New Algorithm"

### Adding a New Component
1. Review [COMPONENTS](COMPONENTS.md) patterns
2. Follow conventions in [AGENTS](AGENTS.md)
3. Add to appropriate `src/components/` subdirectory

### Modifying State
1. Read [STORE](STORE.md) → "Actions"
2. Understand persistence in [STORE](STORE.md) → "Persistence"
3. Follow matrix action pattern (clear steps)

### Running Tests
```bash
npm run test        # Run all
npm run test:watch  # Watch mode
```
