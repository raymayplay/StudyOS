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

## Local setup

1. Install Node.js 20+.
2. In the project root, run:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

## Local AI and reminders

StudyOS uses Ollama on this computer for PDF analysis, document answers, notes, study plans, and cross-PDF learning recommendations. On the Resources page, use **Recommend YouTube lessons** to analyze the extracted text from every PDF in the library, find connected topics, and generate focused YouTube search links. These links lead to YouTube search results rather than a specific verified video. No API key, cloud account, or external AI request is needed for analysis. Install and start the [Ollama desktop app](https://ollama.com/download), then ensure the fast default model is available with `ollama pull qwen2.5:3b`. StudyOS checks the local Ollama service at `http://127.0.0.1:11434`. `OLLAMA_BASE_URL` and `OLLAMA_MODEL` can optionally be set in `.env.local` to select a different local service or model. PDF text stays on this computer.

StudyOS asks once for browser-notification permission. After permission is granted, it checks deadlines automatically while the app is open and sends reminders at 9:00 AM on the day before and the due date. Browser notifications do not run when StudyOS is closed.

## Notes

- Data is stored in `data/studyos.db`.
- Uploaded PDFs are saved under `uploads/`.
- The app is designed for local use and does not include multi-user authentication.
