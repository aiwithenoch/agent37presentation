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

The viewer is read-only and follows the presenter's current slide through Firebase Realtime Database. The presenter deck keeps the existing keyboard, fullscreen, notes, grid, animation, touch, and Accra-clock behavior. The remote is a compact mobile controller with Previous, Next, Grid, and a current-slide indicator. There is no presenter-key prompt: keep the controller URL private because anyone who has it can change the live slide.

### Required Vercel configuration

Create a Firebase Realtime Database and publish the rules in [`database.rules.json`](database.rules.json). Then add these Vercel environment variables to the production environment:

```text
FIREBASE_DATABASE_URL=https://YOUR_DATABASE.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT_JSON={the complete Firebase service-account JSON}
```

`FIREBASE_SERVICE_ACCOUNT_JSON` is server-only and must never be committed to GitHub or placed in a viewer/controller URL. Firebase's database URL is returned to the browser so viewers can subscribe to the public read-only stream. The database rules intentionally allow public reads but no client writes; the Vercel API route publishes controller changes.

After adding the variables, redeploy the existing Vercel project. Open the presenter or remote URL to control the deck, and share only the `/watch/max-tv` URL with viewers.

For local Firebase rules deployment, the Firebase CLI can use the included `firebase.json` file:

```bash
firebase deploy --only database
```

The deck currently stops after defining the product and mapping its OpenClaw configuration, including working-prompt pairs for each file and optional `TOOLS.md` and `HEARTBEAT.md` extensions: an executive assistant for Franky 5. Later build and testing slides are intentionally omitted until the setup is complete.
