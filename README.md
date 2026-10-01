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

## Remote presentation control

The same deck can be opened in three modes for a named session:

- Viewer: `https://agent37presentation.vercel.app/watch/max-tv`
- Presenter deck: `https://agent37presentation.vercel.app/present/max-tv`
- Mobile remote: `https://agent37presentation.vercel.app/remote/max-tv`

The viewer is read-only and follows the presenter's current slide through the lightweight Agent 37 realtime service. The presenter deck keeps the existing keyboard, fullscreen, notes, grid, animation, touch, and Accra-clock behavior. The remote is a compact mobile controller with Previous, Next, Grid, and a current-slide indicator. There is no presenter-key prompt: keep the controller URL private because anyone who has it can change the live slide.

### Realtime backend

The current production API proxies to the Agent 37 service at:

```text
https://edffdb9736d9a48a900b.agent37.app
```

It serves GET, PUT, and Server-Sent Events for `/sessions/:session.json` on port 3000. The Vercel API route publishes controller changes, and viewers subscribe to the live stream. There are no Vercel environment variables required for the current setup. If the service is moved, set `REALTIME_BACKEND_URL` in the Vercel production environment and redeploy.

Open the presenter or remote URL to control the deck, and share only the `/watch/max-tv` URL with viewers.

The deck currently stops after defining the product and mapping its OpenClaw configuration, including working-prompt pairs for each file and optional `TOOLS.md` and `HEARTBEAT.md` extensions: an executive assistant for Franky 5. Later build and testing slides are intentionally omitted until the setup is complete.
