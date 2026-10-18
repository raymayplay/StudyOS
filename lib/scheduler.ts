type PlanInput = {
  courses: Array<{ id: string; name: string; code: string; color: string }>;
  exams: Array<{ id: string; title: string; date: string; course_id: string; notes: string }>;
  assignments: Array<{ id: string; title: string; due_date: string; course_id: string; priority: string }>;
  sessions: Array<{ id: string; title: string; course_id: string; scheduled_at: string; status: string }>;
  settings: { start_hour: number; end_hour: number; revision_minutes: number; study_days: string };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeStudySettings(settings: Partial<PlanInput["settings"]> | undefined) {
  const startHour = clamp(Number(settings?.start_hour ?? 9), 6, 18);
  const endHour = clamp(Number(settings?.end_hour ?? 18), Math.max(startHour + 1, 10), 24);
  const revisionMinutes = clamp(Number(settings?.revision_minutes ?? 45), 15, 120);
  const studyDays = (settings?.study_days ?? "Mon,Tue,Wed,Thu,Fri")
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean)
    .join(",");

  return {
    study_days: studyDays || "Mon,Tue,Wed,Thu,Fri",
    start_hour: startHour,
    end_hour: endHour,
    revision_minutes: revisionMinutes,
  };
}

export function buildStudyPlan(input: PlanInput, recoveryMode = false) {
  const normalizedSettings = normalizeStudySettings(input.settings);
  const now = new Date();
  const tasks = [
    ...input.exams.map((exam) => ({
      kind: "exam",
      id: exam.id,
      title: exam.title,
      courseId: exam.course_id,
      dueDate: new Date(exam.date),
      priority: 100,
      reason: "Exam date is approaching and should be treated as the highest priority.",
    })),
    ...input.assignments.map((assignment) => ({
      kind: "assignment",
      id: assignment.id,
      title: assignment.title,
      courseId: assignment.course_id,
      dueDate: new Date(assignment.due_date),
      priority: assignment.priority === "High" ? 85 : assignment.priority === "Medium" ? 70 : 55,
      reason: "Assignment deadline is approaching and requires revision time.",
    })),
  ].filter((task) => !Number.isNaN(task.dueDate.getTime()) && task.dueDate >= now);

  tasks.sort((left, right) => {
    if (left.dueDate.getTime() !== right.dueDate.getTime()) {
      return left.dueDate.getTime() - right.dueDate.getTime();
    }
    return right.priority - left.priority;
  });

  const availableDays = normalizedSettings.study_days
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean);

  const hours = Math.max(1, Math.min(12, normalizedSettings.end_hour - normalizedSettings.start_hour));
  const totalAvailableMinutes = availableDays.length * hours * 60;
  const totalNeededMinutes = tasks.reduce((sum, task) => sum + 90 + (task.kind === "exam" ? 45 : 0), 0);
  const warning = totalNeededMinutes > totalAvailableMinutes;

  const suggestions = tasks.slice(0, recoveryMode ? 5 : 4).map((task, index) => {
    const course = input.courses.find((entry) => entry.id === task.courseId);
    const date = new Date(task.dueDate);
    const sessionLength = task.kind === "exam" ? 120 : 90;
    const dayOffset = recoveryMode ? index + 1 : index + 2;
    const candidate = new Date(date);
    candidate.setDate(candidate.getDate() - Math.max(1, dayOffset));
    candidate.setHours(normalizedSettings.start_hour, 0, 0, 0);
    const dueDateLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      id: `${task.kind}-${task.id}`,
      title: `${task.kind === "exam" ? "Exam prep" : "Assignment push"}: ${task.title}`,
      courseName: course?.name ?? "General study",
      dueDate: dueDateLabel,
      duration: sessionLength,
      start: candidate.toISOString(),
      priority: task.priority,
      reason: `${task.reason} Suggested ${sessionLength} minutes before ${dueDateLabel}.`,
      warning: warning ? "This deadline may require more than the current available time." : undefined,
    };
  });

  const revisionMinutes = normalizedSettings.revision_minutes || 45;
  const practiceBlock = {
    id: "revision-block",
    title: "Revision and practice block",
    courseName: "Integrated study",
    dueDate: "Flexible",
    duration: revisionMinutes,
    start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    reason: "Keep time for spaced revision and practice problems after each study block.",
  };

  return {
    warning,
    totalAvailableMinutes,
    totalNeededMinutes,
    suggestions: [...suggestions, practiceBlock],
    recoveryMode,
  };
}
