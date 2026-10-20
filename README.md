# StudyOS

StudyOS is a local-first academic workspace for managing courses, deadlines, uploaded lecture notes, and study planning.

## Features

- Course, exam, and assignment management
- Reminder center with assignment completion tracking
- Calendar overview for academic deadlines
- PDF text extraction and AI-generated summaries and topic checklists (Ollama, OpenAI, Anthropic, or Gemini)
- AI learning recommendations that analyze every readable PDF and link topics to YouTube lesson searches
- AI-grounded document questions, study notes, and deadline-aware study plans
- Browser deadline reminders (one day before and on the due date, while StudyOS is open)
- Resource discovery links for YouTube and academic search
- Clearly labeled deadline-based planner fallback when the AI provider is unavailable
- Progress tracking with study sessions
- SQLite persistence

## Screenshots

Screenshots are not included yet. Add sanitized dashboard and document-reader captures under `docs/screenshots/` when available.

## Architecture overview

- `app/` contains Next.js pages, API routes, and server actions.
- `components/` contains the responsive client UI for navigation, PDF reading, charts, and controls.
- `lib/db.ts` owns the local SQLite database and additive schema setup; `data/studyos.db` is local-only.
- `lib/ai/` selects a server-side AI provider, chunks document text, caches summaries by SHA-256, and streams document answers.
- `uploads/` stores PDFs on the host computer. Browser devices access the host over the network; they do not store a second copy.
- `lib/scheduler.ts` provides a local deadline-based plan when AI is unavailable.

Run `npm run lint`, `npm test`, and `npm run build` before committing changes.

## Run StudyOS on a new computer

Install Git and Node.js 20.9 or newer (Node.js 22 LTS is recommended) on the computer that will run StudyOS. Then clone the GitHub repository, install the exact dependencies from the lockfile, and start the app:

```bash
git clone https://github.com/raymayplay/StudyOS.git
cd StudyOS
npm ci
npm run dev
```

Open <http://localhost:3000> on that computer. `npm ci` installs the app's JavaScript and native SQLite dependencies; no global Next.js install is needed. Keep `package-lock.json` with the code and use `npm ci` when setting up or refreshing another computer.

To run a production build instead of the development server:

```bash
npm ci
npm run build
npm run start
```

## Use StudyOS from another device

The computer running StudyOS is the **host**. The host must remain powered on and running the app; devices accessing it in a browser do not need to install Node.js, Git, Ollama, or StudyOS.

1. Connect the host and other device to the same trusted Wi-Fi or wired network.
2. Find the host's private IPv4 address:
   - Windows: run `ipconfig` and find the IPv4 address under the active Wi-Fi or Ethernet adapter.
   - macOS: open **System Settings → Network**, select the active connection, then find its IP address.
   - Linux: run `hostname -I` and use the address for the active local network.
3. On the other device, open `http://<host-ip>:3000`, replacing `<host-ip>` with the host's address. For example: `http://192.168.1.25:3000`.
4. If the page cannot be reached, confirm both devices are on the same network and allow Node.js/port 3000 through the host computer's firewall for **Private networks only**. Do not create a public-network firewall rule or forward port 3000 from your router.

The development and production servers listen on all network interfaces to support this local-network access. The host's IP can change when it reconnects; check it again if the saved URL stops working.

## Use with Tailscale

For remote access, install [Tailscale](https://tailscale.com/download) on the StudyOS host and the devices you use. Sign in to the same tailnet, then run `tailscale serve http://127.0.0.1:3000` on the host. Open the HTTPS address shown by `tailscale serve status` from another device. Tailscale Serve keeps access within your tailnet; do not use Tailscale Funnel or expose port 3000 to the public internet. See the [Tailscale Serve CLI guide](https://tailscale.com/docs/reference/tailscale-cli/serve) for current command options.

## Local AI and reminders

Ollama is the default local provider. Install and start the [Ollama desktop app](https://ollama.com/download) on the **host computer** if you want private local AI features. Download the default model once on that computer:

```bash
ollama pull qwen2.5:3b
```

StudyOS connects to Ollama at `http://127.0.0.1:11434` on the host. Browser devices do not need Ollama installed. If you install and run StudyOS independently on a second computer instead, that computer needs its own Ollama installation and model download to use AI features.

To choose another local Ollama endpoint/model, or an API provider, configure `.env.local`. Set `AI_PROVIDER=ollama`, `openai`, `anthropic`, or `gemini`. For cloud providers, set the matching server-only API key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`) and optionally its model variable. Keep API keys out of `NEXT_PUBLIC_*` variables. Example Ollama settings:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
```

Restart StudyOS after changing environment variables.

From **Resources**, use **Recommend YouTube lessons** to analyze every readable PDF in the library, find connected academic topics, and generate focused YouTube search links. The links open search results, not pre-verified individual videos. AI inference runs through the configured provider; with a cloud provider, prompts and relevant PDF text are sent to that provider. YouTube and academic search links require an internet connection when opened.

Browser reminders are checked while StudyOS is open and send alerts at 9:00 AM on the day before and the due date, after notification permission is granted. Browser notifications may require HTTPS on devices other than the host computer; plain HTTP on a LAN IP may not support them. They do not run when StudyOS is closed.

## Notes

- Data is stored in `data/studyos.db`.
- Uploaded PDFs are saved under `uploads/`.
- The database and uploaded files stay on the computer running StudyOS; connecting another device does not copy them there. Running a separate clone on a second computer starts with separate data. To move existing data, copy the `data` folder and `uploads` folder to the new computer while StudyOS is stopped; keep backups private.
- StudyOS has no sign-in or per-user permissions. Keep it on your device or a trusted private network.
- PDF uploads are limited to 25 MB per request.
