# Set Up Your Own AI Agent

An HTML 40-slide workshop presentation built in the same style as the n8n Accra deck.

The platform-choice slide uses researched brand marks and corrected product names. Asset provenance and usage notes are in [LOGO_SOURCES.md](LOGO_SOURCES.md).

The visual system is white-first: light slide canvases, dark forest text, and coral/gold accents. The diagrams, code example, deployment loop, and presenter controls use light tinted panels as well.

Open `index.html` in a browser to present it.

Controls:

- `←` / `→` or `Space`: previous / next slide
- `Home` / `End`: first / last slide
- `G`: slide overview grid
- `P`: presenter notes
- `F`: fullscreen

## Shared live presentation

The production deck is one shared live presentation. Give everyone the same link:

```text
https://agent37presentation.vercel.app/present/max-tv
```

Every open copy can use Previous, Next, keyboard, touch, or Grid. A change on any copy is broadcast to every other copy, and changes made by another viewer move your copy too. The root URL also uses the shared `max-tv` session. The old `/watch/max-tv` and `/remote/max-tv` paths remain as aliases to the same collaborative deck; they are not read-only or separate controllers.

### Realtime backend

The current production API proxies to the Agent 37 service at:

```text
https://edffdb9736d9a48a900b.agent37.app
```

It serves GET, PUT, and Server-Sent Events for `/sessions/:session.json` on port 3000. The Vercel API route publishes navigation from any shared copy, and every copy subscribes to the same live stream. There are no Vercel environment variables required for the current setup. If the service is moved, set `REALTIME_BACKEND_URL` in the Vercel production environment and redeploy.

Keep the Agent 37 realtime service running. There is intentionally no presenter key: anyone who has the shared link can navigate the shared deck.

The deck currently stops after defining the product and mapping its OpenClaw configuration, including working-prompt pairs for each file and optional `TOOLS.md` and `HEARTBEAT.md` extensions: an executive assistant for Franky 5. Later build and testing slides are intentionally omitted until the setup is complete.
