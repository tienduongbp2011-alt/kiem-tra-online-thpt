import { createClient } from '@supabase/supabase-js';
import { GradeLevel } from './types';

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

function normalizeGrade(raw: unknown): GradeLevel {
  const str = String(raw ?? '').replace(/[^0-9]/g, '');
  if (str === '11') return '11';
  if (str === '12') return '12';
  return '10';
}

/**
 * Normalizes a database row from Supabase for a specific table so that
 * no property is ever undefined/null when rendered by React components,
 * whether the row came from `data` JSONB or pre-existing relational columns.
 */
function normalizeRowForTable<T>(
  tableName: SupabaseTableName,
  row: Record<string, unknown>
): T {
  const nestedData =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};

  const m: Record<string, unknown> = {
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
    shuffle_questions: 'shuffleQuestions',
    shuffle_answers: 'shuffleAnswers',
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
    if (m[camel] === undefined && m[snake] !== undefined) {
      m[camel] = m[snake];
    }
  }

  const nowIso = new Date().toISOString();
  const safeId = String(m.id ?? m.examId ?? `id_${Date.now()}`);

  if (tableName === 'classes') {
    const code = String(m.code ?? m.class_code ?? m.ma_lop ?? m.name ?? safeId);
    const name = String(m.name ?? m.class_name ?? m.ten_lop ?? `Lớp ${code}`);
    return {
      ...m,
      id: safeId,
      code,
      name,
      grade: normalizeGrade(m.grade ?? m.khoi ?? code),
      academicYear: String(m.academicYear ?? m.academic_year ?? m.nam_hoc ?? '2026 - 2027'),
      homeroomTeacher: String(
        m.homeroomTeacher ?? m.homeroom_teacher ?? m.teacher_name ?? 'Nguyễn Tiến Dương'
      ),
      studentCount: Number(m.studentCount ?? m.student_count ?? m.si_so ?? 0) || 0,
      description: String(m.description ?? m.mo_ta ?? ''),
      isDemo: Boolean(m.isDemo ?? false),
      ownerId: String(m.ownerId ?? 'teacher_nguyen_tien_duong'),
      createdAt: String(m.createdAt ?? nowIso),
      updatedAt: String(m.updatedAt ?? nowIso),
    } as unknown as T;
  }

  if (tableName === 'students') {
    const studentCode = String(
      m.studentCode ?? m.student_code ?? m.code ?? m.ma_hs ?? m.username ?? safeId
    );
    const fullName = String(
      m.fullName ?? m.full_name ?? m.name ?? m.ho_ten ?? m.student_name ?? 'Học sinh'
    );
    const className = String(
      m.className ?? m.class_name ?? m.lop ?? m.class ?? 'Lớp 10A1'
    );
    return {
      ...m,
      id: safeId,
      studentCode,
      fullName,
      birthDate: String(m.birthDate ?? m.birth_date ?? m.dob ?? m.ngay_sinh ?? ''),
      classId: String(m.classId ?? m.class_id ?? m.lop_id ?? ''),
      className,
      grade: normalizeGrade(m.grade ?? m.khoi ?? className),
      accountStatus:
        m.accountStatus === 'suspended' || m.status === 'inactive' ? 'suspended' : 'active',
      loginCode: String(m.loginCode ?? m.login_code ?? m.username ?? studentCode.toLowerCase()),
      studentUid: String(m.studentUid ?? safeId),
      avgScore: Number(m.avgScore ?? m.avg_score ?? m.diem_tb ?? 0) || 0,
      completedExamsCount: Number(m.completedExamsCount ?? 0) || 0,
      weakTopics: String(m.weakTopics ?? ''),
      isDemo: Boolean(m.isDemo ?? false),
      ownerId: String(m.ownerId ?? 'teacher_nguyen_tien_duong'),
      createdAt: String(m.createdAt ?? nowIso),
      updatedAt: String(m.updatedAt ?? nowIso),
    } as unknown as T;
  }

  if (tableName === 'question_bank') {
    return {
      ...m,
      id: safeId,
      code: String(m.code ?? safeId),
      grade: normalizeGrade(m.grade),
      textbook: String(m.textbook ?? 'Kết nối tri thức với cuộc sống'),
      topic: String(m.topic ?? 'Chủ đề chung'),
      lesson: String(m.lesson ?? ''),
      knowledgeUnit: String(m.knowledgeUnit ?? ''),
      cognitiveLevel: (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'].includes(
        String(m.cognitiveLevel)
      )
        ? m.cognitiveLevel
        : 'Nhận biết') as string,
      questionType: (['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(
        String(m.questionType)
      )
        ? m.questionType
        : 'multiple_choice') as string,
      content: String(m.content ?? m.question ?? ''),
      codeSnippet: String(m.codeSnippet ?? ''),
      options: Array.isArray(m.options) ? m.options.map(String) : [],
      subItems: Array.isArray(m.subItems) ? m.subItems : [],
      correctAnswer: String(m.correctAnswer ?? 'A'),
      explanation: String(m.explanation ?? ''),
      gradingGuide: String(m.gradingGuide ?? ''),
      points: Number(m.points ?? 0.25) || 0.25,
      tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
      isApproved: m.isApproved !== undefined ? Boolean(m.isApproved) : true,
      isDemo: Boolean(m.isDemo ?? false),
      ownerId: String(m.ownerId ?? 'teacher_nguyen_tien_duong'),
      createdAt: String(m.createdAt ?? nowIso),
      updatedAt: String(m.updatedAt ?? nowIso),
    } as unknown as T;
  }

  if (tableName === 'exams') {
    const questionsSanitized = Array.isArray(m.questionsSanitized) ? m.questionsSanitized : [];
    return {
      ...m,
      id: safeId,
      code: String(m.code ?? safeId),
      title: String(m.title ?? m.name ?? 'Đề kiểm tra Tin học'),
      category: String(m.category ?? 'Kiểm tra thường xuyên'),
      grade: normalizeGrade(m.grade),
      topic: String(m.topic ?? 'Tổng hợp'),
      durationMinutes: Number(m.durationMinutes ?? 45) || 45,
      totalPoints: Number(m.totalPoints ?? 10) || 10,
      status: String(m.status ?? 'open'),
      matrixRows: Array.isArray(m.matrixRows) ? m.matrixRows : [],
      questionsSanitized,
      questionCount: Number(m.questionCount ?? questionsSanitized.length) || 0,
      shuffleQuestions: m.shuffleQuestions !== undefined ? Boolean(m.shuffleQuestions) : true,
      shuffleAnswers: m.shuffleAnswers !== undefined ? Boolean(m.shuffleAnswers) : true,
      isDemo: Boolean(m.isDemo ?? false),
      ownerId: String(m.ownerId ?? 'teacher_nguyen_tien_duong'),
      createdAt: String(m.createdAt ?? nowIso),
      updatedAt: String(m.updatedAt ?? nowIso),
    } as unknown as T;
  }

  if (tableName === 'assignments') {
    return {
      ...m,
      id: safeId,
      examId: String(m.examId ?? ''),
      examTitle: String(m.examTitle ?? m.title ?? 'Bài kiểm tra Tin học'),
      examCategory: String(m.examCategory ?? 'Kiểm tra thường xuyên'),
      classId: String(m.classId ?? ''),
      className: String(m.className ?? 'Lớp học'),
      grade: normalizeGrade(m.grade),
      startTime: String(m.startTime ?? nowIso.slice(0, 16)),
      dueTime: String(m.dueTime ?? nowIso.slice(0, 16)),
      durationMinutes: Number(m.durationMinutes ?? 45) || 45,
      maxAttempts: Number(m.maxAttempts ?? 1) || 1,
      resultReleaseMode: String(m.resultReleaseMode ?? 'immediate'),
      showAnswersAfterSubmit: Boolean(m.showAnswersAfterSubmit ?? true),
      shuffleQuestions: m.shuffleQuestions !== undefined ? Boolean(m.shuffleQuestions) : true,
      shuffleAnswers: m.shuffleAnswers !== undefined ? Boolean(m.shuffleAnswers) : true,
      status: m.status === 'closed' ? 'closed' : 'open',
      questionsSnapshot: Array.isArray(m.questionsSnapshot) ? m.questionsSnapshot : [],
      isDemo: Boolean(m.isDemo ?? false),
      ownerId: String(m.ownerId ?? 'teacher_nguyen_tien_duong'),
      createdAt: String(m.createdAt ?? nowIso),
      updatedAt: String(m.updatedAt ?? nowIso),
    } as unknown as T;
  }

  if (tableName === 'submissions') {
    return {
      ...m,
      id: safeId,
      assignmentId: String(m.assignmentId ?? ''),
      examId: String(m.examId ?? ''),
      examTitle: String(m.examTitle ?? 'Bài kiểm tra'),
      studentId: String(m.studentId ?? ''),
      studentCode: String(m.studentCode ?? 'HS'),
      studentName: String(m.studentName ?? 'Học sinh'),
      studentUid: String(m.studentUid ?? ''),
      classId: String(m.classId ?? ''),
      className: String(m.className ?? 'Lớp'),
      grade: normalizeGrade(m.grade),
      attemptNumber: Number(m.attemptNumber ?? 1) || 1,
      startedAt: String(m.startedAt ?? nowIso),
      submittedAt: String(m.submittedAt ?? nowIso),
      status: String(m.status ?? 'Đã chấm'),
      gradingStatus: String(m.gradingStatus ?? 'graded'),
      answersMap:
        m.answersMap && typeof m.answersMap === 'object' ? m.answersMap : {},
      objectiveScore: Number(m.objectiveScore ?? 0) || 0,
      essayScore: Number(m.essayScore ?? 0) || 0,
      totalScore: Number(m.totalScore ?? 0) || 0,
      teacherFeedback: String(m.teacherFeedback ?? ''),
      gradeHistory: Array.isArray(m.gradeHistory) ? m.gradeHistory : [],
      isDemo: Boolean(m.isDemo ?? false),
      ownerId: String(m.ownerId ?? 'teacher_nguyen_tien_duong'),
      createdAt: String(m.createdAt ?? nowIso),
      updatedAt: String(m.updatedAt ?? nowIso),
    } as unknown as T;
  }

  m.id = safeId;
  m.createdAt = String(m.createdAt ?? nowIso);
  m.updatedAt = String(m.updatedAt ?? nowIso);
  return m as unknown as T;
}

const LOCAL_CACHE_PREFIX = 'thpt_thanh_hoa_sb_v2_';
const LOCAL_META_PREFIX = 'thpt_thanh_hoa_sb_meta_v2_';

interface TableSyncMeta {
  deletedIds: string[];
  clearedAtMs: number;
}

function getLocalCacheKey(tableName: SupabaseTableName): string {
  return `${LOCAL_CACHE_PREFIX}${tableName}`;
}

function getLocalMetaKey(tableName: SupabaseTableName): string {
  return `${LOCAL_META_PREFIX}${tableName}`;
}

function readTableMeta(tableName: SupabaseTableName): TableSyncMeta {
  try {
    const raw = localStorage.getItem(getLocalMetaKey(tableName));
    if (!raw) return { deletedIds: [], clearedAtMs: 0 };
    const parsed = JSON.parse(raw);
    return {
      deletedIds: Array.isArray(parsed?.deletedIds) ? parsed.deletedIds.map(String) : [],
      clearedAtMs: Number(parsed?.clearedAtMs || 0),
    };
  } catch {
    return { deletedIds: [], clearedAtMs: 0 };
  }
}

function writeTableMeta(tableName: SupabaseTableName, meta: TableSyncMeta): void {
  try {
    localStorage.setItem(getLocalMetaKey(tableName), JSON.stringify(meta));
  } catch {
    // Ignore storage quota errors
  }
}

function readLocalTableMap(tableName: SupabaseTableName): Record<string, Record<string, unknown>> {
  try {
    const raw = localStorage.getItem(getLocalCacheKey(tableName));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, Record<string, unknown>>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeLocalTableMap(
  tableName: SupabaseTableName,
  map: Record<string, Record<string, unknown>>
): void {
  try {
    localStorage.setItem(getLocalCacheKey(tableName), JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function isIgnorableSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toUpperCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    code === '42703' ||
    code === '22P02' ||
    code === '23502' ||
    code === '23503' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes(' could not find the ') ||
    msg.includes('schema cache') ||
    msg.includes('column') ||
    msg.includes('uuid') ||
    msg.includes('not-null') ||
    msg.includes('foreign key')
  );
}

export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  errorMessage?: string;
}> {
  try {
    const [clsRes, stRes, qbRes] = await Promise.all([
      supabase.from('classes').select('*').limit(1),
      supabase.from('students').select('*').limit(1),
      supabase.from('question_bank').select('*').limit(1),
    ]);

    const firstError = clsRes.error || stRes.error || qbRes.error;
    if (!firstError) {
      return { connected: true, tablesReady: true };
    }

    if (isIgnorableSchemaError(firstError)) {
      return {
        connected: true,
        tablesReady: false,
        errorMessage:
          'Đã kết nối Supabase, một số bảng (như students, question_bank) chưa được tạo trên Supabase. Hệ thống đang tự động lưu an toàn trên trình duyệt và sẽ đồng bộ ngay khi bạn chạy lệnh SQL.',
      };
    }

    return {
      connected: false,
      tablesReady: false,
      errorMessage: `Lỗi truy vấn Supabase: ${firstError.message} (${firstError.code || ''})`,
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
  const localMap = readLocalTableMap(tableName);
  const meta = readTableMeta(tableName);
  const deletedSet = new Set(meta.deletedIds);

  // Filter localMap against tombstones first
  for (const key of Object.keys(localMap)) {
    if (deletedSet.has(key)) {
      delete localMap[key];
    }
  }
  const localValues = Object.values(localMap);

  try {
    const { data, error } = await supabase.from(tableName).select('*');

    if (error) {
      if (isIgnorableSchemaError(error)) {
        return localValues.map((row) => normalizeRowForTable<T>(tableName, row));
      }
      throw new Error(`[Supabase ${tableName}] ${error.message}`);
    }

    const rawRemoteRows = (data || []) as Record<string, unknown>[];
    const validRemoteRows: T[] = [];

    for (const rawRow of rawRemoteRows) {
      const normalized = normalizeRowForTable<T>(tableName, rawRow);
      const rec = normalized as unknown as Record<string, unknown>;
      const id = String(rec.id || '');
      if (!id || deletedSet.has(id)) {
        continue;
      }
      // If table was explicitly cleared (e.g. Excel replace) and this remote row is older than clearedAtMs
      // and not in our new localMap, skip it so stale remote rows never reappear
      if (meta.clearedAtMs > 0 && !localMap[id]) {
        const rowTimeStr = String(
          rawRow.updated_at || rec.updatedAt || rec.createdAt || ''
        );
        const rowTimeMs = rowTimeStr ? new Date(rowTimeStr).getTime() : 0;
        if (!rowTimeMs || rowTimeMs < meta.clearedAtMs) {
          continue;
        }
      }
      validRemoteRows.push(normalized);
    }

    if (validRemoteRows.length > 0) {
      const mergedMap: Record<string, Record<string, unknown>> = { ...localMap };
      for (const r of validRemoteRows) {
        const rec = r as unknown as Record<string, unknown>;
        const id = String(rec.id || '');
        if (id && !deletedSet.has(id)) {
          mergedMap[id] = rec;
        }
      }
      writeLocalTableMap(tableName, mergedMap);
      return Object.values(mergedMap).map((row) => normalizeRowForTable<T>(tableName, row));
    }

    // If remote table has no valid rows, return localValues (and sync them in background if any)
    if (localValues.length > 0) {
      void (async () => {
        for (const item of localValues) {
          const docId = String(item.id || '');
          if (docId && !deletedSet.has(docId)) {
            await supabase
              .from(tableName)
              .upsert(
                {
                  id: docId,
                  data: cleanJsonPayload(item),
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'id' }
              );
          }
        }
      })();
      return localValues.map((row) => normalizeRowForTable<T>(tableName, row));
    }

    return [];
  } catch {
    return localValues.map((row) => normalizeRowForTable<T>(tableName, row));
  }
}

export async function supabaseUpsertDoc(
  tableName: SupabaseTableName,
  docId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const cleaned = cleanJsonPayload(payload);

  // Remove from deletedIds if re-inserting
  const meta = readTableMeta(tableName);
  if (meta.deletedIds.includes(docId)) {
    meta.deletedIds = meta.deletedIds.filter((id) => id !== docId);
    writeTableMeta(tableName, meta);
  }

  // Always save to local mirror immediately so data is never lost
  const localMap = readLocalTableMap(tableName);
  localMap[docId] = { ...cleaned, id: docId };
  writeLocalTableMap(tableName, localMap);

  const { error } = await supabase.from(tableName).upsert(
    {
      id: docId,
      data: cleaned,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error && !isIgnorableSchemaError(error)) {
    throw new Error(`[Supabase lưu ${tableName}/${docId}] ${error.message}`);
  }
}

export async function supabaseDeleteDoc(
  tableName: SupabaseTableName,
  docId: string
): Promise<void> {
  const meta = readTableMeta(tableName);
  if (!meta.deletedIds.includes(docId)) {
    meta.deletedIds.push(docId);
    writeTableMeta(tableName, meta);
  }

  const localMap = readLocalTableMap(tableName);
  delete localMap[docId];
  writeLocalTableMap(tableName, localMap);

  const { error } = await supabase.from(tableName).delete().eq('id', docId);
  if (error && !isIgnorableSchemaError(error)) {
    throw new Error(`[Supabase xóa ${tableName}/${docId}] ${error.message}`);
  }
}

export async function supabaseDeleteAll(tableName: SupabaseTableName): Promise<void> {
  const existingLocal = readLocalTableMap(tableName);
  const meta = readTableMeta(tableName);
  const allDeletedIds = new Set<string>([...meta.deletedIds, ...Object.keys(existingLocal)]);

  // Clear local mirror immediately and mark cleared timestamp
  writeLocalTableMap(tableName, {});
  writeTableMeta(tableName, {
    deletedIds: Array.from(allDeletedIds),
    clearedAtMs: Date.now(),
  });

  try {
    // Fetch existing remote IDs so we can delete both by .in('id', ids) and .not('id', 'is', null)
    // (works for both UUID and TEXT primary keys)
    const { data: remoteRows } = await supabase.from(tableName).select('id');
    const remoteIds = (remoteRows || [])
      .map((r: Record<string, unknown>) => String(r.id || ''))
      .filter(Boolean);

    if (remoteIds.length > 0) {
      remoteIds.forEach((id) => allDeletedIds.add(id));
      writeTableMeta(tableName, {
        deletedIds: Array.from(allDeletedIds),
        clearedAtMs: Date.now(),
      });
      await supabase.from(tableName).delete().in('id', remoteIds);
    }

    const { error } = await supabase.from(tableName).delete().not('id', 'is', null);
    if (error && !isIgnorableSchemaError(error)) {
      throw new Error(`[Supabase xóa toàn bộ ${tableName}] ${error.message}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('[Supabase')) {
      throw err;
    }
  }
}

export const SUPABASE_SETUP_SQL = `-- ============================================================================
-- KỊCH BẢN KHỞI TẠO HOÀN CHỈNH CƠ SỞ DỮ LIỆU SUPABASE (POSTGRESQL)
-- HỆ THỐNG QUẢN LÝ DẠY HỌC VÀ KIỂM TRA TRỰC TUYẾN - TIN HỌC THPT THANH HÒA
-- Giáo viên phụ trách: Nguyễn Tiến Dương
-- Hướng dẫn: Dán toàn bộ nội dung này vào mục SQL Editor trên Supabase và nhấn RUN
-- ============================================================================

-- 1. XÓA BẢNG CŨ LỆCH CẤU TRÚC (NẾU CÓ) ĐỂ TRÁNH XUNG ĐỘT KHÓA NGOẠI / KIỂU UUID
DROP TABLE IF EXISTS
  public.classes,
  public.students,
  public.question_bank,
  public.exams,
  public.exam_answer_keys,
  public.assignments,
  public.submissions,
  public.learning_plans,
  public.learning_resources,
  public.audit_logs,
  public.system_settings
CASCADE;

-- 2. TẠO ĐẦY ĐỦ 11 BẢNG DỮ LIỆU CHUẨN VỚI CỘT id (TEXT) VÀ data (JSONB)
CREATE TABLE public.classes (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.question_bank (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exams (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.exam_answer_keys (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.assignments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.submissions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.learning_plans (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.learning_resources (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.system_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BẬT ROW LEVEL SECURITY (RLS) VÀ CẤP QUYỀN TRUY CẬP CHO ỨNG DỤNG WEB
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

CREATE POLICY "allow_all_classes" ON public.classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_students" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_question_bank" ON public.question_bank FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_exams" ON public.exams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_exam_answer_keys" ON public.exam_answer_keys FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_assignments" ON public.assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_submissions" ON public.submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_learning_plans" ON public.learning_plans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_learning_resources" ON public.learning_resources FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_system_settings" ON public.system_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. CẤP QUYỀN TRUY CẬP SCHEMA PUBLIC VÀ LÀM MỚI BỘ NHỚ ĐỆM SCHEMA CACHE
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
`;

