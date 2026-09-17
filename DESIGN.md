# Set Up Your Own AI Agent — Design System

## Direction

A practical AI With Enoch workshop deck: warm paper, deep forest, sage, gold, and a dark technical canvas. The visual language should feel hands-on and teachable, with one clear idea per slide and diagrams that explain the build.

## Typography

- Display: Clash Display, 600–700
- Body and UI: Cabinet Grotesk, 400–800
- Technical labels: JetBrains Mono, 500–600
- Fallbacks: Avenir Next, system sans-serif, and Consolas/SFMono-Regular

## Color tokens

```css
--paper: #fbfaf6;
--paper-deep: #f4f1e9;
--ink: #171c18;
--forest: #18412c;
--forest-2: #245b3d;
--sage: #e4f1e8;
--gold: #daa843;
--coral: #ff6d5a;
--canvas: #111615;
```

## Content rules

- Keep the agent example concrete: enquiry assistant, clear input, visible result.
- Start with one repeated job before adding more tools or memory.
- Treat permissions, approvals, logs, and secrets as part of the build.
- Test the happy path, messy input, and boundary case.
- Keep presenter guidance in `data-notes` attributes rather than on the slide canvas.
