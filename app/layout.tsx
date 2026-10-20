import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { DeadlineReminders } from "@/components/deadline-reminders";
import { getAssignments, getExams } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyOS",
  description: "A university study planning and learning workspace",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const deadlines = [
    ...getExams().map((exam) => ({
      id: `exam-${exam.id}`,
      title: exam.title,
      dueDate: exam.date,
      type: "Exam",
      completed: false,
    })),
    ...getAssignments().map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: assignment.title,
      dueDate: assignment.due_date,
      type: "Assignment",
      completed: Boolean(assignment.is_completed),
    })),
  ].filter((deadline) => !deadline.completed);

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full text-slate-100">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col md:flex-row">
          <Sidebar />
          <main id="main-content" className="min-w-0 flex-1 px-4 pb-8 pt-5 sm:px-6 md:px-8 md:py-8">{children}</main>
        </div>
        <DeadlineReminders deadlines={deadlines} />
      </body>
    </html>
  );
}
