import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Database,
  FileText,
  ClipboardCheck,
  BarChart3,
  CalendarCheck,
  Sparkles,
  BookOpen,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Cloud,
  AlertCircle,
  Menu,
  X,
  RefreshCw,
  Copy,
  CheckCircle2,
  ExternalLink,
  Terminal,
} from 'lucide-react';
import {
  supabase,
  SUPABASE_PROJECT_URL,
  SUPABASE_SETUP_SQL,
  checkSupabaseStatus,
  supabaseFetchAll,
  supabaseUpsertDoc,
  supabaseDeleteDoc,
  supabaseDeleteAll,
} from './supabaseClient';
import {
  Assignment,
  AuditLogItem,
  ClassRoom,
  Exam,
  ExamAnswerKey,
  LearningPlan,
  LearningResource,
  MenuTabId,
  NotificationItem,
  Question,
  Student,
  Submission,
  SystemSetting,
} from './types';
import { DEFAULT_SYSTEM_SETTINGS } from './data/demoSeedData';
import { SchoolBookTechLogo, TeacherAvatarSvg } from './components/BrandIllustrations';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ClassesAndStudentsView } from './components/ClassesAndStudentsView';
import { QuestionBankView } from './components/QuestionBankView';
import { ExamsAndMatrixView } from './components/ExamsAndMatrixView';
import { StudentExamPortal } from './components/StudentExamPortal';
import { SubmissionsAndGradingView } from './components/SubmissionsAndGradingView';
import { ReportsAndAnalyticsView } from './components/ReportsAndAnalyticsView';
import {
  AiAssistantView,
  LearningPlansView,
  ResourcesView,
  SystemSettingsView,
} from './components/OtherModulesView';

interface NavMenuItem {
  id: MenuTabId;
  label: string;
  icon: React.FC<{ className?: string }>;
  teacherOnly?: boolean;
}

const MENU_ITEMS: NavMenuItem[] = [
  { id: 'overview', label: '1. Tổng quan', icon: LayoutDashboard },
  { id: 'classes_students', label: '2. Lớp học và học sinh', icon: Users },
  { id: 'question_bank', label: '3. Ngân hàng câu hỏi', icon: Database, teacherOnly: true },
  { id: 'exams', label: '4. Đề kiểm tra', icon: FileText, teacherOnly: true },
  { id: 'student_portal', label: '5. Kiểm tra trực tuyến (HS)', icon: PlayCircle },
  { id: 'submissions', label: '6. Bài làm học sinh', icon: ClipboardCheck, teacherOnly: true },
  { id: 'reports', label: '7. Báo cáo kết quả', icon: BarChart3, teacherOnly: true },
  { id: 'learning_plans', label: '8. Kế hoạch ôn tập', icon: CalendarCheck },
  { id: 'ai_assistant', label: '9. Trợ lý AI', icon: Sparkles, teacherOnly: true },
  { id: 'resources', label: '10. Tài liệu - Học liệu', icon: BookOpen },
  { id: 'settings', label: '11. Cài đặt hệ thống', icon: Settings, teacherOnly: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MenuTabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Role State
  const [roleViewMode, setRoleViewMode] = useState<'teacher' | 'student'>('teacher');

  // Supabase Connection & Schema Readiness State
  const [sbConnected, setSbConnected] = useState<boolean>(false);
  const [sbTablesReady, setSbTablesReady] = useState<boolean>(false);
  const [sbChecking, setSbChecking] = useState<boolean>(true);
  const [sbStatusMsg, setSbStatusMsg] = useState<string>('Đang kết nối tới cơ sở dữ liệu Supabase...');
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Notifications dropdown
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Supabase Real Data State
  const [cloudClasses, setCloudClasses] = useState<ClassRoom[]>([]);
  const [cloudStudents, setCloudStudents] = useState<Student[]>([]);
  const [cloudQuestions, setCloudQuestions] = useState<Question[]>([]);
  const [cloudExams, setCloudExams] = useState<Exam[]>([]);
  const [cloudAnswerKeys, setCloudAnswerKeys] = useState<ExamAnswerKey[]>([]);
  const [cloudAssignments, setCloudAssignments] = useState<Assignment[]>([]);
  const [cloudSubmissions, setCloudSubmissions] = useState<Submission[]>([]);
  const [cloudPlans, setCloudPlans] = useState<LearningPlan[]>([]);
  const [cloudResources, setCloudResources] = useState<LearningResource[]>([]);
  const [cloudLogs, setCloudLogs] = useState<AuditLogItem[]>([]);
  const [cloudSettings, setCloudSettings] = useState<SystemSetting>(DEFAULT_SYSTEM_SETTINGS);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      title: 'Hệ thống Tin học THPT Thanh Hòa đã kết nối Supabase',
      message: `Đang sử dụng cơ sở dữ liệu PostgreSQL trên Supabase (${SUPABASE_PROJECT_URL}).`,
      targetRole: 'all',
      isRead: false,
      ownerId: 'system',
      createdAt: '2026-10-28T08:00:00.000Z',
      updatedAt: '2026-10-28T08:00:00.000Z',
    },
  ]);

  const [preselectedQuestionsForExam, setPreselectedQuestionsForExam] = useState<Question[]>([]);
  const [activeStudentIdForPortal, setActiveStudentIdForPortal] = useState<string>('');
  const [appAlert, setAppAlert] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  const loadAllDataFromSupabase = useCallback(async () => {
    setSbChecking(true);
    const status = await checkSupabaseStatus();
    setSbConnected(status.connected);
    setSbTablesReady(status.tablesReady);

    if (!status.connected) {
      setSbStatusMsg(status.errorMessage || 'Không thể kết nối tới Supabase.');
      setSbChecking(false);
      return;
    }

    if (!status.tablesReady) {
      setSbStatusMsg(
        status.errorMessage ||
          'Đã kết nối Supabase nhưng chưa tạo bảng dữ liệu. Nhấn "Khởi tạo Bảng SQL Supabase" để thiết lập.'
      );
      setShowSqlModal(true);
      setSbChecking(false);
      return;
    }

    try {
      const [
        classesList,
        studentsList,
        questionsList,
        examsList,
        keysList,
        assignmentsList,
        submissionsList,
        plansList,
        resourcesList,
        logsList,
        settingsList,
      ] = await Promise.all([
        supabaseFetchAll<ClassRoom>('classes'),
        supabaseFetchAll<Student>('students'),
        supabaseFetchAll<Question>('question_bank'),
        supabaseFetchAll<Exam>('exams'),
        supabaseFetchAll<ExamAnswerKey>('exam_answer_keys'),
        supabaseFetchAll<Assignment>('assignments'),
        supabaseFetchAll<Submission>('submissions'),
        supabaseFetchAll<LearningPlan>('learning_plans'),
        supabaseFetchAll<LearningResource>('learning_resources'),
        supabaseFetchAll<AuditLogItem>('audit_logs'),
        supabaseFetchAll<SystemSetting>('system_settings'),
      ]);

      setCloudClasses(classesList);
      setCloudStudents(studentsList);
      setCloudQuestions(questionsList);
      setCloudExams(examsList);
      setCloudAnswerKeys(
        keysList.map((k) => ({
          ...k,
          examId: k.examId || (k as unknown as { id: string }).id,
        }))
      );
      setCloudAssignments(assignmentsList);
      setCloudSubmissions(submissionsList);
      setCloudPlans(plansList);
      setCloudResources(resourcesList);
      setCloudLogs(logsList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      if (settingsList.length > 0) {
        setCloudSettings(settingsList[0]);
      }
      setSbStatusMsg(
        `Đã kết nối đồng bộ trực tiếp với Supabase PostgreSQL (${SUPABASE_PROJECT_URL})`
      );
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: `Lỗi tải dữ liệu từ Supabase: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setSbChecking(false);
    }
  }, []);

  useEffect(() => {
    loadAllDataFromSupabase();

    // Subscribe to Supabase Realtime changes on public schema
    const channel = supabase
      .channel('tinhoc_thpt_thanhhoa_changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadAllDataFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAllDataFromSupabase]);

  const activeClasses = cloudClasses;
  const activeStudents = cloudStudents;
  const activeQuestions = cloudQuestions;
  const activeExams = cloudExams;
  const activeAnswerKeys = cloudAnswerKeys;
  const activeAssignments = cloudAssignments;
  const activeSubmissions = cloudSubmissions;
  const activePlans = cloudPlans;
  const activeResources = cloudResources;
  const activeLogs = cloudLogs;

  const isTeacherOrAdmin = roleViewMode === 'teacher';
  const defaultOwnerId = 'teacher_nguyen_tien_duong';

  const ensureSupabaseReady = (): boolean => {
    if (!sbTablesReady) {
      setShowSqlModal(true);
      setAppAlert({
        type: 'error',
        text: 'Các bảng dữ liệu trên Supabase chưa được khởi tạo. Vui lòng sao chép mã lệnh SQL trong cửa sổ hướng dẫn và nhấn RUN trong Supabase SQL Editor.',
      });
      return false;
    }
    return true;
  };

  const recordAudit = useCallback(
    async (action: string, module: string, details?: string) => {
      if (!sbTablesReady) return;
      const now = new Date().toISOString();
      const entry: AuditLogItem = {
        id: `log_${Date.now()}`,
        action: action.slice(0, 140),
        module: module.slice(0, 75),
        actorName: 'Nguyễn Tiến Dương',
        actorUid: defaultOwnerId,
        details: details?.slice(0, 950),
        createdAt: now,
      };
      setCloudLogs((prev) => [entry, ...prev]);
      try {
        await supabaseUpsertDoc(
          'audit_logs',
          entry.id,
          entry as unknown as Record<string, unknown>
        );
      } catch {
        // Ignore non-critical audit log errors
      }
    },
    [sbTablesReady]
  );

  // =========================================================================
  // CRUD Handlers for Supabase PostgreSQL
  // =========================================================================
  const handleSaveClass = async (
    clsData: Omit<ClassRoom, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = editId || `class_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const existing = cloudClasses.find((c) => c.id === editId);
    const record: ClassRoom = {
      ...clsData,
      id,
      ownerId: existing?.ownerId || defaultOwnerId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc('classes', id, record as unknown as Record<string, unknown>);
      setCloudClasses((prev) =>
        editId ? prev.map((c) => (c.id === editId ? record : c)) : [record, ...prev]
      );
      await recordAudit(editId ? 'Cập nhật lớp học' : 'Tạo lớp học mới', 'Lớp học', record.name);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!ensureSupabaseReady()) return;
    try {
      await supabaseDeleteDoc('classes', classId);
      setCloudClasses((prev) => prev.filter((c) => c.id !== classId));
      await recordAudit('Xóa lớp học', 'Lớp học', classId);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveStudent = async (
    stData: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = editId || `hs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const existing = cloudStudents.find((s) => s.id === editId);
    const record: Student = {
      ...stData,
      id,
      studentUid: stData.studentUid || existing?.studentUid || defaultOwnerId,
      ownerId: existing?.ownerId || defaultOwnerId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc('students', id, record as unknown as Record<string, unknown>);
      setCloudStudents((prev) =>
        editId ? prev.map((s) => (s.id === editId ? record : s)) : [record, ...prev]
      );
      await recordAudit(
        editId ? 'Cập nhật học sinh' : 'Thêm học sinh mới',
        'Học sinh',
        `${record.fullName} (${record.studentCode})`
      );
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!ensureSupabaseReady()) return;
    try {
      await supabaseDeleteDoc('students', studentId);
      setCloudStudents((prev) => prev.filter((s) => s.id !== studentId));
      await recordAudit('Xóa học sinh', 'Học sinh', studentId);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleBatchImportStudents = async (
    validStudents: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]
  ) => {
    if (!ensureSupabaseReady()) return;
    try {
      // Xóa toàn bộ danh sách học sinh cũ trước khi thêm danh sách mới từ Excel
      await supabaseDeleteAll('students');

      const inserted: Student[] = [];
      for (let i = 0; i < validStudents.length; i++) {
        const st = validStudents[i];
        const now = new Date().toISOString();
        const id = `hs_${Date.now()}_${i}`;
        const record: Student = {
          ...st,
          id,
          studentUid: defaultOwnerId,
          ownerId: defaultOwnerId,
          createdAt: now,
          updatedAt: now,
        };
        await supabaseUpsertDoc('students', id, record as unknown as Record<string, unknown>);
        inserted.push(record);
      }
      setCloudStudents(inserted);
      await recordAudit(
        'Xóa danh sách cũ & Nhập danh sách học sinh mới từ Excel',
        'Học sinh',
        `Số lượng mới: ${validStudents.length} học sinh`
      );
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveQuestion = async (
    qData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = editId || `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const existing = cloudQuestions.find((q) => q.id === editId);
    const record: Question = {
      ...qData,
      id,
      ownerId: existing?.ownerId || defaultOwnerId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc('question_bank', id, record as unknown as Record<string, unknown>);
      setCloudQuestions((prev) =>
        editId ? prev.map((q) => (q.id === editId ? record : q)) : [record, ...prev]
      );
      await recordAudit(
        editId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới',
        'Ngân hàng câu hỏi',
        record.code
      );
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!ensureSupabaseReady()) return;
    try {
      await supabaseDeleteDoc('question_bank', id);
      setCloudQuestions((prev) => prev.filter((q) => q.id !== id));
      await recordAudit('Xóa câu hỏi', 'Ngân hàng câu hỏi', id);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveExam = async (
    examData: Omit<Exam, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    keyData: Omit<ExamAnswerKey, 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = editId || `exam_${Date.now()}`;
    const existingExam = cloudExams.find((e) => e.id === id);
    const examRecord: Exam = {
      ...examData,
      id,
      ownerId: existingExam?.ownerId || defaultOwnerId,
      createdAt: existingExam?.createdAt || now,
      updatedAt: now,
    };
    const keyRecord: ExamAnswerKey = {
      ...keyData,
      examId: id,
      ownerId: existingExam?.ownerId || defaultOwnerId,
      createdAt: existingExam?.createdAt || now,
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc('exams', id, examRecord as unknown as Record<string, unknown>);
      await supabaseUpsertDoc(
        'exam_answer_keys',
        id,
        keyRecord as unknown as Record<string, unknown>
      );
      setCloudExams((prev) =>
        existingExam ? prev.map((e) => (e.id === id ? examRecord : e)) : [examRecord, ...prev]
      );
      setCloudAnswerKeys((prev) => [
        ...prev.filter((k) => k.examId !== id),
        keyRecord,
      ]);
      await recordAudit('Lưu đề kiểm tra & Ma trận', 'Đề kiểm tra', examRecord.title);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!ensureSupabaseReady()) return;
    try {
      await supabaseDeleteDoc('exams', examId);
      await supabaseDeleteDoc('exam_answer_keys', examId);
      setCloudExams((prev) => prev.filter((e) => e.id !== examId));
      setCloudAnswerKeys((prev) => prev.filter((k) => k.examId !== examId));
      await recordAudit('Xóa đề kiểm tra', 'Đề kiểm tra', examId);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCreateAssignment = async (
    asgData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = `assign_${Date.now()}`;
    const record: Assignment = {
      ...asgData,
      id,
      ownerId: defaultOwnerId,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc('assignments', id, record as unknown as Record<string, unknown>);
      setCloudAssignments((prev) => [record, ...prev]);
      await recordAudit(
        'Giao bài kiểm tra cho lớp',
        'Kiểm tra trực tuyến',
        `${record.examTitle} -> ${record.className}`
      );
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveOrSubmitAttempt = async (
    subData: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    existingId?: string
  ): Promise<string> => {
    if (!ensureSupabaseReady()) return existingId || '';
    const now = new Date().toISOString();
    const id = existingId || `sub_${Date.now()}`;
    const existing = cloudSubmissions.find((s) => s.id === id);
    const record: Submission = {
      ...subData,
      id,
      studentUid: existing?.studentUid || defaultOwnerId,
      ownerId: existing?.ownerId || defaultOwnerId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc('submissions', id, record as unknown as Record<string, unknown>);
      setCloudSubmissions((prev) =>
        existing ? prev.map((s) => (s.id === id ? record : s)) : [record, ...prev]
      );

      if (
        subData.status === 'Đã nộp' ||
        subData.status === 'Chờ chấm' ||
        subData.status === 'Đã chấm'
      ) {
        await recordAudit(
          `Học sinh nộp bài (${subData.status})`,
          'Bài làm học sinh',
          `${subData.studentName} - Điểm TN: ${subData.objectiveScore}`
        );
      }
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
    return id;
  };

  const handleGradeOrAdjustSubmission = async (
    submission: Submission,
    newObjectiveScore: number,
    newEssayScore: number,
    feedback: string,
    reason: string
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const newTotal = Math.round((newObjectiveScore + newEssayScore) * 100) / 100;
    const historyEntry = {
      timestamp: now,
      actorName: 'Nguyễn Tiến Dương',
      previousScore: submission.totalScore,
      newScore: newTotal,
      reason,
    };

    const updated: Submission = {
      ...submission,
      objectiveScore: newObjectiveScore,
      essayScore: newEssayScore,
      totalScore: newTotal,
      status: 'Đã chấm',
      gradingStatus: 'graded',
      teacherFeedback: feedback,
      gradeHistory: [...(submission.gradeHistory || []), historyEntry],
      updatedAt: now,
    };

    try {
      await supabaseUpsertDoc(
        'submissions',
        submission.id,
        updated as unknown as Record<string, unknown>
      );
      setCloudSubmissions((prev) =>
        prev.map((s) => (s.id === submission.id ? updated : s))
      );
      await recordAudit(
        'Chấm bài / Điều chỉnh điểm số',
        'Chấm điểm',
        `HS ${submission.studentName}: ${submission.totalScore} -> ${newTotal} điểm (${reason})`
      );
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveLearningPlan = async (
    planData: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}`;
    const record: LearningPlan = {
      ...planData,
      id,
      ownerId: defaultOwnerId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await supabaseUpsertDoc('learning_plans', id, record as unknown as Record<string, unknown>);
      setCloudPlans((prev) => [record, ...prev]);
      await recordAudit('Tạo kế hoạch ôn tập', 'Kế hoạch ôn tập', record.title);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeleteLearningPlan = async (id: string) => {
    if (!ensureSupabaseReady()) return;
    try {
      await supabaseDeleteDoc('learning_plans', id);
      setCloudPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveResource = async (
    resData: Omit<LearningResource, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const id = `res_${Date.now()}`;
    const record: LearningResource = {
      ...resData,
      id,
      ownerId: defaultOwnerId,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await supabaseUpsertDoc(
        'learning_resources',
        id,
        record as unknown as Record<string, unknown>
      );
      setCloudResources((prev) => [record, ...prev]);
      await recordAudit('Thêm học liệu mới', 'Tài liệu - Học liệu', record.title);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!ensureSupabaseReady()) return;
    try {
      await supabaseDeleteDoc('learning_resources', id);
      setCloudResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleSaveSettings = async (newSettings: SystemSetting) => {
    if (!ensureSupabaseReady()) return;
    const now = new Date().toISOString();
    const updated: SystemSetting = {
      ...newSettings,
      ownerId: defaultOwnerId,
      updatedAt: now,
    };
    setCloudSettings(updated);
    try {
      await supabaseUpsertDoc(
        'system_settings',
        'default_settings',
        updated as unknown as Record<string, unknown>
      );
      await recordAudit('Cập nhật cấu hình hệ thống', 'Cài đặt hệ thống', updated.schoolName);
    } catch (err) {
      setAppAlert({
        type: 'error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleExportFullBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      databaseProvider: 'Supabase PostgreSQL',
      supabaseUrl: SUPABASE_PROJECT_URL,
      school: cloudSettings.schoolName,
      teacher: cloudSettings.teacherName,
      classes: activeClasses,
      students: activeStudents,
      questions: activeQuestions,
      exams: activeExams,
      assignments: activeAssignments,
      submissions: activeSubmissions,
      learningPlans: activePlans,
      resources: activeResources,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sao_Luu_Supabase_Tin_Hoc_THPT_Thanh_Hoa_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => !item.teacherOnly || isTeacherOrAdmin
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F8FC] text-[#17365D]">
      {/* A. TOP HEADER BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Brand Logo, Official Website Name & School Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#0D47A1] hover:bg-blue-50 cursor-pointer"
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <SchoolBookTechLogo className="w-11 h-11 shrink-0" />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-[#0D47A1] tracking-tight">
                  TIN HỌC THPT THANH HÒA
                </h1>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="hidden sm:inline text-xs font-bold text-[#168BFA] uppercase">
                  HỆ THỐNG QUẢN LÝ DẠY HỌC VÀ KIỂM TRA TRỰC TUYẾN
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-600 mt-0.5">
                <span className="font-semibold text-[#17365D]">Trường THPT Thanh Hòa</span>
                <span aria-hidden="true">·</span>
                <span>Xã Thiện Hưng - TP. Đồng Nai</span>
                <span aria-hidden="true">·</span>
                <span>
                  Giáo viên: <strong className="text-[#0D47A1]">Nguyễn Tiến Dương</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Môn học: <strong>Tin học</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Supabase SQL Helper, Role Switch, Notifications & Teacher Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowSqlModal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                sbTablesReady
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-[#FF8A00] text-white border-[#FF8A00] hover:bg-[#e67c00]'
              }`}
              title="Xem cấu hình bảng SQL Supabase"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{sbTablesReady ? 'Supabase: Đã sẵn sàng' : 'Khởi tạo Bảng SQL Supabase'}</span>
            </button>

            <button
              onClick={() => loadAllDataFromSupabase()}
              disabled={sbChecking}
              className="p-2 rounded-lg bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-slate-200 cursor-pointer"
              title="Làm mới dữ liệu từ Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${sbChecking ? 'animate-spin' : ''}`} />
            </button>

            {/* Role View Switcher */}
            <div className="hidden xl:flex items-center bg-[#F4F8FC] p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setRoleViewMode('teacher')}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                  roleViewMode === 'teacher' ? 'bg-[#0D47A1] text-white' : 'text-slate-600'
                }`}
              >
                GV Quản trị
              </button>
              <button
                onClick={() => {
                  setRoleViewMode('student');
                  setActiveTab('student_portal');
                }}
                className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                  roleViewMode === 'student' ? 'bg-[#168BFA] text-white' : 'text-slate-600'
                }`}
              >
                Giao diện HS
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2 rounded-lg bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-slate-200 relative cursor-pointer"
                aria-label="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF8A00] text-white text-[10px] font-bold flex items-center justify-center">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-[#0D47A1]">Thông báo hệ thống</span>
                    <button
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
                      }
                      className="text-[11px] text-[#168BFA] font-bold hover:underline cursor-pointer"
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded bg-[#F4F8FC]">
                      <p className="font-bold text-[#0D47A1]">{n.title}</p>
                      <p className="text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Account */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <TeacherAvatarSvg className="w-9 h-9 hidden sm:block" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#0D47A1] leading-none">Nguyễn Tiến Dương</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {sbTablesReady ? 'Đã đồng bộ Supabase' : 'Đang chờ tạo bảng SQL'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supabase Status Bar */}
        <div
          className={`px-4 lg:px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-t ${
            sbTablesReady
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>[CƠ SỞ DỮ LIỆU SUPABASE]:</strong> {sbStatusMsg}
            </span>
          </div>
          {!sbTablesReady && (
            <button
              onClick={() => setShowSqlModal(true)}
              className="font-bold text-[#0D47A1] underline cursor-pointer shrink-0"
            >
              Mở mã lệnh SQL khởi tạo bảng trên Supabase →
            </button>
          )}
        </div>
      </header>

      {/* MAIN WORKSPACE: LEFT SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 flex">
        {/* B. LEFT NAVIGATION SIDEBAR (#0D47A1) */}
        <aside
          className={`${
            mobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 w-64' : 'hidden lg:flex'
          } ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          } bg-[#0D47A1] text-white flex-col justify-between transition-all duration-150 shrink-0 no-print`}
        >
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between px-2 py-2 border-b border-blue-800/80 mb-2">
              {!sidebarCollapsed && (
                <span className="text-xs font-bold text-[#00C8FF] uppercase tracking-wider">
                  Danh mục phân hệ
                </span>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex p-1.5 rounded hover:bg-blue-800 text-blue-200 cursor-pointer ml-auto"
                title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {visibleMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#168BFA] text-white shadow-xs'
                      : 'text-blue-100 hover:bg-blue-800/70 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <IconComp
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-[#00C8FF]' : 'text-blue-200'
                    }`}
                  />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {!sidebarCollapsed && (
            <div className="p-4 m-3 rounded-xl bg-[#082F6E] border border-[#168BFA]/40 text-xs space-y-1.5">
              <p className="font-bold text-[#00C8FF]">TRƯỜNG THPT THANH HÒA</p>
              <p className="text-blue-100">GV: Nguyễn Tiến Dương</p>
              <p className="text-blue-200 text-[11px]">
                Supabase: gdoxbonoiumnpiswqris
              </p>
            </div>
          )}
        </aside>

        {/* C. MAIN CONTENT VIEWPORT */}
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6">
          {appAlert && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                appAlert.type === 'error'
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : 'bg-blue-50 border-blue-300 text-[#0D47A1]'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{appAlert.text}</span>
              </div>
              <button
                onClick={() => setAppAlert(null)}
                className="text-xs font-bold underline cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              classes={activeClasses}
              students={activeStudents}
              questions={activeQuestions}
              exams={activeExams}
              assignments={activeAssignments}
              submissions={activeSubmissions}
              resources={activeResources}
              auditLogs={activeLogs}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'classes_students' && (
            <ClassesAndStudentsView
              classes={activeClasses}
              students={activeStudents}
              submissions={activeSubmissions}
              isTeacherOrAdmin={isTeacherOrAdmin}
              onSaveClass={handleSaveClass}
              onDeleteClass={handleDeleteClass}
              onSaveStudent={handleSaveStudent}
              onDeleteStudent={handleDeleteStudent}
              onBatchImportStudents={handleBatchImportStudents}
            />
          )}

          {activeTab === 'question_bank' && (
            <QuestionBankView
              questions={activeQuestions}
              onSaveQuestion={handleSaveQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onCreateExamFromSelected={(selected) => {
                setPreselectedQuestionsForExam(selected);
                setActiveTab('exams');
              }}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsAndMatrixView
              exams={activeExams}
              answerKeys={activeAnswerKeys}
              questions={activeQuestions}
              classes={activeClasses}
              assignments={activeAssignments}
              preselectedQuestions={preselectedQuestionsForExam}
              onClearPreselected={() => setPreselectedQuestionsForExam([])}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onCreateAssignment={handleCreateAssignment}
            />
          )}

          {activeTab === 'student_portal' && (
            <StudentExamPortal
              students={activeStudents}
              assignments={activeAssignments}
              submissions={activeSubmissions}
              answerKeys={activeAnswerKeys}
              activeStudentId={activeStudentIdForPortal || activeStudents[0]?.id || ''}
              isTeacherOrAdmin={isTeacherOrAdmin}
              onSelectActiveStudent={setActiveStudentIdForPortal}
              onSaveOrSubmitAttempt={handleSaveOrSubmitAttempt}
            />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsAndGradingView
              submissions={activeSubmissions}
              classes={activeClasses}
              assignments={activeAssignments}
              answerKeys={activeAnswerKeys}
              onGradeOrAdjustSubmission={handleGradeOrAdjustSubmission}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAndAnalyticsView
              classes={activeClasses}
              students={activeStudents}
              questions={activeQuestions}
              exams={activeExams}
              answerKeys={activeAnswerKeys}
              assignments={activeAssignments}
              submissions={activeSubmissions}
              learningPlans={activePlans}
            />
          )}

          {activeTab === 'learning_plans' && (
            <LearningPlansView
              plans={activePlans}
              questions={activeQuestions}
              classes={activeClasses}
              onSavePlan={handleSaveLearningPlan}
              onDeletePlan={handleDeleteLearningPlan}
            />
          )}

          {activeTab === 'ai_assistant' && (
            <AiAssistantView
              classes={activeClasses}
              students={activeStudents}
              submissions={activeSubmissions}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesView
              resources={activeResources}
              isTeacherOrAdmin={isTeacherOrAdmin}
              onSaveResource={handleSaveResource}
              onDeleteResource={handleDeleteResource}
            />
          )}

          {activeTab === 'settings' && (
            <SystemSettingsView
              settings={cloudSettings}
              auditLogs={activeLogs}
              onSaveSettings={handleSaveSettings}
              onExportFullBackup={handleExportFullBackup}
            />
          )}
        </main>
      </div>

      {/* SUPABASE SQL SETUP MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-[#168BFA] uppercase">
                  KẾT NỐI SUPABASE: {SUPABASE_PROJECT_URL}
                </span>
                <h3 className="text-lg font-bold text-[#0D47A1]">
                  Khởi tạo Bảng Dữ liệu PostgreSQL trên Supabase (Chỉ cần làm 1 lần)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#17365D] space-y-2">
              <p className="font-bold text-sm text-[#0D47A1]">
                Hướng dẫn 3 bước để kích hoạt toàn bộ 11 bảng dữ liệu trên Supabase của thầy:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Nhấn nút <strong>&quot;1. Sao chép toàn bộ lệnh SQL&quot;</strong> bên dưới.
                </li>
                <li>
                  Mở trang{' '}
                  <a
                    href="https://supabase.com/dashboard/project/gdoxbonoiumnpiswqris/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#168BFA] underline inline-flex items-center gap-1"
                  >
                    <span>Supabase SQL Editor (Dự án gdoxbonoiumnpiswqris)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  , dán đoạn mã SQL vừa sao chép vào ô soạn thảo và nhấn nút <strong>RUN</strong>.
                </li>
                <li>
                  Quay lại cửa sổ này và nhấn nút{' '}
                  <strong>&quot;2. Kiểm tra kết nối &amp; Đồng bộ ngay&quot;</strong>.
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Đã sao chép lệnh SQL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>1. Sao chép toàn bộ lệnh SQL</span>
                    </>
                  )}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/gdoxbonoiumnpiswqris/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Mở Supabase SQL Editor</span>
                </a>
              </div>

              <button
                onClick={async () => {
                  await loadAllDataFromSupabase();
                  const st = await checkSupabaseStatus();
                  if (st.tablesReady) {
                    setShowSqlModal(false);
                    setAppAlert({
                      type: 'info',
                      text: 'Tuyệt vời! Đã kết nối và xác nhận đầy đủ các bảng dữ liệu trên Supabase.',
                    });
                  }
                }}
                className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${sbChecking ? 'animate-spin' : ''}`} />
                <span>2. Kiểm tra kết nối &amp; Đồng bộ ngay</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs overflow-x-auto max-h-80 leading-relaxed select-all">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* D. FOOTER BAR */}
      <footer className="bg-[#0D47A1] text-white border-t border-[#168BFA]/40 py-5 px-6 no-print">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-bold text-sm text-[#00C8FF]">
              TIN HỌC THPT THANH HÒA — HỆ THỐNG QUẢN LÝ DẠY HỌC VÀ KIỂM TRA TRỰC TUYẾN
            </p>
            <p className="text-blue-100">
              Trường THPT Thanh Hòa · Địa chỉ: Xã Thiện Hưng - TP. Đồng Nai · Giáo viên phụ trách:{' '}
              <strong>Nguyễn Tiến Dương</strong>
            </p>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="font-bold text-[#FF8A00] text-sm">
              Phương châm: “Học thật - Hiểu sâu - Ứng dụng tốt”
            </p>
            <p className="text-blue-100">
              Nền tảng lưu trữ đám mây: Supabase PostgreSQL ({SUPABASE_PROJECT_URL})
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
