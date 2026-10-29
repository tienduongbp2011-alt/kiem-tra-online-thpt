import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  Send,
  ShieldAlert,
  Lock,
  UserCheck,
  FileCheck,
  KeyRound,
  LogOut,
  Search,
  GraduationCap,
} from 'lucide-react';
import {
  Assignment,
  ExamAnswerKey,
  SanitizedQuestion,
  Student,
  Submission,
} from '../types';
import { gradeObjectiveSubmission } from '../data/demoSeedData';

function extractClassCode(str: string): string {
  const m = String(str || '')
    .toUpperCase()
    .match(/\b(10|11|12)[A-Z]\d*\b/);
  return m ? m[0] : String(str || '').trim().toLowerCase();
}

function doesAssignmentMatchStudent(asg: Assignment, st: Student): boolean {
  if (asg.classId && st.classId && asg.classId === st.classId) return true;
  const asgCode = extractClassCode(asg.className || asg.classId);
  const stCode = extractClassCode(st.className || st.classId);
  return Boolean(asgCode && stCode && asgCode === stCode);
}

interface StudentExamPortalProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  answerKeys: ExamAnswerKey[];
  activeStudentId: string;
  isTeacherOrAdmin: boolean;
  onSelectActiveStudent: (studentId: string) => void;
  onSaveOrSubmitAttempt: (
    sub: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    existingId?: string
  ) => Promise<string>;
}

interface DraftSession {
  submissionId?: string;
  assignmentId: string;
  studentId: string;
  startedAt: string;
  expiresAtMs: number;
  answersMap: Record<string, string>;
}

export const StudentExamPortal: React.FC<StudentExamPortalProps> = ({
  students,
  assignments,
  submissions,
  answerKeys,
  activeStudentId,
  isTeacherOrAdmin,
  onSelectActiveStudent,
  onSaveOrSubmitAttempt,
}) => {
  const currentStudent = students.find((s) => s.id === activeStudentId) || null;

  // Student Login Window State inside Portal
  const [loginSelectedStudentId, setLoginSelectedStudentId] = useState<string>(activeStudentId || '');
  const [loginCodeInput, setLoginCodeInput] = useState<string>('');
  const [loginSearchQuery, setLoginSearchQuery] = useState<string>('');
  const [loginClassFilter, setLoginClassFilter] = useState<string>('ALL');
  const [loginError, setLoginError] = useState<string>('');
  const [showStudentLoginModal, setShowStudentLoginModal] = useState<boolean>(!activeStudentId);

  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | undefined>(undefined);
  const [startedAtIso, setStartedAtIso] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const [portalMessage, setPortalMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (activeStudentId) {
      setLoginSelectedStudentId(activeStudentId);
      setShowStudentLoginModal(false);
    } else {
      setShowStudentLoginModal(true);
    }
  }, [activeStudentId]);

  // Restore any active draft session on mount or when student changes
  useEffect(() => {
    if (!currentStudent) return;
    for (const asg of assignments) {
      const storageKey = `thpt_thanh_hoa_draft_${asg.id}_${currentStudent.id}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const draft: DraftSession = JSON.parse(raw);
          const nowMs = Date.now();
          const leftSec = Math.floor((draft.expiresAtMs - nowMs) / 1000);
          if (leftSec > 0 && doesAssignmentMatchStudent(asg, currentStudent)) {
            setActiveAssignment(asg);
            setActiveSubmissionId(draft.submissionId);
            setStartedAtIso(draft.startedAt);
            setRemainingSeconds(leftSec);
            setAnswersMap(draft.answersMap || {});
            setPortalMessage({
              type: 'warning',
              text: 'Đã tự động khôi phục phiên làm bài đang diễn ra của bạn sau khi tải lại trang.',
            });
            break;
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch {
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [currentStudent, assignments]);

  const handleFinalSubmit = useCallback(
    async (isTimeoutAutoSubmit = false) => {
      if (!activeAssignment || !currentStudent) return;

      const questions: SanitizedQuestion[] = activeAssignment.questionsSnapshot || [];
      const keyDoc = answerKeys.find((k) => k.examId === activeAssignment.examId);
      const secretKeyMap = keyDoc?.answersMap || {};

      const { objectiveScore, hasEssay } = gradeObjectiveSubmission(
        questions,
        answersMap,
        secretKeyMap
      );

      const previousAttempts = submissions.filter(
        (s) =>
          s.assignmentId === activeAssignment.id &&
          s.studentId === currentStudent.id &&
          s.id !== activeSubmissionId
      ).length;

      const nowIso = new Date().toISOString();
      const status = hasEssay ? 'Chờ chấm' : 'Đã chấm';
      const gradingStatus = hasEssay ? 'waiting_essay' : 'graded';

      await onSaveOrSubmitAttempt(
        {
          assignmentId: activeAssignment.id,
          examId: activeAssignment.examId,
          examTitle: activeAssignment.examTitle,
          studentId: currentStudent.id,
          studentCode: currentStudent.studentCode,
          studentName: currentStudent.fullName,
          studentUid: currentStudent.studentUid || 'student',
          classId: currentStudent.classId,
          className: currentStudent.className,
          grade: currentStudent.grade,
          attemptNumber: previousAttempts + 1,
          startedAt: startedAtIso || nowIso,
          submittedAt: nowIso,
          status,
          gradingStatus,
          answersMap,
          objectiveScore,
          essayScore: 0,
          totalScore: objectiveScore,
          teacherFeedback: '',
          gradeHistory: [],
          isDemo: currentStudent.isDemo,
        },
        activeSubmissionId
      );

      const storageKey = `thpt_thanh_hoa_draft_${activeAssignment.id}_${currentStudent.id}`;
      localStorage.removeItem(storageKey);

      setShowSubmitConfirm(false);
      setActiveAssignment(null);
      setActiveSubmissionId(undefined);
      setPortalMessage({
        type: 'success',
        text: isTimeoutAutoSubmit
          ? `Đã hết thời gian làm bài! Hệ thống đã tự động thu bài và chấm điểm trắc nghiệm: ${objectiveScore} điểm.`
          : `Nộp bài thành công! Điểm trắc nghiệm tự động: ${objectiveScore} điểm.${
              hasEssay ? ' Câu hỏi tự luận đã chuyển sang trạng thái Chờ giáo viên chấm.' : ''
            }`,
      });
    },
    [
      activeAssignment,
      currentStudent,
      answerKeys,
      answersMap,
      submissions,
      activeSubmissionId,
      startedAtIso,
      onSaveOrSubmitAttempt,
    ]
  );

  // Countdown timer effect
  useEffect(() => {
    if (!activeAssignment || remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAssignment, remainingSeconds, handleFinalSubmit]);

  // Auto-save to localStorage whenever answersMap changes
  useEffect(() => {
    if (!activeAssignment || !currentStudent || remainingSeconds <= 0) return;
    const storageKey = `thpt_thanh_hoa_draft_${activeAssignment.id}_${currentStudent.id}`;
    const existingRaw = localStorage.getItem(storageKey);
    let expiresAtMs = Date.now() + remainingSeconds * 1000;
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        if (parsed.expiresAtMs) expiresAtMs = parsed.expiresAtMs;
      } catch {
        // ignore
      }
    }
    const draft: DraftSession = {
      submissionId: activeSubmissionId,
      assignmentId: activeAssignment.id,
      studentId: currentStudent.id,
      startedAt: startedAtIso,
      expiresAtMs,
      answersMap,
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setLastAutoSaveTime(new Date().toLocaleTimeString('vi-VN'));
  }, [answersMap, activeAssignment, currentStudent, activeSubmissionId, startedAtIso, remainingSeconds]);

  const handleStartExam = async (asg: Assignment) => {
    if (!currentStudent) return;

    // 1. Check class permission
    if (!doesAssignmentMatchStudent(asg, currentStudent)) {
      setPortalMessage({
        type: 'error',
        text: `Từ chối truy cập: Bài kiểm tra "${asg.examTitle}" chỉ giao cho lớp ${asg.className}. Tài khoản của bạn thuộc lớp ${currentStudent.className}.`,
      });
      return;
    }

    // 2. Check due time
    const dueMs = new Date(asg.dueTime).getTime();
    if (!Number.isNaN(dueMs) && Date.now() > dueMs) {
      setPortalMessage({
        type: 'error',
        text: 'Bài kiểm tra này đã quá hạn nộp bài theo quy định của giáo viên.',
      });
      return;
    }

    // 3. Check maxAttempts
    const doneAttempts = submissions.filter(
      (s) =>
        s.assignmentId === asg.id &&
        s.studentId === currentStudent.id &&
        ['Đã nộp', 'Chờ chấm', 'Đã chấm'].includes(s.status)
    ).length;

    if (doneAttempts >= asg.maxAttempts) {
      setPortalMessage({
        type: 'error',
        text: `Bạn đã sử dụng hết số lần làm bài cho phép (${doneAttempts}/${asg.maxAttempts} lần). Hệ thống ngăn nộp thêm theo quy định.`,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const durationSec = (Number(asg.durationMinutes) || 45) * 60;

    // Record 'Đang làm bài' in database
    const subId = await onSaveOrSubmitAttempt({
      assignmentId: asg.id,
      examId: asg.examId,
      examTitle: asg.examTitle,
      studentId: currentStudent.id,
      studentCode: currentStudent.studentCode,
      studentName: currentStudent.fullName,
      studentUid: currentStudent.studentUid || 'student',
      classId: currentStudent.classId,
      className: currentStudent.className,
      grade: currentStudent.grade,
      attemptNumber: doneAttempts + 1,
      startedAt: nowIso,
      status: 'Đang làm bài',
      gradingStatus: 'pending',
      answersMap: {},
      objectiveScore: 0,
      essayScore: 0,
      totalScore: 0,
      isDemo: currentStudent.isDemo,
    });

    const storageKey = `thpt_thanh_hoa_draft_${asg.id}_${currentStudent.id}`;
    const draft: DraftSession = {
      submissionId: subId,
      assignmentId: asg.id,
      studentId: currentStudent.id,
      startedAt: nowIso,
      expiresAtMs: Date.now() + durationSec * 1000,
      answersMap: {},
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));

    setActiveSubmissionId(subId);
    setActiveAssignment(asg);
    setStartedAtIso(nowIso);
    setRemainingSeconds(durationSec);
    setCurrentQuestionIdx(0);
    setAnswersMap({});
    setPortalMessage(null);
  };

  const handleSaveCloudProgress = async () => {
    if (!activeAssignment || !currentStudent) return;
    await onSaveOrSubmitAttempt(
      {
        assignmentId: activeAssignment.id,
        examId: activeAssignment.examId,
        examTitle: activeAssignment.examTitle,
        studentId: currentStudent.id,
        studentCode: currentStudent.studentCode,
        studentName: currentStudent.fullName,
        studentUid: currentStudent.studentUid || 'student',
        classId: currentStudent.classId,
        className: currentStudent.className,
        grade: currentStudent.grade,
        attemptNumber: 1,
        startedAt: startedAtIso,
        status: 'Đang làm bài',
        gradingStatus: 'pending',
        answersMap,
        objectiveScore: 0,
        essayScore: 0,
        totalScore: 0,
        isDemo: currentStudent.isDemo,
      },
      activeSubmissionId
    );
    setPortalMessage({
      type: 'success',
      text: `Đã đồng bộ câu trả lời lên cơ sở dữ liệu lúc ${new Date().toLocaleTimeString('vi-VN')}.`,
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
        <p className="text-base font-bold text-[#0D47A1]">
          Chưa có hồ sơ học sinh trong hệ thống
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Vui lòng thêm học sinh tại Phân hệ Lớp học và Học sinh trước khi vào cổng kiểm tra.
        </p>
      </div>
    );
  }

  // If currently taking an exam
  if (activeAssignment) {
    const questions = activeAssignment.questionsSnapshot || [];
    const currentQ = questions[currentQuestionIdx];
    const answeredCount = questions.filter((q) => Boolean(answersMap[q.id]?.trim())).length;

    const getTrueFalseValue = (qId: string, subId: string): string => {
      const raw = answersMap[qId] || '';
      const found = raw
        .split(',')
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${subId}:`));
      return found ? found.split(':')[1] : '';
    };

    const setTrueFalseValue = (qId: string, subId: string, val: 'Đ' | 'S') => {
      const raw = answersMap[qId] || '';
      const map: Record<string, string> = {};
      raw
        .split(',')
        .filter(Boolean)
        .forEach((p) => {
          const [k, v] = p.split(':');
          if (k && v) map[k] = v;
        });
      map[subId] = val;
      const serialized = Object.entries(map)
        .map(([k, v]) => `${k}:${v}`)
        .join(',');
      setAnswersMap((prev) => ({ ...prev, [qId]: serialized }));
    };

    return (
      <div className="space-y-4">
        {/* Sticky Exam Header Bar */}
        <div className="bg-[#0D47A1] text-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#00C8FF] font-bold">
              <span>PHÒNG THI TRỰC TUYẾN BẢO MẬT</span>
              <span>·</span>
              <span>Học sinh: {currentStudent.fullName} ({currentStudent.studentCode})</span>
              <span>·</span>
              <span>{currentStudent.className}</span>
            </div>
            <h2 className="text-lg font-bold mt-0.5">{activeAssignment.examTitle}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#082F6E] px-4 py-2 rounded-lg border border-[#00C8FF]/40 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF8A00]" />
              <div>
                <p className="text-[11px] text-blue-200">Thời gian còn lại</p>
                <p className="text-xl font-bold tabular-nums text-[#00C8FF]">
                  {formatTimer(remainingSeconds)}
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveCloudProgress}
              className="px-3.5 py-2.5 bg-[#168BFA] hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu bài làm</span>
            </button>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-4 py-2.5 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài ({answeredCount}/{questions.length})</span>
            </button>
          </div>
        </div>

        {portalMessage && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-[#0D47A1]">
            {portalMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Question Area */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 space-y-5">
            {currentQ ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#168BFA]">
                      {currentQ.questionType === 'multiple_choice'
                        ? 'PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN'
                        : currentQ.questionType === 'true_false'
                        ? 'PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI (4 Ý a, b, c, d)'
                        : currentQ.questionType === 'short_answer'
                        ? 'PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN'
                        : 'PHẦN IV. TỰ LUẬN'}
                    </p>
                    <span className="text-sm font-bold text-[#0D47A1]">
                      Câu hỏi {currentQuestionIdx + 1} / {questions.length} (Mã: {currentQ.code} ·{' '}
                      {currentQ.cognitiveLevel})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#FF8A00] tabular-nums">
                    Điểm câu hỏi: {currentQ.points} điểm
                  </span>
                </div>

                <p className="text-base font-bold text-[#17365D] leading-relaxed">
                  {currentQ.content}
                </p>

                {currentQ.codeSnippet && (
                  <pre className="p-4 bg-slate-900 text-cyan-300 rounded-lg text-xs font-mono overflow-x-auto">
                    {currentQ.codeSnippet}
                  </pre>
                )}

                {/* Answer Input by Question Type */}
                {currentQ.questionType === 'multiple_choice' && currentQ.options && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx] || 'A';
                      const selected = answersMap[currentQ.id] === letter;
                      return (
                        <label
                          key={letter}
                          className={`p-3.5 rounded-lg border flex items-center gap-3 cursor-pointer transition-colors ${
                            selected
                              ? 'bg-blue-50 border-[#0D47A1] font-bold text-[#0D47A1]'
                              : 'bg-[#F4F8FC] border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQ.id}`}
                            checked={selected}
                            onChange={() =>
                              setAnswersMap((prev) => ({ ...prev, [currentQ.id]: letter }))
                            }
                          />
                          <span className="text-sm">
                            <strong>{letter}.</strong> {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQ.questionType === 'true_false' && currentQ.subItems && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-600">
                      Câu hỏi có 4 ý a, b, c, d , thí sinh chọn Đúng hoặc Sai:
                    </p>
                    {currentQ.subItems.map((sub) => {
                      const currentVal = getTrueFalseValue(currentQ.id, sub.id);
                      return (
                        <div
                          key={sub.id}
                          className="p-3.5 rounded-lg bg-[#F4F8FC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <span className="text-sm font-medium text-[#17365D]">
                            <strong>{sub.id})</strong> {sub.text}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTrueFalseValue(currentQ.id, sub.id, 'Đ')}
                              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${
                                currentVal === 'Đ'
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              type="button"
                              onClick={() => setTrueFalseValue(currentQ.id, sub.id, 'S')}
                              className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer ${
                                currentVal === 'S'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ.questionType === 'short_answer' && (
                  <div className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-200 space-y-2">
                    <label className="block text-sm font-bold text-[#0D47A1]">
                      .Nội dung trả lời (Học sinh tự nhập đáp án):
                    </label>
                    <input
                      type="text"
                      value={answersMap[currentQ.id] || ''}
                      onChange={(e) =>
                        setAnswersMap((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                      }
                      placeholder="Nhập kết quả hoặc từ khóa trả lời ngắn tại đây..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#17365D]"
                    />
                  </div>
                )}

                {currentQ.questionType === 'essay' && (
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Bài làm tự luận / Viết chương trình Python:
                    </label>
                    <textarea
                      rows={6}
                      value={answersMap[currentQ.id] || ''}
                      onChange={(e) =>
                        setAnswersMap((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                      }
                      placeholder="Nhập lời giải hoặc đoạn mã chương trình của bạn..."
                      className="w-full p-3.5 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx((i) => Math.max(0, i - 1))}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    ← Câu trước
                  </button>
                  <span className="text-xs text-slate-500">
                    Tự động lưu nháp lúc: {lastAutoSaveTime || 'Vừa xong'}
                  </span>
                  <button
                    type="button"
                    disabled={currentQuestionIdx >= questions.length - 1}
                    onClick={() =>
                      setCurrentQuestionIdx((i) => Math.min(questions.length - 1, i + 1))
                    }
                    className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Câu tiếp theo →
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Đề thi chưa có câu hỏi.</p>
            )}
          </div>

          {/* Right: Question Navigator Palette */}
          <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-[#0D47A1]">
              Bảng điều hướng câu hỏi ({answeredCount}/{questions.length} đã trả lời)
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answersMap[q.id]?.trim());
                const isCurrent = idx === currentQuestionIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                      isCurrent
                        ? 'ring-2 ring-[#FF8A00] bg-[#0D47A1] text-white border-[#0D47A1]'
                        : isAnswered
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[#F4F8FC] text-[#17365D] border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
              <p>● Màu xanh lá: Câu hỏi đã trả lời</p>
              <p>● Màu xám nhạt: Câu hỏi chưa trả lời</p>
              <p>● Viền cam: Câu hỏi đang chọn</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Lưu ý: Đáp án chính xác của đề thi được bảo mật trên máy chủ và không tải xuống trình duyệt trong quá trình làm bài.
              </p>
            </div>
          </div>
        </div>

        {/* Confirm Submit Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-[#0D47A1]">Xác nhận nộp bài kiểm tra</h3>
              <p className="text-sm text-slate-700">
                Bạn đã trả lời <strong>{answeredCount}</strong> trên tổng số{' '}
                <strong>{questions.length}</strong> câu hỏi. Thời gian còn lại:{' '}
                <strong>{formatTimer(remainingSeconds)}</strong>.
              </p>
              {answeredCount < questions.length && (
                <p className="text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
                  Cảnh báo: Bạn vẫn còn {questions.length - answeredCount} câu hỏi chưa làm!
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Quay lại làm tiếp
                </button>
                <button
                  onClick={() => handleFinalSubmit(false)}
                  className="px-4 py-2 bg-[#FF8A00] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Xác nhận Nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handlePortalStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const targetSt = students.find((s) => s.id === loginSelectedStudentId);
    if (!targetSt) {
      setLoginError('Vui lòng chọn đúng tên học sinh trong danh sách.');
      return;
    }
    const cleanInput = loginCodeInput.trim().toLowerCase();
    if (!cleanInput) {
      setLoginError('Vui lòng nhập Mã đăng nhập để xác thực vào phòng thi.');
      return;
    }
    const validLoginCode = String(targetSt.loginCode || '').trim().toLowerCase();
    const validStudentCode = String(targetSt.studentCode || '').trim().toLowerCase();

    if (cleanInput === validLoginCode || cleanInput === validStudentCode) {
      onSelectActiveStudent(targetSt.id);
      setShowStudentLoginModal(false);
      setLoginCodeInput('');
      setLoginError('');
      setPortalMessage({
        type: 'success',
        text: `Đăng nhập thành công! Xin chào học sinh ${targetSt.fullName} (${targetSt.className}). Bạn có thể chọn bài kiểm tra bên dưới để bắt đầu làm bài.`,
      });
    } else {
      setLoginError(
        `Mã đăng nhập không chính xác cho học sinh "${targetSt.fullName}". Vui lòng kiểm tra lại Mã đăng nhập hoặc Mã học sinh.`
      );
    }
  };

  const distinctStudentClasses = Array.from(
    new Set(students.map((s) => String(s.className || '').trim()).filter(Boolean))
  );

  const filteredLoginStudents = students.filter((st) => {
    const matchCls =
      loginClassFilter === 'ALL' || String(st.className || '').trim() === loginClassFilter;
    const q = loginSearchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      String(st.fullName || '').toLowerCase().includes(q) ||
      String(st.studentCode || '').toLowerCase().includes(q);
    return matchCls && matchSearch;
  });

  // If no student is authenticated or user clicked "Đổi học sinh", render the Student Login Window
  if (!currentStudent || showStudentLoginModal) {
    const previewChosenStudent = students.find((s) => s.id === loginSelectedStudentId);
    return (
      <div className="max-w-2xl mx-auto my-6 bg-white rounded-2xl border-2 border-[#168BFA] shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0D47A1] to-[#168BFA] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15">
              <GraduationCap className="w-6 h-6 text-[#00C8FF]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C8FF]">
                Cổng Kiểm Tra Trực Tuyến · THPT Thanh Hòa
              </span>
              <h2 className="text-lg font-bold text-white">
                CỬA SỔ ĐĂNG NHẬP HỌC SINH VÀO LÀM BÀI THI
              </h2>
            </div>
          </div>
          {currentStudent && (
            <button
              type="button"
              onClick={() => setShowStudentLoginModal(false)}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold text-white cursor-pointer"
            >
              Quay lại
            </button>
          )}
        </div>

        <form onSubmit={handlePortalStudentLogin} className="p-6 space-y-4">
          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F8FC] p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-[#0D47A1] mb-1">
                Lọc theo Lớp học:
              </label>
              <select
                value={loginClassFilter}
                onChange={(e) => {
                  setLoginClassFilter(e.target.value);
                  setLoginSelectedStudentId('');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#17365D]"
              >
                <option value="ALL">Tất cả các lớp ({students.length} HS)</option>
                {distinctStudentClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0D47A1] mb-1">
                Tìm nhanh tên học sinh:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loginSearchQuery}
                  onChange={(e) => setLoginSearchQuery(e.target.value)}
                  placeholder="Gõ tên hoặc mã HS..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0D47A1] mb-1.5">
              Bước 1: Chọn đúng tên học sinh trong danh sách (*):
            </label>
            <select
              value={loginSelectedStudentId}
              onChange={(e) => {
                setLoginSelectedStudentId(e.target.value);
                setLoginError('');
              }}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#168BFA] rounded-xl text-sm font-bold text-[#0D47A1]"
            >
              <option value="">
                -- Chọn họ và tên học sinh ({filteredLoginStudents.length} học sinh) --
              </option>
              {filteredLoginStudents.map((st, idx) => (
                <option key={st.id} value={st.id}>
                  {idx + 1}. {st.fullName} — {st.className} (Mã HS: {st.studentCode})
                </option>
              ))}
            </select>

            <div className="mt-2.5 border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto divide-y divide-slate-100">
              {filteredLoginStudents.map((st, idx) => {
                const isSelected = st.id === loginSelectedStudentId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setLoginSelectedStudentId(st.id);
                      setLoginError('');
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#0D47A1] text-white font-bold'
                        : 'hover:bg-blue-50 text-[#17365D]'
                    }`}
                  >
                    <span>
                      {idx + 1}. <strong>{st.fullName}</strong>
                    </span>
                    <span>
                      {st.className} · Mã: {st.studentCode}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {previewChosenStudent && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Học sinh đã chọn: {previewChosenStudent.fullName}</p>
                <p>
                  Lớp: <strong>{previewChosenStudent.className}</strong> · Mã HS:{' '}
                  <strong>{previewChosenStudent.studentCode}</strong>
                </p>
              </div>
              {isTeacherOrAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    setLoginCodeInput(
                      previewChosenStudent.loginCode || previewChosenStudent.studentCode
                    )
                  }
                  className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  GV điền nhanh mã ({previewChosenStudent.loginCode || previewChosenStudent.studentCode})
                </button>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-[#0D47A1] mb-1.5">
              Bước 2: Nhập Mã đăng nhập của học sinh (*):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={loginCodeInput}
                onChange={(e) => {
                  setLoginCodeInput(e.target.value);
                  setLoginError('');
                }}
                placeholder="Nhập Mã đăng nhập (hoặc Mã học sinh)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-300 focus:border-[#0D47A1] rounded-xl text-sm font-bold text-[#17365D] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>XÁC NHẬN ĐĂNG NHẬP & VÀO PHÒNG THI</span>
          </button>
        </form>
      </div>
    );
  }

  // Portal Lobby View
  const myClassAssignments = assignments.filter((a) =>
    doesAssignmentMatchStudent(a, currentStudent)
  );
  const otherClassAssignments = assignments.filter(
    (a) => !doesAssignmentMatchStudent(a, currentStudent)
  );
  const mySubmissions = submissions.filter(
    (s) =>
      s.studentId === currentStudent.id ||
      (s.studentCode &&
        currentStudent.studentCode &&
        s.studentCode.toLowerCase() === currentStudent.studentCode.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Student Session Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0D47A1] text-white">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0D47A1]">
              Phân hệ 5: Cổng Kiểm tra Trực tuyến dành cho Học sinh
            </h2>
            <p className="text-xs text-slate-600">
              Học sinh đang đăng nhập: <strong className="text-[#0D47A1]">{currentStudent.fullName}</strong>{' '}
              (Mã HS: <strong>{currentStudent.studentCode}</strong> · Lớp:{' '}
              <strong>{currentStudent.className}</strong>)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoginCodeInput('');
              setLoginError('');
              setShowStudentLoginModal(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#FF8A00] hover:bg-[#e67c00] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đổi học sinh / Đăng nhập HS khác</span>
          </button>
        </div>
      </div>

      {portalMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            portalMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : portalMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            {portalMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-700" />
            )}
            <span>{portalMessage.text}</span>
          </div>
          <button
            onClick={() => setPortalMessage(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Assigned Exams for Student's Class */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-[#0D47A1]">
          Danh sách Bài kiểm tra được giao cho lớp {currentStudent.className}
        </h3>
        {myClassAssignments.length === 0 ? (
          <div className="p-8 text-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300">
            <p className="text-sm font-bold text-slate-600">
              Hiện tại lớp {currentStudent.className} chưa có bài kiểm tra nào đang mở.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClassAssignments.map((asg) => {
              const attemptsUsed = mySubmissions.filter(
                (s) =>
                  s.assignmentId === asg.id &&
                  ['Đã nộp', 'Chờ chấm', 'Đã chấm'].includes(s.status)
              ).length;

              return (
                <div
                  key={asg.id}
                  className="p-4 rounded-xl bg-[#F4F8FC] border border-slate-200 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{asg.examCategory || 'Kiểm tra định kỳ'}</span>
                      <span className="font-bold text-emerald-700">● Đang mở</span>
                    </div>
                    <h4 className="text-base font-bold text-[#0D47A1] mt-1">{asg.examTitle}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Thời lượng: <strong>{asg.durationMinutes} phút</strong> · Số câu:{' '}
                      <strong>{(asg.questionsSnapshot || []).length} câu</strong> · Số lượt đã làm:{' '}
                      <strong>
                        {attemptsUsed}/{asg.maxAttempts}
                      </strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      Hạn nộp: {asg.dueTime.replace('T', ' ')}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => handleStartExam(asg)}
                      className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Bắt đầu làm bài</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security Verification Section: Unassigned Class Exams */}
      {otherClassAssignments.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>
              Bài kiểm tra của các lớp khác (Kiểm tra phân quyền: Học sinh lớp {currentStudent.className} không được phép mở đề)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherClassAssignments.map((asg) => (
              <div
                key={asg.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-700">{asg.examTitle}</p>
                  <p className="text-[11px] text-slate-500">Lớp được giao: {asg.className}</p>
                </div>
                <button
                  onClick={() => handleStartExam(asg)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Thử truy cập</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Submissions & Results History (Strictly Isolated to Current Student) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#0D47A1]" />
            <h3 className="text-base font-bold text-[#0D47A1]">
              Kết quả bài làm cá nhân của {currentStudent.fullName}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Bảo mật: Học sinh chỉ xem được điểm số và bài làm của chính mình
          </span>
        </div>

        {mySubmissions.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 bg-[#F4F8FC] rounded-lg">
            Bạn chưa có bài nộp nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-[#0D47A1] text-white">
                <tr>
                  <th className="p-3">Bài kiểm tra</th>
                  <th className="p-3">Lần làm</th>
                  <th className="p-3">Thời gian nộp</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Điểm Trắc nghiệm</th>
                  <th className="p-3 text-right">Điểm Tự luận</th>
                  <th className="p-3 text-right">Tổng điểm</th>
                  <th className="p-3">Nhận xét của Giáo viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {mySubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F4F8FC]">
                    <td className="p-3 font-bold text-[#0D47A1]">{sub.examTitle}</td>
                    <td className="p-3 tabular-nums">Lần {sub.attemptNumber}</td>
                    <td className="p-3 tabular-nums">
                      {(sub.submittedAt || sub.startedAt).slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="p-3 font-bold">{sub.status}</td>
                    <td className="p-3 text-right tabular-nums font-semibold">
                      {sub.objectiveScore}
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold">
                      {sub.status === 'Chờ chấm' ? 'Chờ GV chấm' : sub.essayScore}
                    </td>
                    <td className="p-3 text-right tabular-nums font-bold text-[#FF8A00]">
                      {sub.totalScore}
                    </td>
                    <td className="p-3 text-slate-600">{sub.teacherFeedback || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
