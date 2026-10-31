export type GradeLevel = '10' | '11' | '12';

export type CognitiveLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export type ExamCategory =
  | 'Kiểm tra thường xuyên'
  | 'Kiểm tra giữa kỳ'
  | 'Kiểm tra cuối kỳ'
  | 'Đề ôn tập'
  | 'Đề luyện thi';

export type ExamStatus = 'draft' | 'published' | 'open' | 'closed';

export type SubmissionStatus =
  | 'Chưa bắt đầu'
  | 'Đang làm bài'
  | 'Đã nộp'
  | 'Chờ chấm'
  | 'Đã chấm'
  | 'Quá hạn';

export type GradingStatus = 'pending' | 'auto_graded' | 'waiting_essay' | 'graded';

export type UserRole = 'admin' | 'teacher' | 'student';

export type MenuTabId =
  | 'overview'
  | 'classes_students'
  | 'question_bank'
  | 'exams'
  | 'submissions'
  | 'reports'
  | 'learning_plans'
  | 'ai_assistant'
  | 'resources'
  | 'settings'
  | 'student_portal';

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
  studentCode?: string;
  classId?: string;
  grade?: GradeLevel | 'ALL';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  grade: GradeLevel;
  academicYear: string;
  homeroomTeacher?: string;
  studentCount: number;
  description?: string;
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  birthDate?: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  accountStatus: 'active' | 'suspended';
  loginCode: string;
  studentUid?: string;
  avgScore: number;
  completedExamsCount: number;
  weakTopics?: string;
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrueFalseSubItem {
  id: string; // 'a' | 'b' | 'c' | 'd'
  text: string;
  isTrue: boolean;
  cognitiveLevel?: CognitiveLevel;
}

export interface Question {
  id: string;
  code: string;
  grade: GradeLevel;
  textbook: string;
  topic: string;
  lesson?: string;
  knowledgeUnit?: string;
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  content: string;
  codeSnippet?: string;
  imageUrl?: string;
  options?: string[];
  subItems?: TrueFalseSubItem[];
  correctAnswer?: string;
  explanation?: string;
  gradingGuide?: string;
  points: number;
  tags?: string[];
  isApproved: boolean;
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SanitizedTrueFalseSubItem {
  id: string;
  text: string;
  cognitiveLevel?: CognitiveLevel;
}

export interface SanitizedQuestion {
  id: string;
  code: string;
  topic: string;
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  content: string;
  codeSnippet?: string;
  imageUrl?: string;
  options?: string[];
  optionOriginalLetters?: string[];
  subItems?: SanitizedTrueFalseSubItem[];
  points: number;
}

export interface MatrixRow {
  id: string;
  topic: string;
  knowledgeUnit: string;
  specification?: string;
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  questionCount: number;
  pointsPerQuestion: number;
  totalPoints: number;
  percentage: number;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  category: ExamCategory;
  grade: GradeLevel;
  topic?: string;
  durationMinutes: number;
  totalPoints: number;
  status: ExamStatus;
  matrixRows?: MatrixRow[];
  questionsSanitized?: SanitizedQuestion[];
  questionCount: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAnswerKey {
  examId: string;
  answersMap: Record<string, string>; // questionId -> correctAnswer or JSON of subItems
  explanationsMap?: Record<string, string>; // questionId -> explanation/gradingGuide
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  examId: string;
  examTitle: string;
  examCategory?: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  startTime: string;
  dueTime: string;
  durationMinutes: number;
  maxAttempts: number;
  resultReleaseMode: 'immediate' | 'after_due' | 'manual';
  showAnswersAfterSubmit: boolean;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  status: 'open' | 'closed';
  questionsSnapshot?: SanitizedQuestion[];
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GradeHistoryEntry {
  timestamp: string;
  actorName: string;
  previousScore: number;
  newScore: number;
  reason: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentUid: string;
  classId: string;
  className: string;
  grade: GradeLevel;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  status: SubmissionStatus;
  gradingStatus: GradingStatus;
  answersMap: Record<string, string>;
  objectiveScore: number;
  essayScore: number;
  totalScore: number;
  teacherFeedback?: string;
  gradeHistory?: GradeHistoryEntry[];
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPlan {
  id: string;
  title: string;
  grade: GradeLevel;
  topic: string;
  lesson?: string;
  objective?: string;
  mode: 'Luyện tập' | 'Kiểm tra';
  classId?: string;
  className?: string;
  dueDate?: string;
  questionIds?: string[];
  completedCount: number;
  totalStudents: number;
  status: 'active' | 'completed' | 'draft';
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResource {
  id: string;
  title: string;
  category:
    | 'Bài giảng'
    | 'Tệp PDF'
    | 'Tài liệu thực hành'
    | 'Bài tập'
    | 'Liên kết tài nguyên'
    | 'Hướng dẫn sử dụng';
  grade: GradeLevel | 'ALL';
  topic?: string;
  description?: string;
  resourceType: 'link' | 'document' | 'guide';
  externalUrl?: string;
  fileStatus?: string;
  accessLevel: 'public_students' | 'teacher_only';
  isDemo: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  targetRole: 'all' | 'teacher' | 'student';
  targetClassId?: string;
  isRead: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  module: string;
  actorName: string;
  actorUid: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  websiteName: string;
  schoolName: string;
  address: string;
  teacherName: string;
  subjectName: string;
  academicYear: string;
  gradingScale: number;
  defaultDurationMinutes: number;
  defaultReleaseMode: 'immediate' | 'after_due' | 'manual';
  language?: string;
  timezone?: string;
  dateFormat?: string;
  fontFamily?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}
