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

export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  errorMessage?: string;
}> {
  try {
    const { error } = await supabase.from('classes').select('id').limit(1);
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
          'Đã kết nối thành công tới Supabase (gdoxbonoiumnpiswqris.supabase.co), nhưng cần chạy lệnh SQL khởi tạo các bảng dữ liệu trong Supabase SQL Editor.',
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
  const { data, error } = await supabase
    .from(tableName)
    .select('id, data, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`[Supabase ${tableName}] ${error.message}`);
  }

  return (data || []).map((row: { id: string; data: Record<string, unknown> }) => ({
    ...(row.data || {}),
    id: row.id,
  })) as unknown as T[];
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
-- KỊCH BẢN KHỞI TẠO CƠ SỞ DỮ LIỆU SUPABASE (POSTGRESQL)
-- HỆ THỐNG QUẢN LÝ DẠY HỌC VÀ KIỂM TRA TRỰC TUYẾN - TIN HỌC THPT THANH HÒA
-- Giáo viên phụ trách: Nguyễn Tiến Dương
-- Hướng dẫn: Dán toàn bộ nội dung này vào mục SQL Editor trên Supabase và nhấn RUN
-- ============================================================================

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

-- Bật Row Level Security (RLS) và cấp quyền truy cập cho ứng dụng web
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
`;
