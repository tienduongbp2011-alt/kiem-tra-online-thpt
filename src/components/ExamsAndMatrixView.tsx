import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Edit3,
  Trash2,
  Send,
  Printer,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Download,
  Upload,
  RefreshCw,
  Wand2,
  Shuffle,
} from 'lucide-react';
import {
  Assignment,
  ClassRoom,
  CognitiveLevel,
  Exam,
  ExamAnswerKey,
  ExamCategory,
  ExamStatus,
  GradeLevel,
  MatrixRow,
  Question,
  QuestionType,
} from '../types';
import {
  buildAnswerKeyFromQuestions,
  buildShuffledQuestionsForAttempt,
  sanitizeQuestionsForStudent,
} from '../data/demoSeedData';
import {
  downloadMatrixExcelTemplate,
  exportExamWithMatrixToWord,
  parseMatrixExcelFile,
} from '../utils/officeDocumentUtils';

interface ExamsAndMatrixViewProps {
  exams: Exam[];
  answerKeys: ExamAnswerKey[];
  questions: Question[];
  classes: ClassRoom[];
  assignments: Assignment[];
  preselectedQuestions: Question[];
  onClearPreselected: () => void;
  onSaveExam: (
    examData: Omit<Exam, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    answerKeyData: Omit<ExamAnswerKey, 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => Promise<void>;
  onDeleteExam: (examId: string) => Promise<void>;
  onCreateAssignment: (
    asg: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => Promise<void>;
}

export const ExamsAndMatrixView: React.FC<ExamsAndMatrixViewProps> = ({
  exams,
  answerKeys,
  questions,
  classes,
  assignments,
  preselectedQuestions,
  onClearPreselected,
  onSaveExam,
  onDeleteExam,
  onCreateAssignment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Exam Creator/Editor Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    code: '',
    title: '',
    category: 'Kiểm tra giữa kỳ' as ExamCategory,
    grade: '10' as GradeLevel,
    topic: '',
    durationMinutes: 45,
    totalPoints: 10,
    status: 'open' as ExamStatus,
    selectedQuestionIds: [] as string[],
    matrixRows: [] as MatrixRow[],
    shuffleQuestions: true,
    shuffleAnswers: true,
    isDemo: false,
  });

  // Matrix Mismatch Confirmation Warning
  const [matrixWarning, setMatrixWarning] = useState<string | null>(null);

  // Assign Exam Modal
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [assignForm, setAssignForm] = useState({
    classId: '',
    startTime: '2026-10-23T08:00',
    dueTime: '2026-12-31T23:59',
    durationMinutes: 45,
    maxAttempts: 1,
    resultReleaseMode: 'immediate' as 'immediate' | 'after_due' | 'manual',
    showAnswersAfterSubmit: true,
    shuffleQuestions: true,
    shuffleAnswers: true,
  });

  // Teacher Answer Key Modal & Printable Preview Modal
  const [viewingKeyExam, setViewingKeyExam] = useState<Exam | null>(null);
  const [printableExam, setPrintableExam] = useState<Exam | null>(null);

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 3-Part Matrix Builder state (Select Topic/Lesson -> enter NB, TH, VD, VDC counts for Phần I, II, III)
  type LevelCounts = Record<CognitiveLevel, number>;
  interface TopicThreePartConfig {
    selected: boolean;
    multiple_choice: LevelCounts;
    true_false: LevelCounts;
    short_answer: LevelCounts;
  }
  const [topicMatrixMap, setTopicMatrixMap] = useState<Record<string, TopicThreePartConfig>>({});

  // Sync available topics from Question Bank whenever grade or questions change
  useEffect(() => {
    const gradeQuestions = questions.filter((q) => q.grade === examForm.grade);
    const uniqueTopics = Array.from(new Set(gradeQuestions.map((q) => q.topic)));

    setTopicMatrixMap((prev) => {
      const next: Record<string, TopicThreePartConfig> = {};
      uniqueTopics.forEach((topic) => {
        if (prev[topic]) {
          next[topic] = prev[topic];
        } else {
          const countInBank = (type: QuestionType, lv: CognitiveLevel) =>
            gradeQuestions.filter(
              (q) => q.topic === topic && q.questionType === type && q.cognitiveLevel === lv
            ).length;
          next[topic] = {
            selected: true,
            multiple_choice: {
              'Nhận biết': countInBank('multiple_choice', 'Nhận biết'),
              'Thông hiểu': countInBank('multiple_choice', 'Thông hiểu'),
              'Vận dụng': countInBank('multiple_choice', 'Vận dụng'),
              'Vận dụng cao': countInBank('multiple_choice', 'Vận dụng cao'),
            },
            true_false: {
              'Nhận biết': countInBank('true_false', 'Nhận biết'),
              'Thông hiểu': countInBank('true_false', 'Thông hiểu'),
              'Vận dụng': countInBank('true_false', 'Vận dụng'),
              'Vận dụng cao': countInBank('true_false', 'Vận dụng cao'),
            },
            short_answer: {
              'Nhận biết': countInBank('short_answer', 'Nhận biết'),
              'Thông hiểu': countInBank('short_answer', 'Thông hiểu'),
              'Vận dụng': countInBank('short_answer', 'Vận dụng'),
              'Vận dụng cao': countInBank('short_answer', 'Vận dụng cao'),
            },
          };
        }
      });
      return next;
    });
  }, [examForm.grade, questions]);

  const getBankCountByTopicTypeLevel = (
    topic: string,
    qType: QuestionType,
    level: CognitiveLevel
  ) => {
    return questions.filter(
      (q) =>
        q.grade === examForm.grade &&
        q.topic === topic &&
        q.questionType === qType &&
        q.cognitiveLevel === level
    ).length;
  };

  const handleUpdateTopicCell = (
    topic: string,
    part: 'multiple_choice' | 'true_false' | 'short_answer',
    level: CognitiveLevel,
    val: number
  ) => {
    setTopicMatrixMap((prev) => {
      const current = prev[topic];
      if (!current) return prev;
      return {
        ...prev,
        [topic]: {
          ...current,
          selected: true,
          [part]: {
            ...current[part],
            [level]: Math.max(0, val),
          },
        },
      };
    });
  };

  // Build Exam & Matrix from the 3-Part Topic Grid (Phần I: TN, Phần II: Đúng/Sai, Phần III: Trả lời ngắn)
  const handleBuildFromThreePartGrid = () => {
    const selectedTopics = Object.entries(topicMatrixMap).filter(([, cfg]) => cfg.selected);
    if (selectedTopics.length === 0) {
      setBanner({
        type: 'error',
        text: 'Vui lòng tích chọn ít nhất 1 Chủ đề / Bài học từ Ngân hàng câu hỏi để tạo đề.',
      });
      return;
    }

    const levels: CognitiveLevel[] = ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'];
    const parts: {
      key: 'multiple_choice' | 'true_false' | 'short_answer';
      label: string;
      defaultPointsPerQ: number;
    }[] = [
      { key: 'multiple_choice', label: 'Phần I - Trắc nghiệm 4 lựa chọn', defaultPointsPerQ: 0.25 },
      { key: 'true_false', label: 'Phần II - Trắc nghiệm Đúng/Sai (4 ý)', defaultPointsPerQ: 1.0 },
      { key: 'short_answer', label: 'Phần III - Trắc nghiệm trả lời ngắn', defaultPointsPerQ: 0.5 },
    ];

    const defaultSpecByLevel: Record<CognitiveLevel, string> = {
      'Nhận biết': 'Nhận biết khái niệm, cú pháp và đặc điểm cơ bản của chủ đề.',
      'Thông hiểu': 'Hiểu và giải thích được nguyên lý hoạt động hoặc kết quả thực hiện lệnh.',
      'Vận dụng': 'Vận dụng kiến thức để giải quyết bài toán thực hành Tin học.',
      'Vận dụng cao': 'Phân tích, thiết kế thuật toán hoặc giải quyết bài toán thực tiễn nâng cao.',
    };

    const newMatrixRows: MatrixRow[] = [];
    const pickedQuestionIds: string[] = [];
    const shortages: string[] = [];

    // Order questions strictly: Phần I -> Phần II -> Phần III
    parts.forEach((part) => {
      selectedTopics.forEach(([topic, cfg]) => {
        levels.forEach((lv) => {
          const requestedCount = Number(cfg[part.key][lv]) || 0;
          if (requestedCount <= 0) return;

          const candidates = questions.filter(
            (q) =>
              q.grade === examForm.grade &&
              q.topic === topic &&
              q.questionType === part.key &&
              q.cognitiveLevel === lv &&
              !pickedQuestionIds.includes(q.id)
          );
          const shuffled = [...candidates].sort(() => Math.random() - 0.5);
          const chosen = shuffled.slice(0, requestedCount);
          chosen.forEach((q) => pickedQuestionIds.push(q.id));

          if (chosen.length < requestedCount) {
            shortages.push(
              `${part.label} - ${topic} [${lv}]: chọn ${requestedCount} câu nhưng kho có ${chosen.length} câu`
            );
          }

          const rowPts =
            chosen.length > 0
              ? Math.round(chosen.reduce((s, q) => s + (Number(q.points) || part.defaultPointsPerQ), 0) * 100) /
                100
              : Math.round(requestedCount * part.defaultPointsPerQ * 100) / 100;

          newMatrixRows.push({
            id: `m3p_${Date.now()}_${newMatrixRows.length}`,
            topic,
            knowledgeUnit: part.label,
            specification: `${defaultSpecByLevel[lv]} (${topic})`,
            cognitiveLevel: lv,
            questionType: part.key,
            questionCount: requestedCount,
            pointsPerQuestion: Math.round((rowPts / requestedCount) * 100) / 100,
            totalPoints: rowPts,
            percentage: 0, // updated below
          });
        });
      });
    });

    if (newMatrixRows.length === 0) {
      setBanner({
        type: 'error',
        text: 'Vui lòng nhập số câu (NB, TH, VD hoặc VDC > 0) ở ít nhất một phần để tạo đề.',
      });
      return;
    }

    const totalMatrixPts =
      Math.round(newMatrixRows.reduce((s, r) => s + r.totalPoints, 0) * 100) / 100 || 10;
    const finalizedRows = newMatrixRows.map((r) => ({
      ...r,
      percentage: Math.round((r.totalPoints / totalMatrixPts) * 100),
    }));

    const topicSummary = selectedTopics.map(([t]) => t).join('; ');
    const defaultTitle =
      examForm.title.trim() ||
      `${examForm.category} Tin học ${examForm.grade} (${selectedTopics.length} chủ đề)`;

    setExamForm((prev) => ({
      ...prev,
      title: defaultTitle,
      topic: topicSummary,
      totalPoints: totalMatrixPts,
      matrixRows: finalizedRows,
      selectedQuestionIds: pickedQuestionIds,
    }));

    if (shortages.length > 0) {
      setBanner({
        type: 'error',
        text: `Đã tạo bộ đề gồm ${pickedQuestionIds.length} câu hỏi. Lưu ý một số mục vượt số câu tồn kho: ${shortages.join(' | ')}`,
      });
    } else {
      setBanner({
        type: 'success',
        text: `Đã tạo thành công bộ "${defaultTitle}" gồm ${pickedQuestionIds.length} câu hỏi (${totalMatrixPts} điểm) theo đúng Ma trận 3 Phần (Phần I, Phần II, Phần III)!`,
      });
    }
  };

  // Open exam builder automatically if teacher selected questions from Question Bank
  useEffect(() => {
    if (preselectedQuestions.length > 0) {
      const firstGrade = preselectedQuestions[0].grade;
      const sumPts = preselectedQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
      setEditingExam(null);
      setExamForm({
        code: `DE${firstGrade}-${Date.now().toString().slice(-4)}`,
        title: `Đề Kiểm tra Tin học Khối ${firstGrade}`,
        category: 'Kiểm tra thường xuyên',
        grade: firstGrade,
        topic: preselectedQuestions[0].topic,
        durationMinutes: 45,
        totalPoints: sumPts || 10,
        status: 'open',
        selectedQuestionIds: preselectedQuestions.map((q) => q.id),
        matrixRows: [
          {
            id: `m_${Date.now()}`,
            topic: preselectedQuestions[0].topic,
            knowledgeUnit: 'Kiến thức trọng tâm',
            cognitiveLevel: 'Thông hiểu',
            questionType: 'multiple_choice',
            questionCount: preselectedQuestions.length,
            pointsPerQuestion:
              Math.round((sumPts / preselectedQuestions.length) * 100) / 100 || 1,
            totalPoints: sumPts,
            percentage: 100,
          },
        ],
        shuffleQuestions: true,
        shuffleAnswers: true,
        isDemo: false,
      });
      setShowExamModal(true);
      onClearPreselected();
    }
  }, [preselectedQuestions, onClearPreselected]);

  const filteredExams = exams.filter((ex) => {
    const matchCat = categoryFilter === 'ALL' || ex.category === categoryFilter;
    const matchGrade = gradeFilter === 'ALL' || ex.grade === gradeFilter;
    const matchSearch =
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchGrade && matchSearch;
  });

  const openNewExamModal = () => {
    setEditingExam(null);
    setMatrixWarning(null);
    const defaultG10 = questions.filter((q) => q.grade === '10').map((q) => q.id);
    setExamForm({
      code: `DE10-${Date.now().toString().slice(-4)}`,
      title: '',
      category: 'Kiểm tra giữa kỳ',
      grade: '10',
      topic: 'Lập trình Python & Giải quyết vấn đề',
      durationMinutes: 45,
      totalPoints: 10,
      status: 'open',
      selectedQuestionIds: defaultG10,
      matrixRows: [
        {
          id: 'row_1',
          topic: 'Chủ đề 1 & 5: Tin học 10',
          knowledgeUnit: 'Tổng hợp kiến thức theo ma trận',
          cognitiveLevel: 'Thông hiểu',
          questionType: 'multiple_choice',
          questionCount: defaultG10.length,
          pointsPerQuestion: 2.5,
          totalPoints: 10,
          percentage: 100,
        },
      ],
      shuffleQuestions: true,
      shuffleAnswers: true,
      isDemo: false,
    });
    setShowExamModal(true);
  };

  const openEditExamModal = (ex: Exam) => {
    setEditingExam(ex);
    setMatrixWarning(null);
    setExamForm({
      code: ex.code,
      title: ex.title,
      category: ex.category,
      grade: ex.grade,
      topic: ex.topic || '',
      durationMinutes: ex.durationMinutes,
      totalPoints: ex.totalPoints,
      status: ex.status,
      selectedQuestionIds: (ex.questionsSanitized || []).map((q) => q.id),
      matrixRows: ex.matrixRows || [],
      shuffleQuestions: ex.shuffleQuestions !== false,
      shuffleAnswers: ex.shuffleAnswers !== false,
      isDemo: ex.isDemo,
    });
    setShowExamModal(true);
  };

  // Calculate actual vs matrix stats
  const selectedQuestionsList = questions.filter((q) =>
    examForm.selectedQuestionIds.includes(q.id)
  );
  const actualQuestionCount = selectedQuestionsList.length;
  const actualTotalPoints =
    Math.round(selectedQuestionsList.reduce((acc, q) => acc + (Number(q.points) || 0), 0) * 100) /
    100;

  const matrixTotalQuestions = examForm.matrixRows.reduce(
    (acc, r) => acc + (Number(r.questionCount) || 0),
    0
  );
  const matrixTotalPoints =
    Math.round(
      examForm.matrixRows.reduce((acc, r) => acc + (Number(r.totalPoints) || 0), 0) * 100
    ) / 100;

  const addMatrixRow = () => {
    setExamForm((prev) => ({
      ...prev,
      matrixRows: [
        ...prev.matrixRows,
        {
          id: `m_${Date.now()}`,
          topic: 'Chủ đề kiến thức mới',
          knowledgeUnit: 'Nội dung đánh giá',
          specification: 'Xác định và vận dụng được kiến thức trọng tâm trong bài học.',
          cognitiveLevel: 'Nhận biết',
          questionType: 'multiple_choice',
          questionCount: 1,
          pointsPerQuestion: 1.0,
          totalPoints: 1.0,
          percentage: 10,
        },
      ],
    }));
  };

  // Match questions in bank for a specific MatrixRow
  const getMatchingQuestionsForRow = (row: MatrixRow) => {
    const gradeQuestions = questions.filter((q) => q.grade === examForm.grade);
    return gradeQuestions.filter((q) => {
      const matchLevel = q.cognitiveLevel === row.cognitiveLevel;
      const matchType = q.questionType === row.questionType;
      const rowTopicClean = (row.topic || '').trim().toLowerCase();
      const matchTopic =
        !rowTopicClean ||
        rowTopicClean === 'chủ đề kiến thức mới' ||
        q.topic.toLowerCase().includes(rowTopicClean) ||
        rowTopicClean.includes(q.topic.toLowerCase());
      const rowUnitClean = (row.knowledgeUnit || '').trim().toLowerCase();
      const qUnitClean = (q.knowledgeUnit || q.lesson || '').trim().toLowerCase();
      const matchUnit =
        !rowUnitClean ||
        rowUnitClean === 'nội dung đánh giá' ||
        rowUnitClean === 'tổng hợp kiến thức theo ma trận' ||
        rowUnitClean === 'kiến thức trọng tâm' ||
        qUnitClean.includes(rowUnitClean) ||
        rowUnitClean.includes(qUnitClean);
      return matchLevel && matchType && matchTopic && matchUnit;
    });
  };

  // Auto-build Matrix & Specification rows from available questions in Question Bank for selected grade
  const handleGenerateMatrixFromBank = () => {
    const gradeQuestions = questions.filter((q) => q.grade === examForm.grade);
    if (gradeQuestions.length === 0) {
      setBanner({
        type: 'error',
        text: `Ngân hàng câu hỏi hiện chưa có câu hỏi nào thuộc Khối ${examForm.grade}.`,
      });
      return;
    }

    const groups = new Map<string, Question[]>();
    gradeQuestions.forEach((q) => {
      const key = `${q.topic}|||${q.knowledgeUnit || q.lesson || 'Kiến thức trọng tâm'}|||${q.cognitiveLevel}|||${q.questionType}`;
      const list = groups.get(key) || [];
      list.push(q);
      groups.set(key, list);
    });

    const sumAllPoints =
      Math.round(gradeQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0) * 100) / 100 ||
      10;

    const defaultSpecByLevel: Record<CognitiveLevel, string> = {
      'Nhận biết': 'Nhận biết, nêu được khái niệm, cú pháp và đặc điểm cơ bản của đơn vị kiến thức.',
      'Thông hiểu': 'Giải thích, phân biệt và mô tả được nguyên lý hoạt động hoặc kết quả thực thi đoạn lệnh.',
      'Vận dụng': 'Vận dụng kiến thức để viết câu lệnh, sửa lỗi chương trình hoặc giải bài toán thực hành.',
      'Vận dụng cao': 'Phân tích bài toán thực tiễn phức tạp, thiết kế thuật toán tối ưu để giải quyết vấn đề.',
    };

    const generatedRows: MatrixRow[] = Array.from(groups.entries()).map(([key, qList], index) => {
      const [topic, knowledgeUnit, cognitiveLevel, questionType] = key.split('|||');
      const rowPoints =
        Math.round(qList.reduce((acc, q) => acc + (Number(q.points) || 0), 0) * 100) / 100;
      const ptsPerQ = Math.round((rowPoints / qList.length) * 100) / 100;
      const lvl = cognitiveLevel as CognitiveLevel;
      return {
        id: `m_auto_${Date.now()}_${index}`,
        topic,
        knowledgeUnit,
        specification: `${defaultSpecByLevel[lvl]} (${knowledgeUnit})`,
        cognitiveLevel: lvl,
        questionType: questionType as QuestionType,
        questionCount: qList.length,
        pointsPerQuestion: ptsPerQ,
        totalPoints: rowPoints,
        percentage: Math.round((rowPoints / sumAllPoints) * 100),
      };
    });

    setExamForm((prev) => ({
      ...prev,
      totalPoints: sumAllPoints,
      matrixRows: generatedRows,
      selectedQuestionIds: gradeQuestions.map((q) => q.id),
    }));
    setBanner({
      type: 'success',
      text: `Đã tự động xây dựng Khung Ma trận & Bản Đặc tả (${generatedRows.length} dòng) từ Ngân hàng câu hỏi Khối ${examForm.grade}.`,
    });
  };

  // Auto-draw questions from Question Bank matching the current Matrix & Specification rows
  const handleAutoPickQuestionsFromMatrix = () => {
    if (examForm.matrixRows.length === 0) {
      setBanner({
        type: 'error',
        text: 'Vui lòng thêm ít nhất 1 dòng trong Khung Ma trận trước khi rút câu hỏi tự động.',
      });
      return;
    }

    const pickedIds = new Set<string>();
    const shortages: string[] = [];

    examForm.matrixRows.forEach((row, idx) => {
      const candidates = getMatchingQuestionsForRow(row).filter((q) => !pickedIds.has(q.id));
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, row.questionCount);
      selected.forEach((q) => pickedIds.add(q.id));

      if (selected.length < row.questionCount) {
        shortages.push(
          `Dòng ${idx + 1} (${row.topic} - ${row.cognitiveLevel}): cần ${row.questionCount} câu nhưng kho hiện có ${selected.length} câu khớp`
        );
      }
    });

    const newSelectedIds = Array.from(pickedIds);
    const pickedQuestions = questions.filter((q) => newSelectedIds.includes(q.id));
    const sumPoints =
      Math.round(pickedQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0) * 100) / 100;

    setExamForm((prev) => ({
      ...prev,
      selectedQuestionIds: newSelectedIds,
      totalPoints: sumPoints > 0 ? sumPoints : prev.totalPoints,
    }));

    if (shortages.length > 0) {
      setBanner({
        type: 'error',
        text: `Đã rút ${newSelectedIds.length} câu hỏi. Lưu ý thiếu câu ở: ${shortages.join('; ')}`,
      });
    } else {
      setBanner({
        type: 'success',
        text: `Đã rút tự động ${newSelectedIds.length} câu hỏi (${sumPoints} điểm) khớp 100% với Khung Ma trận & Bản Đặc tả!`,
      });
    }
  };

  // Upload Matrix & Specification from Excel (.xlsx)
  const handleMatrixExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedRows = await parseMatrixExcelFile(file);
      if (parsedRows.length === 0) {
        setBanner({
          type: 'error',
          text: 'Không tìm thấy dòng ma trận hợp lệ trong tệp Excel (.xlsx). Vui lòng tải file mẫu Ma trận Excel chuẩn.',
        });
        return;
      }
      const sumPts =
        Math.round(parsedRows.reduce((acc, r) => acc + (Number(r.totalPoints) || 0), 0) * 100) /
          100 || 10;
      setExamForm((prev) => ({
        ...prev,
        totalPoints: sumPts,
        matrixRows: parsedRows,
      }));
      setBanner({
        type: 'success',
        text: `Đã nạp thành công ${parsedRows.length} dòng Khung Ma trận & Bản Đặc tả từ tệp Excel (.xlsx). Nhấn "Bước 2: Rút câu hỏi tự động theo Ma trận" để chọn đề!`,
      });
    } catch {
      setBanner({
        type: 'error',
        text: 'Lỗi đọc tệp Excel (.xlsx). Vui lòng kiểm tra lại định dạng tệp.',
      });
    } finally {
      e.target.value = '';
    }
  };

  // Swap a single selected question with another matching question in the Question Bank
  const handleSwapSingleQuestion = (oldQ: Question) => {
    const candidates = questions.filter(
      (q) =>
        q.grade === oldQ.grade &&
        q.cognitiveLevel === oldQ.cognitiveLevel &&
        q.questionType === oldQ.questionType &&
        q.id !== oldQ.id &&
        !examForm.selectedQuestionIds.includes(q.id)
    );
    if (candidates.length === 0) {
      setBanner({
        type: 'error',
        text: `Không còn câu hỏi dự phòng nào khác trong Ngân hàng có cùng Khối ${oldQ.grade}, mức độ "${oldQ.cognitiveLevel}" và dạng "${oldQ.questionType}" để đổi.`,
      });
      return;
    }
    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
    setExamForm((prev) => ({
      ...prev,
      selectedQuestionIds: prev.selectedQuestionIds.map((id) =>
        id === oldQ.id ? replacement.id : id
      ),
    }));
    setBanner({
      type: 'success',
      text: `Đã đổi câu [${oldQ.code}] sang câu [${replacement.code}] cùng mức độ "${replacement.cognitiveLevel}".`,
    });
  };

  const handleSaveExamSubmit = async (forceConfirm = false) => {
    if (!examForm.code.trim() || !examForm.title.trim()) {
      setBanner({ type: 'error', text: 'Vui lòng nhập Mã đề và Tên đề kiểm tra.' });
      return;
    }

    // Check Matrix vs Actual consistency without automatically modifying the teacher's matrix
    if (!forceConfirm && examForm.matrixRows.length > 0) {
      const discrepancies: string[] = [];
      if (matrixTotalQuestions !== actualQuestionCount) {
        discrepancies.push(
          `Số câu trong ma trận (${matrixTotalQuestions} câu) khác với số câu hỏi thực tế đã chọn (${actualQuestionCount} câu)`
        );
      }
      if (Math.abs(matrixTotalPoints - actualTotalPoints) > 0.05) {
        discrepancies.push(
          `Tổng điểm ma trận (${matrixTotalPoints} điểm) khác với tổng điểm các câu hỏi đã chọn (${actualTotalPoints} điểm)`
        );
      }
      if (Math.abs(examForm.totalPoints - actualTotalPoints) > 0.05) {
        discrepancies.push(
          `Thang điểm cấu hình (${examForm.totalPoints} điểm) khác với tổng điểm các câu hỏi (${actualTotalPoints} điểm)`
        );
      }
      if (discrepancies.length > 0) {
        setMatrixWarning(discrepancies.join(' | '));
        return;
      }
    }

    const sanitized = sanitizeQuestionsForStudent(selectedQuestionsList);
    const examId = editingExam?.id || `exam_${Date.now()}`;
    const keyObj = buildAnswerKeyFromQuestions(examId, selectedQuestionsList, 'teacher');

    await onSaveExam(
      {
        code: examForm.code.trim(),
        title: examForm.title.trim(),
        category: examForm.category,
        grade: examForm.grade,
        topic: examForm.topic.trim(),
        durationMinutes: Number(examForm.durationMinutes) || 45,
        totalPoints: Number(examForm.totalPoints) || 10,
        status: examForm.status,
        matrixRows: examForm.matrixRows,
        questionsSanitized: sanitized,
        questionCount: sanitized.length,
        shuffleQuestions: examForm.shuffleQuestions,
        shuffleAnswers: examForm.shuffleAnswers,
        isDemo: examForm.isDemo,
      },
      {
        examId,
        answersMap: keyObj.answersMap,
        explanationsMap: keyObj.explanationsMap,
      },
      examId
    );

    setShowExamModal(false);
    setMatrixWarning(null);
    setBanner({
      type: 'success',
      text: editingExam
        ? 'Đã cập nhật đề kiểm tra, cấu hình đảo đề/đáp án và khóa đáp án bảo mật.'
        : 'Đã tạo đề kiểm tra mới thành công (tự động đảo câu hỏi & đáp án khi làm bài).',
    });
  };

  const handleQuickToggleExamShuffle = async (
    ex: Exam,
    field: 'shuffleQuestions' | 'shuffleAnswers'
  ) => {
    const existingKey = answerKeys.find((k) => k.examId === ex.id);
    const currentVal = ex[field] !== false;
    const nextVal = !currentVal;
    const nextShuffleQuestions =
      field === 'shuffleQuestions' ? nextVal : ex.shuffleQuestions !== false;
    const nextShuffleAnswers =
      field === 'shuffleAnswers' ? nextVal : ex.shuffleAnswers !== false;

    await onSaveExam(
      {
        code: ex.code,
        title: ex.title,
        category: ex.category,
        grade: ex.grade,
        topic: ex.topic,
        durationMinutes: ex.durationMinutes,
        totalPoints: ex.totalPoints,
        status: ex.status,
        matrixRows: ex.matrixRows,
        questionsSanitized: ex.questionsSanitized || [],
        questionCount: ex.questionCount,
        shuffleQuestions: nextShuffleQuestions,
        shuffleAnswers: nextShuffleAnswers,
        isDemo: ex.isDemo,
      },
      {
        examId: ex.id,
        answersMap: existingKey?.answersMap || {},
        explanationsMap: existingKey?.explanationsMap || {},
      },
      ex.id
    );
    setBanner({
      type: 'success',
      text: `Đã cập nhật đề "${ex.code}": ${
        field === 'shuffleQuestions' ? 'Tự động đảo câu hỏi' : 'Tự động đảo đáp án'
      } -> ${nextVal ? 'BẬT' : 'TẮT'}.`,
    });
  };

  const handleDuplicateExam = async (ex: Exam) => {
    const newId = `exam_${Date.now()}`;
    const existingKey = answerKeys.find((k) => k.examId === ex.id);
    await onSaveExam(
      {
        code: `${ex.code}-COPY`,
        title: `${ex.title} (Nhân bản)`,
        category: ex.category,
        grade: ex.grade,
        topic: ex.topic,
        durationMinutes: ex.durationMinutes,
        totalPoints: ex.totalPoints,
        status: 'draft',
        matrixRows: ex.matrixRows,
        questionsSanitized: ex.questionsSanitized || [],
        questionCount: ex.questionCount,
        shuffleQuestions: ex.shuffleQuestions !== false,
        shuffleAnswers: ex.shuffleAnswers !== false,
        isDemo: ex.isDemo,
      },
      {
        examId: newId,
        answersMap: existingKey?.answersMap || {},
        explanationsMap: existingKey?.explanationsMap || {},
      },
      newId
    );
    setBanner({ type: 'success', text: `Đã nhân bản đề kiểm tra "${ex.code}".` });
  };

  const openAssignModal = (ex: Exam) => {
    const matchingClass = classes.find((c) => c.grade === ex.grade) || classes[0];
    setAssigningExam(ex);
    setAssignForm({
      classId: matchingClass?.id || '',
      startTime: new Date().toISOString().slice(0, 16),
      dueTime: '2026-12-31T23:59',
      durationMinutes: ex.durationMinutes,
      maxAttempts: 2,
      resultReleaseMode: 'immediate',
      showAnswersAfterSubmit: true,
      shuffleQuestions: ex.shuffleQuestions !== false,
      shuffleAnswers: ex.shuffleAnswers !== false,
    });
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningExam || !assignForm.classId) return;
    const targetClass = classes.find((c) => c.id === assignForm.classId);
    if (!targetClass) return;

    await onCreateAssignment({
      examId: assigningExam.id,
      examTitle: assigningExam.title,
      examCategory: assigningExam.category,
      classId: targetClass.id,
      className: targetClass.name,
      grade: targetClass.grade,
      startTime: assignForm.startTime,
      dueTime: assignForm.dueTime,
      durationMinutes: Number(assignForm.durationMinutes) || assigningExam.durationMinutes,
      maxAttempts: Number(assignForm.maxAttempts) || 1,
      resultReleaseMode: assignForm.resultReleaseMode,
      showAnswersAfterSubmit: assignForm.showAnswersAfterSubmit,
      shuffleQuestions: assignForm.shuffleQuestions,
      shuffleAnswers: assignForm.shuffleAnswers,
      status: 'open',
      questionsSnapshot: assigningExam.questionsSanitized || [],
      isDemo: assigningExam.isDemo,
    });
    setAssigningExam(null);
    setBanner({
      type: 'success',
      text: `Đã giao đề "${assigningExam.title}" cho lớp ${targetClass.name} thành công.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 4 &amp; 5.1: Quản lý Đề kiểm tra, Ma trận đề &amp; Giao bài trực tuyến
          </h2>
          <p className="text-sm text-slate-600">
            Xây dựng ma trận đặc tả, kiểm tra độ khớp tổng điểm, bảo mật đáp án trên máy chủ và phân phối bài thi đến từng lớp
          </p>
        </div>
        <button
          onClick={openNewExamModal}
          className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đề kiểm tra mới</span>
        </button>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-700" />
            )}
            <span>{banner.text}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs font-bold underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đề hoặc tên đề..."
            className="pl-9 pr-4 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
        >
          <option value="ALL">Tất cả Khối (10, 11, 12)</option>
          <option value="10">Khối 10</option>
          <option value="11">Khối 11</option>
          <option value="12">Khối 12</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
        >
          <option value="ALL">Tất cả phân loại đề</option>
          <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên</option>
          <option value="Kiểm tra giữa kỳ">Kiểm tra giữa kỳ</option>
          <option value="Kiểm tra cuối kỳ">Kiểm tra cuối kỳ</option>
          <option value="Đề ôn tập">Đề ôn tập</option>
          <option value="Đề luyện thi">Đề luyện thi</option>
        </select>
      </div>

      {/* Exam Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredExams.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-10 text-center border border-slate-200">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-[#17365D]">Chưa có đề kiểm tra nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Nhấn &quot;Tạo đề kiểm tra mới&quot; để thiết lập ma trận và chọn câu hỏi từ ngân hàng.
            </p>
          </div>
        ) : (
          filteredExams.map((ex) => {
            const assignedClasses = assignments.filter((a) => a.examId === ex.id);
            return (
              <div
                key={ex.id}
                className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      Mã đề: <strong className="text-[#0D47A1]">{ex.code}</strong> · {ex.category} ·
                      Khối {ex.grade}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {ex.status === 'open'
                        ? '● Đang mở'
                        : ex.status === 'published'
                        ? '● Đã xuất bản'
                        : ex.status === 'draft'
                        ? 'Bản nháp'
                        : 'Đã đóng'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0D47A1]">{ex.title}</h3>
                  <p className="text-xs text-slate-600">
                    Thời lượng: <strong className="tabular-nums">{ex.durationMinutes} phút</strong> ·
                    Số câu hỏi: <strong className="tabular-nums">{ex.questionCount} câu</strong> ·
                    Tổng điểm: <strong className="tabular-nums">{ex.totalPoints} điểm</strong>
                  </p>

                  {/* Shuffle Questions & Answers Status / Quick Toggle Strip */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickToggleExamShuffle(ex, 'shuffleQuestions')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                        ex.shuffleQuestions !== false
                          ? 'bg-blue-50 text-[#0D47A1] border-blue-200 hover:bg-blue-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Nhấn để Bật/Tắt tự động đảo thứ tự câu hỏi mỗi lần học sinh làm bài"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>
                        Đảo câu hỏi: {ex.shuffleQuestions !== false ? 'Tự động BẬT' : 'Tắt'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickToggleExamShuffle(ex, 'shuffleAnswers')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                        ex.shuffleAnswers !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title="Nhấn để Bật/Tắt tự động đảo thứ tự đáp án (A, B, C, D) mỗi lần học sinh làm bài"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>
                        Đảo đáp án: {ex.shuffleAnswers !== false ? 'Tự động BẬT' : 'Tắt'}
                      </span>
                    </button>
                  </div>

                  {assignedClasses.length > 0 && (
                    <p className="text-xs text-[#168BFA] font-semibold">
                      Đã giao cho: {assignedClasses.map((a) => a.className).join(', ')}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => openAssignModal(ex)}
                      className="px-3 py-1.5 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Giao bài cho lớp</span>
                    </button>
                    <button
                      onClick={() => setViewingKeyExam(ex)}
                      className="px-2.5 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Đáp án GV</span>
                    </button>
                    <button
                      onClick={() => setPrintableExam(ex)}
                      className="px-2.5 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Bản in</span>
                    </button>
                    <button
                      onClick={() => {
                        const keyDoc = answerKeys.find((k) => k.examId === ex.id);
                        exportExamWithMatrixToWord(ex, keyDoc);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Xuất Đề thi kèm Bảng Khung Ma trận, Bản Đặc tả và Đáp án ra file Word (.docx)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất Word (.docx)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicateExam(ex)}
                      className="p-1.5 text-slate-600 hover:text-[#0D47A1] cursor-pointer"
                      title="Nhân bản đề"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditExamModal(ex)}
                      className="p-1.5 text-slate-600 hover:text-[#0D47A1] cursor-pointer"
                      title="Chỉnh sửa đề & Ma trận"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteExam(ex.id)}
                      className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                      title="Xóa đề"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create/Edit Exam & Matrix */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full p-6 border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0D47A1]">
                  {editingExam
                    ? `Chỉnh sửa Đề kiểm tra & Ma trận Đặc tả: ${editingExam.code}`
                    : 'Tạo Đề kiểm tra theo Khung Ma trận & Bản Đặc tả (Lấy từ Ngân hàng Câu hỏi)'}
                </h3>
                <p className="text-xs text-slate-600">
                  Thiết lập Khung ma trận, Bản đặc tả yêu cầu cần đạt và rút câu hỏi tự động từ Ngân hàng câu hỏi Tin học
                </p>
              </div>
              <button onClick={() => setShowExamModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Mã đề *</label>
                <input
                  type="text"
                  value={examForm.code}
                  onChange={(e) => setExamForm({ ...examForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Phân loại kỳ thi *</label>
                <select
                  value={examForm.category}
                  onChange={(e) =>
                    setExamForm({ ...examForm, category: e.target.value as ExamCategory })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên</option>
                  <option value="Kiểm tra giữa kỳ">Kiểm tra giữa kỳ</option>
                  <option value="Kiểm tra cuối kỳ">Kiểm tra cuối kỳ</option>
                  <option value="Đề ôn tập">Đề ôn tập</option>
                  <option value="Đề luyện thi">Đề luyện thi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Khối lớp *</label>
                <select
                  value={examForm.grade}
                  onChange={(e) =>
                    setExamForm({ ...examForm, grade: e.target.value as GradeLevel })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="10">Khối 10</option>
                  <option value="11">Khối 11</option>
                  <option value="12">Khối 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Trạng thái đề</label>
                <select
                  value={examForm.status}
                  onChange={(e) =>
                    setExamForm({ ...examForm, status: e.target.value as ExamStatus })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="open">Đang mở thi</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold mb-1">Tên đề kiểm tra *</label>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="Đề Kiểm tra Giữa kỳ I - Tin học 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Thời lượng (Phút)</label>
                <input
                  type="number"
                  value={examForm.durationMinutes}
                  onChange={(e) =>
                    setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tổng điểm chuẩn</label>
                <input
                  type="number"
                  value={examForm.totalPoints}
                  onChange={(e) =>
                    setExamForm({ ...examForm, totalPoints: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Automatic Shuffle Questions & Answers Configuration */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Chế độ Tự động Đảo câu hỏi &amp; Đảo đáp án mỗi lần làm bài
                  </h4>
                  <p className="text-[11px] sm:text-xs text-emerald-800 mt-0.5">
                    Mỗi lượt học sinh vào làm bài sẽ nhận một thứ tự câu hỏi và thứ tự đáp án A, B, C, D ngẫu nhiên khác nhau (hệ thống tự động đối chiếu đáp án gốc để chấm điểm chính xác 100%).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer bg-white px-3 py-2 rounded-lg border border-emerald-300">
                  <input
                    type="checkbox"
                    checked={examForm.shuffleQuestions}
                    onChange={(e) =>
                      setExamForm({ ...examForm, shuffleQuestions: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#0D47A1]"
                  />
                  <span>Tự động đảo câu hỏi</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer bg-white px-3 py-2 rounded-lg border border-emerald-300">
                  <input
                    type="checkbox"
                    checked={examForm.shuffleAnswers}
                    onChange={(e) =>
                      setExamForm({ ...examForm, shuffleAnswers: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#0D47A1]"
                  />
                  <span>Tự động đảo đáp án</span>
                </label>
              </div>
            </div>

            {/* NEW: 3-Part Matrix Builder by Topic/Lesson & Cognitive Level (NB, TH, VD, VDC) */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-300 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#0D47A1]">
                    Tạo Bộ Đề Kiểm tra / Ôn tập theo Ma trận 3 Phần (Chọn Chủ đề/Bài &amp; Số câu NB - TH - VD - VDC)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tích chọn Chủ đề/Bài học từ Ngân hàng câu hỏi Khối {examForm.grade}, nhập số lượng câu{' '}
                    <strong>Nhận biết (NB), Thông hiểu (TH), Vận dụng (VD), Vận dụng cao (VDC)</strong> cho từng phần rồi nhấn nút phát sinh bộ đề.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExamForm((prev) => ({
                        ...prev,
                        category: 'Kiểm tra giữa kỳ',
                        code: prev.code.replace(/^ON/, 'DE'),
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${
                      examForm.category.includes('Kiểm tra')
                        ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                        : 'bg-white text-[#0D47A1] border-blue-300'
                    }`}
                  >
                    Chế độ: Tạo Đề Kiểm Tra
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExamForm((prev) => ({
                        ...prev,
                        category: 'Đề ôn tập',
                        code: `ON${prev.grade}-${Date.now().toString().slice(-4)}`,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${
                      examForm.category === 'Đề ôn tập' || examForm.category === 'Đề luyện thi'
                        ? 'bg-[#0D47A1] text-white border-[#0D47A1]'
                        : 'bg-white text-[#0D47A1] border-blue-300'
                    }`}
                  >
                    Chế độ: Tạo Đề Ôn Tập
                  </button>
                  <button
                    type="button"
                    onClick={handleBuildFromThreePartGrid}
                    className="px-4 py-1.5 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Phát sinh Bộ Đề từ Ma trận 3 Phần</span>
                  </button>
                </div>
              </div>

              {Object.keys(topicMatrixMap).length === 0 ? (
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                  Ngân hàng câu hỏi hiện chưa có câu hỏi nào cho Khối {examForm.grade}.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs bg-white border border-slate-300 rounded-lg text-center">
                    <thead>
                      <tr className="bg-[#0D47A1] text-white">
                        <th rowSpan={2} className="p-2 text-left min-w-[210px] border-r border-blue-800">
                          Chọn Chủ đề / Bài học (Khối {examForm.grade})
                        </th>
                        <th colSpan={4} className="p-1.5 border-r border-blue-800 bg-[#0D47A1]">
                          PHẦN I. Trắc nghiệm 1 đáp án đúng
                        </th>
                        <th colSpan={4} className="p-1.5 border-r border-blue-800 bg-[#1256BE]">
                          PHẦN II. Trắc nghiệm Đúng / Sai (4 ý)
                        </th>
                        <th colSpan={4} className="p-1.5 bg-[#09357A]">
                          PHẦN III. Trả lời ngắn (HS tự nhập)
                        </th>
                      </tr>
                      <tr className="bg-blue-900 text-white text-[11px]">
                        {(['multiple_choice', 'true_false', 'short_answer'] as const).map((partKey) =>
                          (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as CognitiveLevel[]).map(
                            (lv) => {
                              const shortLabel =
                                lv === 'Nhận biết'
                                  ? 'NB'
                                  : lv === 'Thông hiểu'
                                  ? 'TH'
                                  : lv === 'Vận dụng'
                                  ? 'VD'
                                  : 'VDC';
                              return (
                                <th
                                  key={`${partKey}_${lv}`}
                                  className="p-1.5 border-r border-blue-800 font-bold"
                                  title={`${lv}`}
                                >
                                  {shortLabel}
                                </th>
                              );
                            }
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(topicMatrixMap).map(([topic, cfg]) => (
                        <tr
                          key={topic}
                          className={cfg.selected ? 'bg-white' : 'bg-slate-50 opacity-60'}
                        >
                          <td className="p-2 text-left border-r border-slate-200">
                            <label className="flex items-start gap-2 cursor-pointer font-bold text-[#17365D]">
                              <input
                                type="checkbox"
                                checked={cfg.selected}
                                onChange={(e) =>
                                  setTopicMatrixMap((prev) => ({
                                    ...prev,
                                    [topic]: { ...cfg, selected: e.target.checked },
                                  }))
                                }
                                className="mt-0.5"
                              />
                              <span>{topic}</span>
                            </label>
                          </td>
                          {(['multiple_choice', 'true_false', 'short_answer'] as const).map(
                            (partKey) =>
                              (
                                ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as CognitiveLevel[]
                              ).map((lv) => {
                                const bankCount = getBankCountByTopicTypeLevel(
                                  topic,
                                  partKey,
                                  lv
                                );
                                const currentVal = cfg[partKey][lv] || 0;
                                const isOver = currentVal > bankCount;
                                return (
                                  <td
                                    key={`${topic}_${partKey}_${lv}`}
                                    className="p-1 border-r border-slate-200 align-middle"
                                  >
                                    <div className="flex flex-col items-center">
                                      <input
                                        type="number"
                                        min={0}
                                        value={currentVal}
                                        onChange={(e) =>
                                          handleUpdateTopicCell(
                                            topic,
                                            partKey,
                                            lv,
                                             parseInt(e.target.value, 10) || 0
                                          )
                                        }
                                        className={`w-12 px-1 py-0.5 text-center border rounded text-xs font-bold tabular-nums ${
                                          isOver
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : currentVal > 0
                                            ? 'border-[#0D47A1] bg-blue-50/60 text-[#0D47A1]'
                                            : 'border-slate-200 text-slate-500'
                                        }`}
                                      />
                                      <span
                                        className={`text-[10px] mt-0.5 tabular-nums ${
                                          bankCount > 0
                                            ? 'text-emerald-700 font-semibold'
                                            : 'text-slate-400'
                                        }`}
                                      >
                                        Kho: {bankCount}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Matrix & Specification Builder Section */}
            <div className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-200 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#0D47A1]">
                    Chi tiết Bảng Khung Ma trận &amp; Bản Đặc tả Đề kiểm tra (Khối {examForm.grade})
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tổng Ma trận: <strong>{matrixTotalQuestions} câu</strong> ({matrixTotalPoints}{' '}
                    điểm) | Đề thực tế đã rút:{' '}
                    <strong className="text-emerald-700">{actualQuestionCount} câu</strong> (
                    {actualTotalPoints} điểm)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadMatrixExcelTemplate()}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-[#0D47A1] border border-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Tải file Excel (.xlsx) mẫu Khung Ma trận & Bản Đặc tả"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải mẫu Ma trận Excel (.xlsx)</span>
                  </button>
                  <label className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập Ma trận từ Excel (.xlsx)</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleMatrixExcelUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateMatrixFromBank}
                    className="px-3 py-1.5 bg-white hover:bg-blue-50 text-[#0D47A1] border border-blue-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Lấy Khung Ma trận từ Ngân hàng Khối {examForm.grade}</span>
                  </button>
                  <button
                    type="button"
                    onClick={addMatrixRow}
                    className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Thêm dòng đặc tả
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoPickQuestionsFromMatrix}
                    className="px-3.5 py-1.5 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Bước 2: Rút câu hỏi tự động theo Ma trận</span>
                  </button>
                </div>
              </div>

              {/* 4-Cognitive-Level Summary Strip */}
              {examForm.matrixRows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as CognitiveLevel[]).map(
                    (lvl) => {
                      const rowsOfLvl = examForm.matrixRows.filter((r) => r.cognitiveLevel === lvl);
                      const countLvl = rowsOfLvl.reduce(
                        (s, r) => s + (Number(r.questionCount) || 0),
                        0
                      );
                      const ptsLvl =
                        Math.round(
                          rowsOfLvl.reduce((s, r) => s + (Number(r.totalPoints) || 0), 0) * 100
                        ) / 100;
                      const pctLvl =
                        matrixTotalPoints > 0
                          ? Math.round((ptsLvl / matrixTotalPoints) * 100)
                          : 0;
                      return (
                        <div
                          key={lvl}
                          className="bg-white px-3 py-2 rounded-lg border border-blue-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-[#17365D]">{lvl}:</span>
                          <span className="tabular-nums font-bold text-[#0D47A1]">
                            {countLvl} câu · {ptsLvl}đ ({pctLvl}%)
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {examForm.matrixRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs bg-white border border-slate-200 rounded-lg">
                    <thead className="bg-[#0D47A1] text-white">
                      <tr>
                        <th className="p-2">Chủ đề / Chương</th>
                        <th className="p-2">Đơn vị kiến thức</th>
                        <th className="p-2">Bản đặc tả yêu cầu cần đạt</th>
                        <th className="p-2">Mức độ</th>
                        <th className="p-2">Dạng thức câu</th>
                        <th className="p-2">Số câu (Tồn kho)</th>
                        <th className="p-2">Tổng điểm</th>
                        <th className="p-2">Tỷ lệ %</th>
                        <th className="p-2">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {examForm.matrixRows.map((row, idx) => {
                        const availableInBank = getMatchingQuestionsForRow(row).length;
                        const isShort = availableInBank < row.questionCount;
                        const gradeTopics = Array.from(
                          new Set<string>(
                            questions
                              .filter((q) => q.grade === examForm.grade)
                              .map((q) => q.topic)
                          )
                        );
                        return (
                          <tr key={row.id}>
                            <td className="p-1.5 min-w-[170px]">
                              <input
                                type="text"
                                list={`topics_list_${idx}`}
                                value={row.topic}
                                onChange={(e) => {
                                  const next = [...examForm.matrixRows];
                                  next[idx] = { ...row, topic: e.target.value };
                                  setExamForm({ ...examForm, matrixRows: next });
                                }}
                                placeholder="Chọn hoặc nhập chủ đề..."
                                className="w-full px-2 py-1 border border-slate-300 rounded"
                              />
                              <datalist id={`topics_list_${idx}`}>
                                {gradeTopics.map((t) => (
                                  <option key={t} value={t} />
                                ))}
                              </datalist>
                            </td>
                            <td className="p-1.5 min-w-[140px]">
                              <input
                                type="text"
                                value={row.knowledgeUnit || ''}
                                onChange={(e) => {
                                  const next = [...examForm.matrixRows];
                                  next[idx] = { ...row, knowledgeUnit: e.target.value };
                                  setExamForm({ ...examForm, matrixRows: next });
                                }}
                                placeholder="VD: Câu lệnh lặp for"
                                className="w-full px-2 py-1 border border-slate-300 rounded"
                              />
                            </td>
                            <td className="p-1.5 min-w-[190px]">
                              <input
                                type="text"
                                value={row.specification || ''}
                                onChange={(e) => {
                                  const next = [...examForm.matrixRows];
                                  next[idx] = { ...row, specification: e.target.value };
                                  setExamForm({ ...examForm, matrixRows: next });
                                }}
                                placeholder="Yêu cầu cần đạt theo đặc tả..."
                                className="w-full px-2 py-1 border border-slate-300 rounded"
                              />
                            </td>
                            <td className="p-1.5">
                              <select
                                value={row.cognitiveLevel}
                                onChange={(e) => {
                                  const next = [...examForm.matrixRows];
                                  next[idx] = {
                                    ...row,
                                    cognitiveLevel: e.target.value as CognitiveLevel,
                                  };
                                  setExamForm({ ...examForm, matrixRows: next });
                                }}
                                className="px-2 py-1 border border-slate-300 rounded"
                              >
                                <option value="Nhận biết">Nhận biết</option>
                                <option value="Thông hiểu">Thông hiểu</option>
                                <option value="Vận dụng">Vận dụng</option>
                                <option value="Vận dụng cao">Vận dụng cao</option>
                              </select>
                            </td>
                            <td className="p-1.5">
                              <select
                                value={row.questionType}
                                onChange={(e) => {
                                  const next = [...examForm.matrixRows];
                                  next[idx] = {
                                    ...row,
                                    questionType: e.target.value as QuestionType,
                                  };
                                  setExamForm({ ...examForm, matrixRows: next });
                                }}
                                className="px-2 py-1 border border-slate-300 rounded"
                              >
                                <option value="multiple_choice">TN 4 lựa chọn</option>
                                <option value="true_false">Đúng/Sai 4 ý</option>
                                <option value="short_answer">Trả lời ngắn</option>
                                <option value="essay">Tự luận</option>
                              </select>
                            </td>
                            <td className="p-1.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  value={row.questionCount}
                                  onChange={(e) => {
                                    const next = [...examForm.matrixRows];
                                    next[idx] = { ...row, questionCount: Number(e.target.value) };
                                    setExamForm({ ...examForm, matrixRows: next });
                                  }}
                                  className="w-14 px-2 py-1 border border-slate-300 rounded tabular-nums"
                                />
                                <span
                                  className={`text-[11px] font-bold whitespace-nowrap ${
                                    isShort ? 'text-[#FF8A00]' : 'text-emerald-700'
                                  }`}
                                  title="Số câu hỏi khớp tiêu chí hiện có trong Ngân hàng câu hỏi"
                                >
                                  (Kho: {availableInBank})
                                </span>
                              </div>
                            </td>
                            <td className="p-1.5">
                              <input
                                type="number"
                                step="0.25"
                                value={row.totalPoints}
                                onChange={(e) => {
                                  const pts = Number(e.target.value);
                                  const next = [...examForm.matrixRows];
                                  next[idx] = {
                                    ...row,
                                    totalPoints: pts,
                                    percentage: Math.round(
                                      (pts / (examForm.totalPoints || 10)) * 100
                                    ),
                                  };
                                  setExamForm({ ...examForm, matrixRows: next });
                                }}
                                className="w-16 px-2 py-1 border border-slate-300 rounded tabular-nums"
                              />
                            </td>
                            <td className="p-1.5 tabular-nums font-bold">{row.percentage}%</td>
                            <td className="p-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setExamForm({
                                    ...examForm,
                                    matrixRows: examForm.matrixRows.filter((_, i) => i !== idx),
                                  })
                                }
                                className="text-red-600 font-bold cursor-pointer px-1"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Matrix Discrepancy Warning Box */}
            {matrixWarning && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-400 text-amber-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-[#FF8A00]" />
                  <span>Cảnh báo sai lệch giữa Ma trận đề và Câu hỏi thực tế:</span>
                </div>
                <p className="text-xs">{matrixWarning}</p>
                <p className="text-xs text-slate-600">
                  Hệ thống giữ nguyên ma trận do giáo viên thiết lập. Thầy có muốn xác nhận lưu đề với cấu trúc hiện tại không?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveExamSubmit(true)}
                    className="px-3 py-1.5 bg-[#FF8A00] text-white rounded text-xs font-bold cursor-pointer"
                  >
                    Xác nhận lưu đề dù có chênh lệch
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixWarning(null)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold cursor-pointer"
                  >
                    Quay lại điều chỉnh
                  </button>
                </div>
              </div>
            )}

            {/* Question Selection from Question Bank */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-[#0D47A1]">
                  Danh sách câu hỏi đưa vào đề kiểm tra (Đã chọn: {examForm.selectedQuestionIds.length}{' '}
                  câu — Tổng điểm: {actualTotalPoints} điểm)
                </h4>
                <span className="text-xs text-slate-500">
                  Mẹo: Nhấn &quot;Đổi câu khác&quot; ở câu đã chọn để rút ngẫu nhiên câu tương đương trong Ngân hàng câu hỏi
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-200">
                {questions.map((q) => {
                  const checked = examForm.selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-3 flex items-start justify-between gap-3 text-xs ${
                        checked ? 'bg-blue-50/70' : 'bg-white hover:bg-[#F4F8FC]'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setExamForm((prev) => ({
                              ...prev,
                              selectedQuestionIds: checked
                                ? prev.selectedQuestionIds.filter((id) => id !== q.id)
                                : [...prev.selectedQuestionIds, q.id],
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-[#0D47A1]">
                            [{q.code}] Khối {q.grade} · {q.topic} ·{' '}
                            <span className="underline">{q.cognitiveLevel}</span> · {q.questionType} ·{' '}
                            <span className="text-[#FF8A00]">{q.points} điểm</span>
                          </div>
                          <p className="text-slate-700 mt-0.5">{q.content}</p>
                        </div>
                      </label>
                      {checked && (
                        <button
                          type="button"
                          onClick={() => handleSwapSingleQuestion(q)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-100 text-[#0D47A1] border border-blue-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Đổi sang câu hỏi khác cùng Khối, cùng Mức độ nhận thức và Dạng câu hỏi trong Ngân hàng"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Đổi câu khác</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveExamSubmit(false)}
                className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Lưu Đề kiểm tra &amp; Ma trận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Exam to Class */}
      {assigningExam && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                Giao Bài Kiểm tra Trực tuyến
              </h3>
              <button onClick={() => setAssigningExam(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div className="p-3 bg-[#F4F8FC] rounded-lg border border-slate-200 text-xs">
                <p className="font-bold text-[#0D47A1]">{assigningExam.title}</p>
                <p className="text-slate-600 mt-0.5">
                  Mã đề: {assigningExam.code} · {assigningExam.questionCount} câu hỏi ·{' '}
                  {assigningExam.totalPoints} điểm
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Chọn Lớp được giao bài *</label>
                <select
                  required
                  value={assignForm.classId}
                  onChange={(e) => setAssignForm({ ...assignForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Khối {c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Thời điểm bắt đầu mở đề</label>
                  <input
                    type="datetime-local"
                    value={assignForm.startTime}
                    onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Hạn chót nộp bài</label>
                  <input
                    type="datetime-local"
                    value={assignForm.dueTime}
                    onChange={(e) => setAssignForm({ ...assignForm, dueTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Thời lượng làm bài (Phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={assignForm.durationMinutes}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Số lần được phép làm bài</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={assignForm.maxAttempts}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, maxAttempts: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Chế độ công bố điểm</label>
                <select
                  value={assignForm.resultReleaseMode}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      resultReleaseMode: e.target.value as 'immediate' | 'after_due' | 'manual',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="immediate">Công bố điểm trắc nghiệm ngay sau khi nộp</option>
                  <option value="after_due">Công bố sau khi hết hạn nộp bài</option>
                  <option value="manual">Chờ giáo viên duyệt công bố</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                <p className="text-xs font-bold text-[#0D47A1] flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Cấu hình chống quay cóp mỗi lần làm bài:</span>
                </p>
                <label className="flex items-center gap-2 text-xs font-bold text-[#17365D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.shuffleQuestions}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, shuffleQuestions: e.target.checked })
                    }
                  />
                  <span>Tự động đảo thứ tự câu hỏi mỗi lần học sinh vào làm bài</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-[#17365D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.shuffleAnswers}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, shuffleAnswers: e.target.checked })
                    }
                  />
                  <span>Tự động đảo thứ tự các đáp án (A, B, C, D và ý Đúng/Sai) mỗi lần làm bài</span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[#17365D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignForm.showAnswersAfterSubmit}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, showAnswersAfterSubmit: e.target.checked })
                  }
                />
                <span>Cho phép học sinh xem đáp án chi tiết sau khi đã nộp bài thành công</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningExam(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF8A00] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Xác nhận Giao bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Teacher Answer Key */}
      {viewingKeyExam && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                Bảng Đáp án &amp; Hướng dẫn chấm dành riêng cho Giáo viên: {viewingKeyExam.code}
              </h3>
              <button onClick={() => setViewingKeyExam(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              Bảo mật: Bảng đáp án này được lưu tách biệt tại collection <code>exam_answer_keys</code> và tuyệt đối không gửi xuống trình duyệt học sinh khi đang làm bài.
            </p>
            {(() => {
              const keyDoc = answerKeys.find((k) => k.examId === viewingKeyExam.id);
              const qList = viewingKeyExam.questionsSanitized || [];
              return (
                <div className="space-y-2 text-xs">
                  {qList.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-lg bg-[#F4F8FC] border border-slate-200">
                      <p className="font-bold text-[#0D47A1]">
                        Câu {idx + 1} ({q.code} - {q.points} điểm): {q.content}
                      </p>
                      <p className="mt-1 text-emerald-800 font-bold">
                        Đáp án chuẩn: {keyDoc?.answersMap?.[q.id] || 'Chưa thiết lập'}
                      </p>
                      {keyDoc?.explanationsMap?.[q.id] && (
                        <p className="mt-0.5 text-slate-600">
                          Giải thích / Biểu điểm: {keyDoc.explanationsMap[q.id]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal: Printable Exam Format */}
      {printableExam && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-8 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 no-print">
              <span className="text-xs font-bold text-slate-500">
                Bản xem trước định dạng in giấy A4
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPrintableExam((prev) =>
                      prev
                        ? {
                            ...prev,
                            questionsSanitized: buildShuffledQuestionsForAttempt(
                              prev.questionsSanitized || [],
                              true,
                              true
                            ),
                          }
                        : null
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Đảo câu hỏi &amp; đáp án bản in</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#0D47A1] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In đề thi (Print)</span>
                </button>
                <button
                  onClick={() => setPrintableExam(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 text-center border-b-2 border-black pb-3 text-sm">
              <div>
                <p className="font-bold">SỞ GD&amp;ĐT ĐỒNG NAI</p>
                <p className="font-bold underline">TRƯỜNG THPT THANH HÒA</p>
              </div>
              <div>
                <p className="font-bold uppercase">{printableExam.category}</p>
                <p className="font-bold">MÔN: TIN HỌC - KHỐI {printableExam.grade}</p>
                <p className="text-xs">
                  Thời gian làm bài: {printableExam.durationMinutes} phút (Mã đề: {printableExam.code})
                </p>
              </div>
            </div>

            <div className="text-xs space-y-1 border border-black p-3">
              <p>Họ và tên học sinh: .................................................................................... Lớp: ....................</p>
              <p>Mã số học sinh: ..........................................................................................</p>
            </div>

            <div className="space-y-5 text-sm">
              {(() => {
                const allQs = printableExam.questionsSanitized || [];
                const p1 = allQs.filter((q) => q.questionType === 'multiple_choice');
                const p2 = allQs.filter((q) => q.questionType === 'true_false');
                const p3 = allQs.filter((q) => q.questionType === 'short_answer');
                const p4 = allQs.filter((q) => q.questionType === 'essay');
                const lvCode: Record<CognitiveLevel, string> = {
                  'Nhận biết': 'NB',
                  'Thông hiểu': 'TH',
                  'Vận dụng': 'VD',
                  'Vận dụng cao': 'VDC',
                };

                return (
                  <>
                    {p1.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold uppercase text-black">
                          PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN
                        </h4>
                        {p1.map((q, idx) => (
                          <div key={q.id} className="space-y-1">
                            <p className="font-bold">
                              Câu {idx + 1} [{lvCode[q.cognitiveLevel]}].{' '}
                              <span className="font-normal">{q.content}</span>
                            </p>
                            {q.codeSnippet && (
                              <pre className="p-2 border border-slate-400 bg-slate-50 text-xs font-mono">
                                {q.codeSnippet}
                              </pre>
                            )}
                            {q.options && (
                              <div className="grid grid-cols-2 gap-1 pl-4">
                                {q.options.map((opt, oIdx) => (
                                  <p key={oIdx}>
                                    <strong>{['A', 'B', 'C', 'D'][oIdx]}.</strong> {opt}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {p2.length > 0 && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-bold uppercase text-black">
                            PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI (
                            {Math.round(
                              p2.reduce((s, q) => s + (Number(q.points) || 0), 0) * 100
                            ) / 100}{' '}
                            điểm)
                          </h4>
                          <p className="text-xs italic">
                            Câu hỏi có 4 ý a, b, c, d , thí sinh chọn Đúng hoặc Sai.
                          </p>
                        </div>
                        {p2.map((q, idx) => (
                          <div key={q.id} className="space-y-1">
                            <p className="font-bold">
                              Câu {idx + 1}. <span className="font-normal">{q.content}</span>
                            </p>
                            {q.subItems && (
                              <div className="pl-4 space-y-1">
                                {q.subItems.map((sub, sIdx) => (
                                  <p key={sub.id}>
                                    <strong>{sub.id})</strong>
                                    {sub.cognitiveLevel
                                      ? `[${sIdx + 1}.${lvCode[sub.cognitiveLevel]}] `
                                      : ' '}
                                    {sub.text} [ Đúng / Sai ]
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {p3.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold uppercase text-black">
                          PHẦN III. Câu trắc nghiệm trả lời ngắn.
                        </h4>
                        {p3.map((q, idx) => (
                          <div key={q.id} className="space-y-1">
                            <p className="font-bold">
                              Câu {idx + 1}: <span className="font-normal">{q.content}</span>
                            </p>
                            <p className="pl-2">.nội dung trả lời:....................................................</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {p4.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-bold uppercase text-black">PHẦN IV. TỰ LUẬN</h4>
                        {p4.map((q, idx) => (
                          <div key={q.id} className="space-y-1">
                            <p className="font-bold">
                              Câu {idx + 1} ({q.points} điểm):{' '}
                              <span className="font-normal">{q.content}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
