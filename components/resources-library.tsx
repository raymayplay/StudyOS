import { getCourses, getDocuments, getDocumentNotes, getDocumentQuestions, getDocumentTopics } from "@/lib/db";
import { DocumentReader } from "@/components/document-reader";
import { LibraryVideoRecommendations } from "@/components/library-video-recommendations";
import { ResourceUploadForm, ReanalyzeDocumentForm } from "@/components/resource-controls";
import { AIStatus } from "@/components/ai-status";
import Link from "next/link";

export async function ResourcesLibrary() {
  const courses = getCourses();
  const documents = getDocuments();

  return (
    <div className="space-y-8">
      <header id="resources">
        <p className="text-xs uppercase tracking-[0.24em] text-violet-300">Resources</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Smart document reader</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Upload a PDF to read its extracted text, explore related resources, and let your selected AI provider generate summaries, study topics, answers, and notes.
        </p>
      </header>

      <AIStatus />

      <LibraryVideoRecommendations pdfCount={documents.filter((document) => document.file_name.toLowerCase().endsWith(".pdf")).length} />

      <section className="card rounded-3xl p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg text-violet-200">+</div>
          <div>
            <h3 className="text-lg font-semibold text-white">Add a study document</h3>
            <p className="mt-1 text-sm text-slate-400">Choose a course and upload a text-based PDF. You can read it even without AI.</p>
          </div>
        </div>
        {courses.length > 0 ? (
          <ResourceUploadForm courses={courses.map((course) => ({ id: course.id, name: course.name, code: course.code }))} />
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-white/15 p-4">
            <p className="text-sm text-slate-300">Add a course before uploading a document.</p>
            <Link href="/courses" className="mt-3 inline-flex rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">
              Create a course
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {documents.length === 0 ? (
          <div className="card rounded-3xl p-6 xl:col-span-2">
            <p className="text-sm font-semibold text-white">Your library is ready for its first PDF</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Upload a lecture handout or study guide above. Your document and extracted text will appear here.</p>
          </div>
        ) : (
          documents.map((document) => {
            const questions = getDocumentQuestions(document.id);
            const notes = getDocumentNotes(document.id)?.notes || "";
            const topics = getDocumentTopics(document.id);
            const documentName = document.file_name.replace(/\.[^.]+$/, "");
            const generalQuery = encodeURIComponent(`${documentName} educational resources`);
            return (
              <article key={document.id} className="card rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Document</p>
                    <h3 className="mt-2 truncate text-xl font-semibold text-white">{document.file_name}</h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{document.status}</span>
                </div>

                <p className={`mt-3 rounded-xl border px-3 py-3 text-sm leading-6 ${
                  document.analysis_source === "error"
                    ? "border-amber-400/20 bg-amber-500/[0.06] text-amber-100"
                    : "border-white/[0.06] bg-slate-950/30 text-slate-300"
                }`}>
                  {document.analysis_source === "ai"
                    ? document.summary
                    : document.analysis_source === "error"
                      ? `${document.extracted_text ? "PDF text is available. " : ""}${document.summary}`
                      : document.analysis_source === "legacy"
                        ? "This PDF was uploaded before local AI analysis was enabled. Use the button below to analyze it now."
                        : document.analysis_source === "pending"
                          ? "AI analysis is in progress."
                          : "This file is not a supported PDF."}
                </p>

                {document.analysis_source !== "ai" && document.file_name.toLowerCase().endsWith(".pdf") && (
                  <ReanalyzeDocumentForm documentId={document.id} />
                )}

                {topics.length > 0 && (
                  <section className="mt-4 rounded-2xl border border-violet-400/15 bg-violet-500/5 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">AI-generated topics</h4>
                    <ul className="mt-3 space-y-3">
                      {topics.map((topic) => (
                        <li key={topic.id}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-white">{topic.title}</span>
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-300">{topic.difficulty}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{topic.description}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <DocumentReader
                  documentId={document.id}
                  fileName={documentName}
                  extractedText={document.extracted_text || ""}
                  notes={notes}
                  questions={questions}
                  aiAvailable
                />

                <div className="mt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Learn this document&apos;s topics on YouTube</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topics.length > 0 ? topics.map((topic) => {
                      const query = encodeURIComponent(`${topic.title} explained lesson`);
                      return (
                      <a key={topic.id} href={`https://www.youtube.com/results?search_query=${query}`} target="_blank" rel="noreferrer" className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-200 hover:bg-violet-500/20">
                        {topic.title}
                      </a>
                      );
                    }) : (
                      <p className="text-xs text-slate-500">Run AI analysis to get topic-based lesson searches.</p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <a href={`https://scholar.google.com/scholar?q=${generalQuery}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-slate-300 hover:text-white">Academic search</a>
                    <a href={`https://www.google.com/search?q=${generalQuery}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-slate-300 hover:text-white">Article search</a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
