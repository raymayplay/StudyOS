"use client";

import { useEffect, useSyncExternalStore } from "react";

type ReminderDeadline = {
  id: string;
  title: string;
  dueDate: string;
  type: string;
};

function subscribeToPermissionChange(onChange: () => void) {
  window.addEventListener("studyos-notification-permission", onChange);
  return () => window.removeEventListener("studyos-notification-permission", onChange);
}

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return "Notification" in window ? Notification.permission : "unsupported";
}

function getServerPermissionSnapshot(): NotificationPermission {
  return "default";
}

function notifyPermissionChange() {
  window.dispatchEvent(new Event("studyos-notification-permission"));
}

export function ReminderNotificationStatus() {
  const permission = useSyncExternalStore(
    subscribeToPermissionChange,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  );

  async function enableNotifications() {
    if (!("Notification" in window)) {
      notifyPermissionChange();
      return;
    }
    await Notification.requestPermission();
    notifyPermissionChange();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-white">Browser notifications</p>
        <p className="mt-1 text-sm text-slate-400">
          {permission === "granted"
            ? "Enabled. Alerts are checked while StudyOS is open."
            : permission === "denied"
              ? "Blocked by the browser. Allow notifications for StudyOS in browser settings."
              : permission === "unsupported"
                ? "This browser does not support notifications."
                : "Not enabled yet. StudyOS checks for reminders while the app is open."}
        </p>
      </div>
      {permission === "default" && (
        <button
          type="button"
          onClick={enableNotifications}
          className="w-fit rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
        >
          Enable alerts
        </button>
      )}
    </div>
  );
}

export function DeadlineReminders({ deadlines }: { deadlines: ReminderDeadline[] }) {
  const permission = useSyncExternalStore(
    subscribeToPermissionChange,
    getPermissionSnapshot,
    getServerPermissionSnapshot,
  );

  useEffect(() => {
    if (permission !== "granted") return;

    function checkDeadlines() {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      for (const deadline of deadlines) {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline.dueDate);
        const dueDate = match
          ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
          : new Date(deadline.dueDate);
        if (Number.isNaN(dueDate.getTime())) continue;

        const daysAway = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
        const stage = daysAway === 1 ? "day-before" : daysAway === 0 ? "due-today" : null;
        if (!stage || now.getHours() < 9) continue;

        const storageKey = `studyos.deadline-reminder:${deadline.id}:${deadline.dueDate.slice(0, 10)}:${stage}`;
        if (localStorage.getItem(storageKey)) continue;

        const dueLabel = dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const title = stage === "due-today" ? "Deadline today" : "Deadline tomorrow";
        new Notification(title, {
          body: `${deadline.type}: ${deadline.title} · due ${dueLabel}`,
          tag: storageKey,
        });
        localStorage.setItem(storageKey, "sent");
      }
    }

    checkDeadlines();
    const intervalId = window.setInterval(checkDeadlines, 60_000);
    return () => window.clearInterval(intervalId);
  }, [deadlines, permission]);

  if (permission === "granted") return null;

  if (permission === "unsupported") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-amber-400/25 bg-slate-950/95 p-4 text-sm text-slate-200 shadow-xl">
        This browser does not support deadline notifications.
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-amber-400/25 bg-slate-950/95 p-4 text-sm text-slate-200 shadow-xl">
        Deadline reminders are blocked. Allow notifications for StudyOS in your browser settings to enable them.
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-violet-400/30 bg-slate-950/95 p-4 shadow-xl">
      <p className="text-sm font-semibold text-white">Get deadline reminders</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">
        Browser notifications arrive the day before and on the morning of each deadline while StudyOS is open.
      </p>
      <button
        type="button"
        onClick={async () => {
          if (!("Notification" in window)) {
            notifyPermissionChange();
            return;
          }
          await Notification.requestPermission();
          notifyPermissionChange();
        }}
        className="mt-3 rounded-full bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400"
      >
        Enable reminders
      </button>
      {deadlines.length === 0 && <p className="mt-2 text-xs text-slate-400">Add a deadline to receive your first reminder.</p>}
    </div>
  );
}
