# StudyOS

StudyOS is a local-first academic workspace for managing courses, deadlines, uploaded lecture notes, and study planning.

## Features

- Course, exam, and assignment management
- Reminder center with assignment completion tracking
- Calendar overview for academic deadlines
- PDF text extraction and local Ollama-generated summaries and topic checklists
- AI learning recommendations that analyze every readable PDF and link topics to YouTube lesson searches
- Ollama-grounded document questions, study notes, and deadline-aware study plans
- Browser deadline reminders (one day before and on the due date, while StudyOS is open)
- Resource discovery links for YouTube and academic search
- Clearly labeled deadline-based planner fallback when Ollama is unavailable
- Progress tracking with study sessions
- SQLite persistence

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

## Local AI and reminders

Install and start the [Ollama desktop app](https://ollama.com/download) on the **host computer** if you want local AI features. Download the default model once on that computer:

```bash
ollama pull qwen2.5:3b
```

StudyOS connects to Ollama at `http://127.0.0.1:11434` on the host. Browser devices do not need Ollama installed. If you install and run StudyOS independently on a second computer instead, that computer needs its own Ollama installation and model download to use AI features.

Optionally create `.env.local` in the project folder to select a different local Ollama endpoint or installed model:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
```

Restart StudyOS after changing environment variables.

From **Resources**, use **Recommend YouTube lessons** to analyze every readable PDF in the library, find connected academic topics, and generate focused YouTube search links. The links open search results, not pre-verified individual videos. AI inference and PDF analysis run on the configured Ollama computer. YouTube and academic search links require an internet connection when opened.

Browser reminders are checked while StudyOS is open and send alerts at 9:00 AM on the day before and the due date, after notification permission is granted. Browser notifications may require HTTPS on devices other than the host computer; plain HTTP on a LAN IP may not support them. They do not run when StudyOS is closed.

## Notes

- Data is stored in `data/studyos.db`.
- Uploaded PDFs are saved under `uploads/`.
- The database and uploaded files stay on the computer running StudyOS; connecting another device does not copy them there. Running a separate clone on a second computer starts with separate data. To move existing data, copy the `data` folder and `uploads` folder to the new computer while StudyOS is stopped; keep backups private.
- StudyOS has no sign-in, per-user permissions, or multi-user isolation. Anyone who can reach the app on your network may view and change its data. Only run it on a trusted private network, and do not expose it to the public internet.
- PDF uploads are limited to 25 MB per request.
