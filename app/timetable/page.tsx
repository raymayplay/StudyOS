import { CalendarClock, Plus } from "lucide-react";

import { deleteCourseMeeting, saveCourseMeeting } from "@/lib/actions";
import { getCourseMeetings, getCourses } from "@/lib/db";
import { TimetableAssistant } from "@/components/timetable-assistant";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const courses = getCourses();
  const meetings = getCourseMeetings();
  const courseById = new Map(courses.map((course) => [course.id, course]));

  return <div className="space-y-8">
    <header>
      <p className="text-xs uppercase tracking-[0.24em] text-violet-300">Class timetable</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Your weekly class overview</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Import schedules copied from UNIPA, add missing times, or update a class when the timetable changes.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {days.slice(1, 6).map((day, index) => {
        const dayMeetings = meetings.filter((meeting) => meeting.day_of_week === index + 1);
        return <div key={day} className="card min-h-40 rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-white">{day}</h2>
          <div className="mt-3 space-y-2">
            {dayMeetings.length ? dayMeetings.map((meeting) => {
              const course = courseById.get(meeting.course_id);
              return <div key={meeting.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-2 text-xs">
                <p className="font-semibold text-white">{course?.code || "Course"}</p>
                <p className="mt-1 text-slate-300">{meeting.start_time}–{meeting.end_time}</p>
                {meeting.location && <p className="mt-1 text-slate-400">{meeting.location}</p>}
              </div>;
            }) : <p className="text-xs text-slate-500">No scheduled class</p>}
          </div>
        </div>;
      })}
    </section>

    <TimetableAssistant courses={courses.map((course) => ({ id: course.id, code: course.code, name: course.name }))} />

    <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="card rounded-3xl p-5">
        <div className="flex items-center gap-2 text-violet-200"><Plus className="h-5 w-5" /><h2 className="text-lg font-semibold text-white">Add a class time</h2></div>
        {courses.length ? <form action={saveCourseMeeting} className="mt-4 space-y-3">
          <label className="block text-sm text-slate-300">Course
            <select name="course_id" required className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white"><option value="">Choose a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select>
          </label>
          <label className="block text-sm text-slate-300">Day
            <select name="day_of_week" defaultValue="1" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
          </label>
          <div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-300">Start<input name="start_time" type="time" required className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" /></label><label className="text-sm text-slate-300">End<input name="end_time" type="time" required className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" /></label></div>
          <input name="location" placeholder="Room or online link" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" />
          <input name="instructor" placeholder="Instructor" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" />
          <button type="submit" className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">Add to timetable</button>
        </form> : <p className="mt-4 text-sm text-slate-400">Import or create a course first.</p>}
      </div>

      <div className="card rounded-3xl p-5">
        <div className="flex items-center gap-2 text-violet-200"><CalendarClock className="h-5 w-5" /><h2 className="text-lg font-semibold text-white">Adjust class times</h2></div>
        <div className="mt-4 space-y-4">
          {meetings.length ? meetings.map((meeting) => {
            const course = courseById.get(meeting.course_id);
            return <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
              <p className="mb-3 text-sm font-semibold text-white">{course ? `${course.code} · ${course.name}` : "Deleted course"}</p>
              <form action={saveCourseMeeting} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={meeting.id} />
                <select name="course_id" defaultValue={meeting.course_id} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">{courses.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>
                <select name="day_of_week" defaultValue={meeting.day_of_week} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white">{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select>
                <input name="start_time" type="time" defaultValue={meeting.start_time} required className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                <input name="end_time" type="time" defaultValue={meeting.end_time} required className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                <input name="location" defaultValue={meeting.location} placeholder="Room or online link" className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                <input name="instructor" defaultValue={meeting.instructor} placeholder="Instructor" className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
                <button type="submit" className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400">Save</button>
              </form>
              <form action={deleteCourseMeeting} className="mt-2"><input type="hidden" name="id" value={meeting.id} /><button type="submit" className="rounded-xl border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/10">Remove time</button></form>
            </div>;
          }) : <p className="text-sm text-slate-400">No class times yet. Paste UNIPA rows that contain a day and time, or add them here.</p>}
        </div>
      </div>
    </section>
  </div>;
}
