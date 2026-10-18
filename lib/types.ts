export type Course = {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Exam = {
  id: string;
  course_id: string;
  title: string;
  date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  priority: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type StudySession = {
  id: string;
  course_id: string;
  title: string;
  topic: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  confidence: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRecord = {
  id: string;
  course_id: string;
  file_name: string;
  file_path: string;
  status: string;
  summary: string | null;
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: string;
  document_id: string;
  title: string;
  description: string;
  difficulty: string;
  created_at: string;
};

export type ResourceItem = {
  id: string;
  document_id: string;
  course_id: string;
  topic: string;
  title: string;
  url: string;
  source: string;
  type: string;
  created_at: string;
};

export type Setting = {
  key: string;
  value: string;
};
