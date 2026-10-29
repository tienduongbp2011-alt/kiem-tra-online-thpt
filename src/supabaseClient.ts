import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_URL =
  import.meta.env.VITE_DATABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://gdoxbonoiumnpiswqris.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_eYFPXHwHldj4nqSombGNaA_ZWDOZRON';

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type SupabaseTableName =
  | 'classes'
  | 'students'
  | 'question_bank'
  | 'exams'
  | 'exam_answer_keys'
  | 'assignments'
  | 'submissions'
  | 'learning_plans'
  | 'learning_resources'
  | 'audit_logs'
  | 'system_settings';

export function cleanJsonPayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Normalizes a database row from Supabase whether it uses the `data` JSONB column
 * or pre-existing relational snake_case/camelCase columns.
 */
function normalizeRow<T>(row: Record<string, unknown>): T {
  const nestedData =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};

  const merged: Record<string, unknown> = {
    ...row,
    ...nestedData,
  };

  // Map common snake_case columns from pre-existing tables to camelCase TypeScript properties
  const snakeToCamelMap: Record<string, string> = {
    student_code: 'studentCode',
    full_name: 'fullName',
    birth_date: 'birthDate',
    class_id: 'classId',
    class_name: 'className',
    academic_year: 'academicYear',
    homeroom_teacher: 'homeroomTeacher',
    student_count: 'studentCount',
    account_status: 'accountStatus',
    login_code: 'loginCode',
    student_uid: 'studentUid',
    avg_score: 'avgScore',
    completed_exams_count: 'completedExamsCount',
    weak_topics: 'weakTopics',
    cognitive_level: 'cognitiveLevel',
    question_type: 'questionType',
    code_snippet: 'codeSnippet',
    image_url: 'imageUrl',
    sub_items: 'subItems',
    correct_answer: 'correctAnswer',
    grading_guide: 'gradingGuide',
    is_approved: 'isApproved',
    duration_minutes: 'durationMinutes',
    total_points: 'totalPoints',
    matrix_rows: 'matrixRows',
    questions_sanitized: 'questionsSanitized',
    question_count: 'questionCount',
    exam_id: 'examId',
    answers_map: 'answersMap',
    explanations_map: 'explanationsMap',
    exam_title: 'examTitle',
    exam_category: 'examCategory',
    start_time: 'startTime',
    due_time: 'dueTime',
    max_attempts: 'maxAttempts',
    result_release_mode: 'resultReleaseMode',
    show_answers_after_submit: 'showAnswersAfterSubmit',
    questions_snapshot: 'questionsSnapshot',
    assignment_id: 'assignmentId',
    student_id: 'studentId',
    student_name: 'studentName',
    attempt_number: 'attemptNumber',
    started_at: 'startedAt',
    submitted_at: 'submittedAt',
    grading_status: 'gradingStatus',
    objective_score: 'objectiveScore',
    essay_score: 'essayScore',
    total_score: 'totalScore',
    teacher_feedback: 'teacherFeedback',
    grade_history: 'gradeHistory',
    question_ids: 'questionIds',
    completed_count: 'completedCount',
    total_students: 'totalStudents',
    due_date: 'dueDate',
    resource_type: 'resourceType',
    external_url: 'externalUrl',
    file_status: 'fileStatus',
    access_level: 'accessLevel',
    actor_name: 'actorName',
    actor_uid: 'actorUid',
    target_id: 'targetId',
    website_name: 'websiteName',
    school_name: 'schoolName',
    teacher_name: 'teacherName',
    subject_name: 'subjectName',
    grading_scale: 'gradingScale',
    default_duration_minutes: 'defaultDurationMinutes',
    default_release_mode: 'defaultReleaseMode',
    owner_id: 'ownerId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };

  for (const [snake, camel] of Object.entries(snakeToCamelMap)) {
    if (merged[camel] === undefined && merged[snake] !== undefined) {
      merged[camel] = merged[snake];
    }
  }

  if (merged.id !== undefined) {
    merged.id = String(merged.id);
  }

  return merged as unknown as T;
}

export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  errorMessage?: string;
}> {
  try {
    const { error } = await supabase.from('classes').select('*').limit(1);
    if (!error) {
      return { connected: true, tablesReady: true };
    }
    const msg = error.message || '';
    const code = error.code || '';
    if (
      code === '42P01' ||
      code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('Could not find the table') ||
      msg.includes('schema cache')
    ) {
      return {
        connected: true,
        tablesReady: false,
        errorMessage:
          'Đã kết nối tới Supabase (gdoxbonoiumnpiswqris.supabase.co), nhưng cần chạy lệnh SQL cập nhật bảng dữ liệu trong Supabase SQL Editor.',
      };
    }
    return {
      connected: false,
      tablesReady: false,
      errorMessage: `Lỗi truy vấn Supabase: ${msg} (${code})`,
    };
  } catch (err) {
    return {
      connected: false,
      tablesReady: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function supabaseFetchAll<T>(tableName: SupabaseTableName): Promise<T[]> {
  // Always select('*') without assuming specific column names so pre-existing tables never fail
  const { data, error } = await supabase.from(tableName).select('*');

  if (error) {
    const msg = error.message || '';
    const code = error.code || '';
    // If an individual table does not exist yet, return empty array instead of crashing the whole app
    if (
      code === '42P01' ||
      code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('Could not find the table') ||
      msg.includes('schema cache')
    ) {
      return [];
    }
    throw new Error(`[Supabase ${tableName}] ${error.message}`);
  }

  const list = (data || []).map((row) => normalizeRow<T>(row as Record<string, unknown>));
  return list;
}

export async function supabaseUpsertDoc(
  tableName: SupabaseTableName,
  docId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const cleaned = cleanJsonPayload(payload);
  const { error } = await supabase.from(tableName).upsert(
    {
      id: docId,
      data: cleaned,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    if (
      error.message.includes('column') &&
      (error.message.includes('data') || error.message.includes('updated_at'))
    ) {
      throw new Error(
        `Bảng "${tableName}" trên Supabase là bảng cũ chưa có cột lưu trữ "data". Vui lòng nhấn nút "Cập nhật Bảng SQL Supabase" trên thanh tiêu đề, sao chép đoạn SQL và nhấn RUN trong Supabase SQL Editor.`
      );
    }
    throw new Error(`[Supabase lưu ${tableName}/${docId}] ${error.message}`);
  }
}

export async function supabaseDeleteDoc(
  tableName: SupabaseTableName,
  docId: string
): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq('id', docId);
  if (error) {
    throw new Error(`[Supabase xóa ${tableName}/${docId}] ${error.message}`);
  }
}

export const SUPABASE_SETUP_SQL = `-- ============================================================================
-- KỊCH BẢN KHỞI TẠO & CẬP NHẬT CƠ SỞ DỮ LIỆU SUPABASE (POSTGRESQL)
-- HỆ THỐNG QUẢN LÝ DẠY HỌC VÀ KIỂM TRA TRỰC TUYẾN - TIN HỌC THPT THANH HÒA
-- Giáo viên phụ trách: Nguyễn Tiến Dương
-- Hướng dẫn: Dán toàn bộ nội dung này vào mục SQL Editor trên Supabase và nhấn RUN
-- (Hỗ trợ cả trường hợp bảng đã tồn tại từ trước và tự động bổ sung cột data JSONB)
-- ============================================================================

-- 1. Tạo bảng nếu chưa có
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_bank (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exams (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_answer_keys (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_plans (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_resources (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tự động bổ sung cột "data" và "updated_at" nếu các bảng đã tồn tại từ trước
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.question_bank ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.exam_answer_keys ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.exam_answer_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.learning_plans ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.learning_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.learning_resources ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.learning_resources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Bật Row Level Security (RLS) và cấp quyền truy cập cho ứng dụng web
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_classes" ON public.classes;
CREATE POLICY "allow_all_classes" ON public.classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_students" ON public.students;
CREATE POLICY "allow_all_students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_question_bank" ON public.question_bank;
CREATE POLICY "allow_all_question_bank" ON public.question_bank FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_exams" ON public.exams;
CREATE POLICY "allow_all_exams" ON public.exams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_exam_answer_keys" ON public.exam_answer_keys;
CREATE POLICY "allow_all_exam_answer_keys" ON public.exam_answer_keys FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_assignments" ON public.assignments;
CREATE POLICY "allow_all_assignments" ON public.assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_submissions" ON public.submissions;
CREATE POLICY "allow_all_submissions" ON public.submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_learning_plans" ON public.learning_plans;
CREATE POLICY "allow_all_learning_plans" ON public.learning_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_learning_resources" ON public.learning_resources;
CREATE POLICY "allow_all_learning_resources" ON public.learning_resources FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_audit_logs" ON public.audit_logs;
CREATE POLICY "allow_all_audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_system_settings" ON public.system_settings;
CREATE POLICY "allow_all_system_settings" ON public.system_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Làm mới bộ nhớ đệm Schema của Supabase PostgREST API
NOTIFY pgrst, 'reload schema';
`;
