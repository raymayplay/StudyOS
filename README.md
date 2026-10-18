# StudyOS

StudyOS is a local-first academic workspace for managing courses, deadlines, uploaded lecture notes, and study planning.

## Features

- Course, exam, and assignment management
- Calendar overview for academic deadlines
- PDF upload and text extraction workflow
- Topic checklist generation from uploaded source material
- Resource discovery links for YouTube and academic search
- Study planner with deterministic fallback logic when AI credentials are unavailable
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

## Environment

A local `.env.local` file can be added for future API integrations if desired. The app currently runs without external credentials using deterministic fallback logic.

## Notes

- Data is stored in `data/studyos.db`.
- Uploaded PDFs are saved under `uploads/`.
- The app is designed for local use and does not include multi-user authentication.
