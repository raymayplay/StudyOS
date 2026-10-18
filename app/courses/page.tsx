import {
  createAssignment,
  createCourse,
  createExam,
  deleteAssignment,
  deleteCourse,
  deleteExam,
  updateAssignment,
  updateCourse,
  updateExam,
} from "@/lib/actions";
import { getAssignments, getCourses, getExams } from "@/lib/db";

export default async function CoursesPage() {
  const courses = getCourses();
  const exams = getExams();
  const assignments = getAssignments();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-violet-300">Courses</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Manage classes, exams, and deadlines</h2>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Create course</h3>
          <form action={createCourse} className="mt-4 space-y-3">
            <input name="name" placeholder="Course name" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
            <input name="code" placeholder="Course code" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
            <textarea name="description" placeholder="Description" className="min-h-[100px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" />
            <input type="color" name="color" defaultValue="#8b5cf6" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 p-1" />
            <button type="submit" className="rounded-full bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400">Add course</button>
          </form>
        </div>

        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Add exam</h3>
          <form action={createExam} className="mt-4 space-y-3">
            <select name="course_id" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required>
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <input name="title" placeholder="Exam title" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
            <input type="date" name="date" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
            <textarea name="notes" placeholder="Notes" className="min-h-[80px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" />
            <button type="submit" className="rounded-full bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-400">Save exam</button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Course library</h3>
          <div className="mt-4 space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                <form action={updateCourse} className="space-y-3">
                  <input type="hidden" name="id" value={course.id} />
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: course.color || "#8b5cf6" }} />
                    <input name="name" defaultValue={course.name} className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
                  </div>
                  <input name="code" defaultValue={course.code} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
                  <textarea name="description" defaultValue={course.description} className="min-h-[90px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                  <input type="color" name="color" defaultValue={course.color || "#8b5cf6"} className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/60 p-1" />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-full bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400">Save</button>
                  </div>
                </form>
                <form action={deleteCourse} className="mt-3">
                  <input type="hidden" name="id" value={course.id} />
                  <button type="submit" className="rounded-full border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Delete</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card rounded-3xl p-5">
            <h3 className="text-lg font-semibold text-white">Assignments</h3>
            <form action={createAssignment} className="mt-4 space-y-3">
              <select name="course_id" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required>
                <option value="">Choose a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
              <input name="title" placeholder="Assignment title" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
              <input type="date" name="due_date" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
              <select name="priority" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">
                <option value="High">High</option>
                <option value="Medium" selected>Medium</option>
                <option value="Low">Low</option>
              </select>
              <textarea name="notes" placeholder="Notes" className="min-h-[80px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" />
              <button type="submit" className="rounded-full bg-amber-500 px-4 py-2 font-semibold text-white hover:bg-amber-400">Add assignment</button>
            </form>
          </div>

          <div className="card rounded-3xl p-5">
            <h3 className="text-lg font-semibold text-white">Scheduled exams</h3>
            <div className="mt-4 space-y-3">
              {exams.map((exam) => (
                <div key={exam.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
                  <form action={updateExam} className="space-y-2">
                    <input type="hidden" name="id" value={exam.id} />
                    <select name="course_id" defaultValue={exam.course_id} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>{course.name}</option>
                      ))}
                    </select>
                    <input name="title" defaultValue={exam.title} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
                    <input type="date" name="date" defaultValue={exam.date} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
                    <textarea name="notes" defaultValue={exam.notes} className="min-h-[70px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                    <div className="flex gap-2">
                      <button type="submit" className="rounded-full bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-400">Save</button>
                    </div>
                  </form>
                  <form action={deleteExam} className="mt-2">
                    <input type="hidden" name="id" value={exam.id} />
                    <button type="submit" className="rounded-full border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Delete</button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card rounded-3xl p-5">
        <h3 className="text-lg font-semibold text-white">Assignment list</h3>
        <div className="mt-4 space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-3">
              <form action={updateAssignment} className="space-y-2">
                <input type="hidden" name="id" value={assignment.id} />
                <select name="course_id" defaultValue={assignment.course_id} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
                <input name="title" defaultValue={assignment.title} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
                <input type="date" name="due_date" defaultValue={assignment.due_date} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
                <select name="priority" defaultValue={assignment.priority} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <textarea name="notes" defaultValue={assignment.notes} className="min-h-[70px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                <div className="flex gap-2">
                  <button type="submit" className="rounded-full bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-400">Save</button>
                </div>
              </form>
              <form action={deleteAssignment} className="mt-2">
                <input type="hidden" name="id" value={assignment.id} />
                <button type="submit" className="rounded-full border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
