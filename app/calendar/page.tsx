import CalendarView from "@/components/calendar-view";
import { getAssignments, getCourses, getExams } from "@/lib/db";

export default async function CalendarPage() {
  const courses = getCourses();
  const exams = getExams();
  const assignments = getAssignments();

  return <CalendarView courses={courses} exams={exams} assignments={assignments} />;
}
