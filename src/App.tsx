import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
  LogIn,
  LogOut,
  PlayCircle,
  Cloud,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import {
  auth,
  db,
  loginWithGoogle,
  logoutFirebase,
  OperationType,
  handleFirestoreError,
  safeCreateOrSetDoc,
  safeUpdateDoc,
  safeDeleteDoc,
  TEACHER_ADMIN_EMAIL,
} from './firebase';
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

  // Auth & Role State
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleViewMode, setRoleViewMode] = useState<'teacher' | 'student'>('teacher');

  // Notifications dropdown
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Cloud Firestore State (Real Data)
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
      title: 'Hệ thống Tin học THPT Thanh Hòa sẵn sàng',
      message: 'Cơ sở dữ liệu Cloud Firestore và bộ quy tắc bảo mật đã được kích hoạt.',
      targetRole: 'all',
      isRead: false,
      ownerId: 'system',
      createdAt: '2026-10-23T08:00:00.000Z',
      updatedAt: '2026-10-23T08:00:00.000Z',
    },
  ]);

  const [preselectedQuestionsForExam, setPreselectedQuestionsForExam] = useState<Question[]>([]);
  const [activeStudentIdForPortal, setActiveStudentIdForPortal] = useState<string>('');
  const [appAlert, setAppAlert] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  // Track Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthReady(true);
      if (user) {
        const isTeacherEmail =
          user.email?.toLowerCase() === TEACHER_ADMIN_EMAIL.toLowerCase();
        setRoleViewMode(isTeacherEmail ? 'teacher' : 'student');
      }
    });
    return () => unsub();
  }, []);

  const isVerifiedTeacherUser =
    Boolean(fbUser) &&
    fbUser?.email?.toLowerCase() === TEACHER_ADMIN_EMAIL.toLowerCase() &&
    fbUser?.emailVerified === true;

  // Attach Firestore real-time listeners when authenticated
  useEffect(() => {
    if (!authReady || !fbUser) return;

    const unsubs: (() => void)[] = [];

    if (isVerifiedTeacherUser) {
      unsubs.push(
        onSnapshot(
          collection(db, 'classes'),
          (snap) => {
            setCloudClasses(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClassRoom, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'classes')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'students'),
          (snap) => {
            setCloudStudents(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'students')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'question_bank'),
          (snap) => {
            setCloudQuestions(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Question, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'question_bank')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'exams'),
          (snap) => {
            setCloudExams(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exam, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'exams')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'exam_answer_keys'),
          (snap) => {
            setCloudAnswerKeys(
              snap.docs.map((d) => ({ ...(d.data() as ExamAnswerKey), examId: d.id }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'exam_answer_keys')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'assignments'),
          (snap) => {
            setCloudAssignments(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'assignments')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'submissions'),
          (snap) => {
            setCloudSubmissions(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'submissions')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'learning_plans'),
          (snap) => {
            setCloudPlans(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LearningPlan, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'learning_plans')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'learning_resources'),
          (snap) => {
            setCloudResources(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LearningResource, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'learning_resources')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'audit_logs'),
          (snap) => {
            const list = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<AuditLogItem, 'id'>),
            }));
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setCloudLogs(list);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
        )
      );
    } else {
      // Student-scoped queries respecting Pillar 8 (Secure List Queries)
      unsubs.push(
        onSnapshot(
          query(collection(db, 'assignments'), where('status', '==', 'open')),
          (snap) => {
            setCloudAssignments(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Assignment, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'assignments')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'submissions'), where('studentUid', '==', fbUser.uid)),
          (snap) => {
            setCloudSubmissions(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'submissions')
        )
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'learning_resources'),
            where('accessLevel', '==', 'public_students')
          ),
          (snap) => {
            setCloudResources(
              snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LearningResource, 'id'>) }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'learning_resources')
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, fbUser, isVerifiedTeacherUser]);

  // Active Datasets (Real Cloud Firestore Data)
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

  const recordAudit = useCallback(
    async (action: string, module: string, details?: string) => {
      if (!fbUser) return;
      const now = new Date().toISOString();
      const entry: AuditLogItem = {
        id: `log_${Date.now()}`,
        action: action.slice(0, 140),
        module: module.slice(0, 75),
        actorName: fbUser.displayName || 'Nguyễn Tiến Dương',
        actorUid: fbUser.uid,
        details: details?.slice(0, 950),
        createdAt: now,
      };
      await safeCreateOrSetDoc(
        'audit_logs',
        entry.id,
        entry as unknown as Record<string, unknown>,
        OperationType.CREATE
      );
    },
    [fbUser]
  );

  // =========================================================================
  // CRUD Handlers for Real Cloud Firestore Data
  // =========================================================================
  const ensureCanWrite = (): boolean => {
    if (!fbUser) {
      setAppAlert({
        type: 'error',
        text: 'Chưa đăng nhập Cloud Firestore! Vui lòng nhấn "Đăng nhập Google" ở góc trên bên phải để lưu dữ liệu vào hệ thống.',
      });
      return false;
    }
    return true;
  };

  const handleSaveClass = async (
    clsData: Omit<ClassRoom, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = editId || `class_${Date.now()}`;
    const record: ClassRoom = {
      ...clsData,
      id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };

    if (editId) {
      const existing = cloudClasses.find((c) => c.id === editId);
      await safeUpdateDoc('classes', editId, {
        ...record,
        ownerId: existing?.ownerId || fbUser!.uid,
        createdAt: existing?.createdAt || now,
      });
    } else {
      await safeCreateOrSetDoc('classes', id, record as unknown as Record<string, unknown>);
    }
    await recordAudit(editId ? 'Cập nhật lớp học' : 'Tạo lớp học mới', 'Lớp học', record.name);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!ensureCanWrite()) return;
    await safeDeleteDoc('classes', classId);
    await recordAudit('Xóa lớp học', 'Lớp học', classId);
  };

  const handleSaveStudent = async (
    stData: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = editId || `hs_${Date.now()}`;
    const record: Student = {
      ...stData,
      id,
      studentUid: stData.studentUid || fbUser!.uid,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };

    if (editId) {
      const existing = cloudStudents.find((s) => s.id === editId);
      await safeUpdateDoc('students', editId, {
        ...record,
        ownerId: existing?.ownerId || fbUser!.uid,
        createdAt: existing?.createdAt || now,
      });
    } else {
      await safeCreateOrSetDoc('students', id, record as unknown as Record<string, unknown>);
    }
    await recordAudit(
      editId ? 'Cập nhật học sinh' : 'Thêm học sinh mới',
      'Học sinh',
      `${record.fullName} (${record.studentCode})`
    );
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!ensureCanWrite()) return;
    await safeDeleteDoc('students', studentId);
    await recordAudit('Xóa học sinh', 'Học sinh', studentId);
  };

  const handleBatchImportStudents = async (
    validStudents: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]
  ) => {
    if (!ensureCanWrite()) return;
    for (let i = 0; i < validStudents.length; i++) {
      const st = validStudents[i];
      const now = new Date().toISOString();
      const id = `hs_${Date.now()}_${i}`;
      const record: Student = {
        ...st,
        id,
        studentUid: fbUser!.uid,
        ownerId: fbUser!.uid,
        createdAt: now,
        updatedAt: now,
      };
      await safeCreateOrSetDoc('students', id, record as unknown as Record<string, unknown>);
    }
    await recordAudit(
      'Nhập danh sách học sinh từ Excel',
      'Học sinh',
      `Số lượng: ${validStudents.length} học sinh`
    );
  };

  const handleSaveQuestion = async (
    qData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = editId || `q_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const record: Question = {
      ...qData,
      id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };

    if (editId) {
      const existing = cloudQuestions.find((q) => q.id === editId);
      await safeUpdateDoc('question_bank', editId, {
        ...record,
        ownerId: existing?.ownerId || fbUser!.uid,
        createdAt: existing?.createdAt || now,
      });
    } else {
      await safeCreateOrSetDoc('question_bank', id, record as unknown as Record<string, unknown>);
    }
    await recordAudit(
      editId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi mới',
      'Ngân hàng câu hỏi',
      record.code
    );
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!ensureCanWrite()) return;
    await safeDeleteDoc('question_bank', id);
    await recordAudit('Xóa câu hỏi', 'Ngân hàng câu hỏi', id);
  };

  const handleSaveExam = async (
    examData: Omit<Exam, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    keyData: Omit<ExamAnswerKey, 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = editId || `exam_${Date.now()}`;
    const examRecord: Exam = {
      ...examData,
      id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };
    const keyRecord: ExamAnswerKey = {
      ...keyData,
      examId: id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };

    const existingExam = cloudExams.find((e) => e.id === id);
    if (existingExam) {
      await safeUpdateDoc('exams', id, {
        ...examRecord,
        ownerId: existingExam.ownerId,
        createdAt: existingExam.createdAt,
      });
    } else {
      await safeCreateOrSetDoc('exams', id, examRecord as unknown as Record<string, unknown>);
    }
    await safeCreateOrSetDoc(
      'exam_answer_keys',
      id,
      keyRecord as unknown as Record<string, unknown>
    );
    await recordAudit('Lưu đề kiểm tra & Ma trận', 'Đề kiểm tra', examRecord.title);
  };

  const handleDeleteExam = async (examId: string) => {
    if (!ensureCanWrite()) return;
    await safeDeleteDoc('exams', examId);
    await recordAudit('Xóa đề kiểm tra', 'Đề kiểm tra', examId);
  };

  const handleCreateAssignment = async (
    asgData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = `assign_${Date.now()}`;
    const record: Assignment = {
      ...asgData,
      id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };

    await safeCreateOrSetDoc('assignments', id, record as unknown as Record<string, unknown>);
    await recordAudit(
      'Giao bài kiểm tra cho lớp',
      'Kiểm tra trực tuyến',
      `${record.examTitle} -> ${record.className}`
    );
  };

  const handleSaveOrSubmitAttempt = async (
    subData: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    existingId?: string
  ): Promise<string> => {
    if (!ensureCanWrite()) return existingId || '';
    const now = new Date().toISOString();
    const id = existingId || `sub_${Date.now()}`;
    const record: Submission = {
      ...subData,
      id,
      studentUid: fbUser!.uid,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };

    const existing = cloudSubmissions.find((s) => s.id === id);
    if (existing) {
      await safeUpdateDoc('submissions', id, {
        ...record,
        ownerId: existing.ownerId,
        studentUid: existing.studentUid,
        createdAt: existing.createdAt,
      });
    } else {
      await safeCreateOrSetDoc('submissions', id, record as unknown as Record<string, unknown>);
    }

    if (subData.status === 'Đã nộp' || subData.status === 'Chờ chấm' || subData.status === 'Đã chấm') {
      await recordAudit(
        `Học sinh nộp bài (${subData.status})`,
        'Bài làm học sinh',
        `${subData.studentName} - Điểm TN: ${subData.objectiveScore}`
      );
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
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const newTotal = Math.round((newObjectiveScore + newEssayScore) * 100) / 100;
    const historyEntry = {
      timestamp: now,
      actorName: fbUser?.displayName || 'Nguyễn Tiến Dương',
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

    await safeUpdateDoc('submissions', submission.id, updated as unknown as Record<string, unknown>);

    await recordAudit(
      'Chấm bài / Điều chỉnh điểm số',
      'Chấm điểm',
      `HS ${submission.studentName}: ${submission.totalScore} -> ${newTotal} điểm (${reason})`
    );
  };

  const handleSaveLearningPlan = async (
    planData: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}`;
    const record: LearningPlan = {
      ...planData,
      id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };
    await safeCreateOrSetDoc('learning_plans', id, record as unknown as Record<string, unknown>);
    await recordAudit('Tạo kế hoạch ôn tập', 'Kế hoạch ôn tập', record.title);
  };

  const handleDeleteLearningPlan = async (id: string) => {
    if (!ensureCanWrite()) return;
    await safeDeleteDoc('learning_plans', id);
  };

  const handleSaveResource = async (
    resData: Omit<LearningResource, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const id = `res_${Date.now()}`;
    const record: LearningResource = {
      ...resData,
      id,
      ownerId: fbUser!.uid,
      createdAt: now,
      updatedAt: now,
    };
    await safeCreateOrSetDoc(
      'learning_resources',
      id,
      record as unknown as Record<string, unknown>
    );
    await recordAudit('Thêm học liệu mới', 'Tài liệu - Học liệu', record.title);
  };

  const handleDeleteResource = async (id: string) => {
    if (!ensureCanWrite()) return;
    await safeDeleteDoc('learning_resources', id);
  };

  const handleSaveSettings = async (newSettings: SystemSetting) => {
    if (!ensureCanWrite()) return;
    const now = new Date().toISOString();
    const updated: SystemSetting = {
      ...newSettings,
      ownerId: fbUser!.uid,
      updatedAt: now,
    };
    setCloudSettings(updated);
    if (fbUser) {
      await safeCreateOrSetDoc(
        'system_settings',
        'default_settings',
        updated as unknown as Record<string, unknown>
      );
    }
    await recordAudit('Cập nhật cấu hình hệ thống', 'Cài đặt hệ thống', updated.schoolName);
  };

  const handleExportFullBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
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
    a.download = `Sao_Luu_Tin_Hoc_THPT_Thanh_Hoa_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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

          {/* Right: Role Switch, Notifications & Teacher Account */}
          <div className="flex items-center gap-2.5 shrink-0">
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

            {/* Account & Cloud Auth */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <TeacherAvatarSvg className="w-9 h-9 hidden sm:block" />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#0D47A1] leading-none">
                  {fbUser ? fbUser.displayName || 'Nguyễn Tiến Dương' : 'Nguyễn Tiến Dương'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {fbUser ? 'Đã kết nối Firestore' : 'Chưa đăng nhập Cloud'}
                </p>
              </div>
              {fbUser ? (
                <button
                  onClick={() => logoutFirebase()}
                  className="p-2 text-slate-600 hover:text-red-600 cursor-pointer"
                  title="Đăng xuất khỏi Firebase"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() =>
                    loginWithGoogle().catch((err) =>
                      setAppAlert({
                        type: 'error',
                        text: `Không thể mở hộp thoại đăng nhập Google: ${
                          err instanceof Error ? err.message : String(err)
                        }`,
                      })
                    )
                  }
                  className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập Google</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cloud Connection Status Bar */}
        <div
          className={`px-4 lg:px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-t ${
            fbUser
              ? 'bg-blue-50/70 border-blue-100 text-[#0D47A1]'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            {fbUser ? (
              <span>
                <strong>[ĐÃ KẾT NỐI CLOUD FIRESTORE]:</strong> Mọi thao tác quản lý lớp học, học sinh, ngân hàng câu hỏi, đề kiểm tra và kết quả học tập đều được lưu trữ trực tiếp trên cơ sở dữ liệu đám mây.
              </span>
            ) : (
              <span>
                <strong>[TRẠNG THÁI CƠ SỞ DỮ LIỆU]:</strong> Vui lòng nhấn <strong>&quot;Đăng nhập Google&quot;</strong> ở góc phải phía trên để kết nối và lưu trữ dữ liệu trực tiếp trên Cloud Firestore.
              </span>
            )}
          </div>
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
                Khối 10 · Khối 11 · Khối 12
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
              Nâng cao chất lượng dạy và học môn Tin học · Phát triển năng lực số toàn diện cho học sinh THPT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
