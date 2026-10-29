import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Copy,
  Edit3,
  Trash2,
  Eye,
  Sparkles,
  Upload,
  Download,
  CheckSquare,
  FilePlus2,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  CognitiveLevel,
  GradeLevel,
  Question,
  QuestionType,
  TrueFalseSubItem,
} from '../types';
import {
  downloadQuestionWordTemplate,
  exportToExcel,
  extractTextFromWordFile,
  parseQuestionsFromWordText,
  SAMPLE_WORD_RAW_TEXT,
} from '../utils/officeDocumentUtils';

interface QuestionBankViewProps {
  questions: Question[];
  onSaveQuestion: (
    q: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onCreateExamFromSelected: (selectedQuestions: Question[]) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm 1 đáp án (A/B/C/D)',
  true_false: 'Trắc nghiệm Đúng / Sai (4 ý a,b,c,d)',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận / Viết mã',
};

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  onSaveQuestion,
  onDeleteQuestion,
  onCreateExamFromSelected,
}) => {
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Question Modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qForm, setQForm] = useState({
    code: '',
    grade: '10' as GradeLevel,
    textbook: 'Kết nối tri thức với cuộc sống',
    topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
    lesson: '',
    knowledgeUnit: '',
    cognitiveLevel: 'Thông hiểu' as CognitiveLevel,
    questionType: 'multiple_choice' as QuestionType,
    content: '',
    codeSnippet: '',
    imageUrl: '',
    options: ['', '', '', ''],
    subItems: [
      { id: 'a', text: '', isTrue: true },
      { id: 'b', text: '', isTrue: false },
      { id: 'c', text: '', isTrue: true },
      { id: 'd', text: '', isTrue: true },
    ] as TrueFalseSubItem[],
    correctAnswer: 'A',
    explanation: '',
    gradingGuide: '',
    points: 0.25,
    tagsText: 'Python, Tin học THPT',
    isApproved: true,
    isDemo: false,
  });

  // Preview Modal
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // Word (.docx) Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [wordParsedDrafts, setWordParsedDrafts] = useState<
    Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]
  >([]);
  const [wordDefaultGrade, setWordDefaultGrade] = useState<GradeLevel>('10');
  const [wordDefaultTopic, setWordDefaultTopic] = useState(
    'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính'
  );

  // AI Question Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiParams, setAiParams] = useState({
    grade: '10' as GradeLevel,
    topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính (Python)',
    lesson: 'Câu lệnh lặp for và danh sách list',
    cognitiveLevel: 'Thông hiểu' as CognitiveLevel,
    questionType: 'multiple_choice' as QuestionType,
    count: 2,
    sourceMaterial: '',
    customPrompt: '',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDrafts, setAiDrafts] = useState<
    Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]
  >([]);

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredQuestions = questions.filter((q) => {
    const matchGrade = gradeFilter === 'ALL' || q.grade === gradeFilter;
    const matchLevel = levelFilter === 'ALL' || q.cognitiveLevel === levelFilter;
    const matchType = typeFilter === 'ALL' || q.questionType === typeFilter;
    const matchSearch =
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchLevel && matchType && matchSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    setQForm({
      code: `TH10-${Date.now().toString().slice(-4)}`,
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 19: Câu lệnh lặp for',
      knowledgeUnit: 'Vòng lặp for và range()',
      cognitiveLevel: 'Thông hiểu',
      questionType: 'multiple_choice',
      content: '',
      codeSnippet: '',
      imageUrl: '',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      subItems: [
        { id: 'a', text: 'Mệnh đề a', isTrue: true },
        { id: 'b', text: 'Mệnh đề b', isTrue: false },
        { id: 'c', text: 'Mệnh đề c', isTrue: true },
        { id: 'd', text: 'Mệnh đề d', isTrue: true },
      ],
      correctAnswer: 'A',
      explanation: '',
      gradingGuide: '',
      points: 0.5,
      tagsText: 'Tin học 10, Python',
      isApproved: true,
      isDemo: false,
    });
    setShowModal(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQForm({
      code: q.code,
      grade: q.grade,
      textbook: q.textbook,
      topic: q.topic,
      lesson: q.lesson || '',
      knowledgeUnit: q.knowledgeUnit || '',
      cognitiveLevel: q.cognitiveLevel,
      questionType: q.questionType,
      content: q.content,
      codeSnippet: q.codeSnippet || '',
      imageUrl: q.imageUrl || '',
      options: q.options && q.options.length === 4 ? [...q.options] : ['', '', '', ''],
      subItems:
        q.subItems && q.subItems.length > 0
          ? q.subItems.map((s) => ({ ...s }))
          : [
              { id: 'a', text: '', isTrue: true },
              { id: 'b', text: '', isTrue: false },
              { id: 'c', text: '', isTrue: true },
              { id: 'd', text: '', isTrue: true },
            ],
      correctAnswer: q.correctAnswer || 'A',
      explanation: q.explanation || '',
      gradingGuide: q.gradingGuide || '',
      points: q.points,
      tagsText: (q.tags || []).join(', '),
      isApproved: q.isApproved,
      isDemo: q.isDemo,
    });
    setShowModal(true);
  };

  const handleDuplicateQuestion = async (q: Question) => {
    await onSaveQuestion({
      code: `${q.code}-COPY`,
      grade: q.grade,
      textbook: q.textbook,
      topic: q.topic,
      lesson: q.lesson,
      knowledgeUnit: q.knowledgeUnit,
      cognitiveLevel: q.cognitiveLevel,
      questionType: q.questionType,
      content: `${q.content} (Bản sao)`,
      codeSnippet: q.codeSnippet,
      imageUrl: q.imageUrl,
      options: q.options,
      subItems: q.subItems,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      gradingGuide: q.gradingGuide,
      points: q.points,
      tags: q.tags,
      isApproved: q.isApproved,
      isDemo: q.isDemo,
    });
    setBanner({ type: 'success', text: `Đã sao chép câu hỏi ${q.code} thành công.` });
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qForm.code.trim() || !qForm.content.trim()) {
      setBanner({ type: 'error', text: 'Vui lòng nhập đầy đủ Mã câu hỏi và Nội dung câu hỏi.' });
      return;
    }

    const computedAnswer =
      qForm.questionType === 'true_false'
        ? qForm.subItems.map((s) => `${s.id}:${s.isTrue ? 'Đ' : 'S'}`).join(',')
        : qForm.correctAnswer.trim();

    await onSaveQuestion(
      {
        code: qForm.code.trim(),
        grade: qForm.grade,
        textbook: qForm.textbook.trim() || 'Kết nối tri thức với cuộc sống',
        topic: qForm.topic.trim(),
        lesson: qForm.lesson.trim(),
        knowledgeUnit: qForm.knowledgeUnit.trim(),
        cognitiveLevel: qForm.cognitiveLevel,
        questionType: qForm.questionType,
        content: qForm.content.trim(),
        codeSnippet: qForm.codeSnippet.trim(),
        imageUrl: qForm.imageUrl.trim(),
        options: qForm.questionType === 'multiple_choice' ? qForm.options.map((o) => o.trim()) : [],
        subItems: qForm.questionType === 'true_false' ? qForm.subItems : [],
        correctAnswer: computedAnswer,
        explanation: qForm.explanation.trim(),
        gradingGuide: qForm.gradingGuide.trim(),
        points: Number(qForm.points) || 0.25,
        tags: qForm.tagsText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
        isApproved: qForm.isApproved,
        isDemo: qForm.isDemo,
      },
      editingQuestion?.id
    );
    setShowModal(false);
    setBanner({
      type: 'success',
      text: editingQuestion
        ? 'Đã cập nhật câu hỏi trong ngân hàng.'
        : 'Đã thêm câu hỏi mới vào ngân hàng.',
    });
  };

  const handleGenerateAiQuestions = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiParams),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAiError(data.error || 'Không thể kết nối dịch vụ AI.');
        setAiLoading(false);
        return;
      }
      const list = Array.isArray(data.questions) ? data.questions : [];
      const mapped: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[] = list.map(
        (item: Record<string, unknown>, idx: number) => ({
          code: `AI-TH${aiParams.grade}-${Date.now().toString().slice(-3)}${idx + 1}`,
          grade: aiParams.grade,
          textbook: 'Kết nối tri thức với cuộc sống',
          topic: aiParams.topic,
          lesson: aiParams.lesson,
          knowledgeUnit: String(item.knowledgeUnit || aiParams.lesson || 'Kiến thức Tin học'),
          cognitiveLevel: (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'].includes(
            String(item.cognitiveLevel)
          )
            ? item.cognitiveLevel
            : aiParams.cognitiveLevel) as CognitiveLevel,
          questionType: (['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(
            String(item.questionType)
          )
            ? item.questionType
            : aiParams.questionType) as QuestionType,
          content: String(item.content || ''),
          codeSnippet: String(item.codeSnippet || ''),
          options: Array.isArray(item.options)
            ? item.options.map((o) => String(o)).slice(0, 4)
            : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          subItems: Array.isArray(item.subItems)
            ? (item.subItems as TrueFalseSubItem[]).slice(0, 4)
            : [
                { id: 'a', text: 'Ý a', isTrue: true },
                { id: 'b', text: 'Ý b', isTrue: false },
                { id: 'c', text: 'Ý c', isTrue: true },
                { id: 'd', text: 'Ý d', isTrue: true },
              ],
          correctAnswer: String(item.correctAnswer || 'A'),
          explanation: String(item.explanation || ''),
          gradingGuide: String(item.gradingGuide || ''),
          points: Number(item.points) || 0.5,
          tags: [`Tin học ${aiParams.grade}`, 'AI Đề xuất'],
          isApproved: true,
          isDemo: false,
        })
      );
      setAiDrafts(mapped);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAiDraft = async (
    draft: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    index: number
  ) => {
    await onSaveQuestion({ ...draft, isApproved: true });
    setAiDrafts((prev) => prev.filter((_, i) => i !== index));
    setBanner({
      type: 'success',
      text: `Đã duyệt và lưu câu hỏi "${draft.code}" vào ngân hàng câu hỏi.`,
    });
  };

  const handleWordFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawText = await extractTextFromWordFile(file);
      setImportText(rawText);
      const parsed = parseQuestionsFromWordText(rawText, wordDefaultGrade, wordDefaultTopic);
      setWordParsedDrafts(parsed);
    } catch {
      setBanner({
        type: 'error',
        text: 'Không thể đọc tệp Word (.docx). Vui lòng sử dụng tệp định dạng .docx chuẩn.',
      });
    }
  };

  const handleParseRawWordText = (raw: string) => {
    setImportText(raw);
    const parsed = parseQuestionsFromWordText(raw, wordDefaultGrade, wordDefaultTopic);
    setWordParsedDrafts(parsed);
  };

  const handleConfirmWordImport = async () => {
    if (wordParsedDrafts.length === 0) {
      setBanner({
        type: 'error',
        text: 'Chưa có câu hỏi nào được bóc tách từ tệp Word. Vui lòng tải tệp .docx hoặc nhấn "Điền mẫu Word chuẩn".',
      });
      return;
    }
    for (const q of wordParsedDrafts) {
      await onSaveQuestion(q);
    }
    const count = wordParsedDrafts.length;
    setShowImportModal(false);
    setImportText('');
    setWordParsedDrafts([]);
    setBanner({
      type: 'success',
      text: `Đã nhập thành công ${count} câu hỏi từ mẫu Word (.docx) vào Ngân hàng câu hỏi.`,
    });
  };

  const handleExportQuestions = () => {
    exportToExcel(
      'Ngan_Hang_Cau_Hoi_Tin_Hoc_THPT_Thanh_Hoa.xlsx',
      'NganHangCauHoi',
      [
        'Mã câu hỏi',
        'Khối',
        'Chủ đề',
        'Đơn vị kiến thức',
        'Mức độ',
        'Dạng câu hỏi',
        'Nội dung',
        'Đáp án đúng',
        'Điểm số',
        'Lời giải',
      ],
      filteredQuestions.map((q) => [
        q.code,
        q.grade,
        q.topic,
        q.knowledgeUnit || q.lesson || '',
        q.cognitiveLevel,
        QUESTION_TYPE_LABELS[q.questionType],
        q.content,
        q.correctAnswer || '',
        q.points,
        q.explanation || '',
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 3: Ngân hàng Câu hỏi Tin học THPT
          </h2>
          <p className="text-sm text-slate-600">
            Quản lý câu hỏi Tin học 10, 11, 12 theo Bộ sách Kết nối tri thức với cuộc sống (Trắc nghiệm, Đúng/Sai 4 ý, Trả lời ngắn, Tự luận &amp; Mã lập trình)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="px-3.5 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Trợ lý AI Tạo câu hỏi</span>
          </button>
          <button
            onClick={() => downloadQuestionWordTemplate()}
            className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải mẫu Word (.docx)</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Thêm câu hỏi từ file Word (.docx)</span>
          </button>
          <button
            onClick={handleExportQuestions}
            className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
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

      {/* Filter Bar & Multi-select Exam Builder Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã câu hỏi, nội dung, chủ đề..."
              className="pl-9 pr-4 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
          >
            <option value="ALL">Tất cả Khối (10, 11, 12)</option>
            <option value="10">Tin học 10</option>
            <option value="11">Tin học 11</option>
            <option value="12">Tin học 12</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
          >
            <option value="ALL">Mọi mức độ nhận thức</option>
            <option value="Nhận biết">Nhận biết</option>
            <option value="Thông hiểu">Thông hiểu</option>
            <option value="Vận dụng">Vận dụng</option>
            <option value="Vận dụng cao">Vận dụng cao</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
          >
            <option value="ALL">Mọi dạng câu hỏi</option>
            <option value="multiple_choice">Trắc nghiệm 1 đáp án</option>
            <option value="true_false">Trắc nghiệm Đúng/Sai</option>
            <option value="short_answer">Trả lời ngắn</option>
            <option value="essay">Tự luận</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-200">
            <span className="text-xs font-bold text-[#0D47A1]">
              Đã chọn {selectedIds.length} câu hỏi
            </span>
            <button
              onClick={() => {
                const picked = questions.filter((q) => selectedIds.includes(q.id));
                onCreateExamFromSelected(picked);
              }}
              className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Tạo đề kiểm tra từ các câu đã chọn</span>
            </button>
          </div>
        )}
      </div>

      {/* Question List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
            <Database className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-[#17365D]">
              Chưa có câu hỏi nào phù hợp với bộ lọc
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Nhấn &quot;Thêm câu hỏi mới&quot; hoặc dùng &quot;Trợ lý AI Tạo câu hỏi&quot; để biên soạn ngân hàng câu hỏi.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#168BFA] transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#0D47A1]">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="rounded border-slate-300"
                    />
                    <span>{q.code}</span>
                  </label>
                  <span>·</span>
                  <span className="font-semibold text-[#17365D]">Tin học {q.grade}</span>
                  <span>·</span>
                  <span>{q.cognitiveLevel}</span>
                  <span>·</span>
                  <span>{QUESTION_TYPE_LABELS[q.questionType]}</span>
                  <span>·</span>
                  <span className="font-bold text-[#FF8A00] tabular-nums">{q.points} điểm</span>
                  {q.isDemo && (
                    <>
                      <span>·</span>
                      <span className="font-bold text-[#FF8A00]">[DỮ LIỆU DEMO]</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPreviewQuestion(q)}
                    className="px-2.5 py-1 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem trước</span>
                  </button>
                  <button
                    onClick={() => handleDuplicateQuestion(q)}
                    className="p-1.5 text-slate-600 hover:text-[#0D47A1] cursor-pointer"
                    title="Sao chép câu hỏi"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(q)}
                    className="p-1.5 text-slate-600 hover:text-[#0D47A1] cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(q)}
                    className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <strong>{q.topic}</strong> {q.lesson ? `— ${q.lesson}` : ''}
              </div>

              <p className="text-sm font-semibold text-[#17365D] leading-relaxed">{q.content}</p>

              {q.codeSnippet && (
                <pre className="p-3 bg-slate-900 text-cyan-300 rounded-lg text-xs font-mono overflow-x-auto">
                  {q.codeSnippet}
                </pre>
              )}

              {q.questionType === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, idx) => {
                    const letter = ['A', 'B', 'C', 'D'][idx] || 'A';
                    const isCorrect = q.correctAnswer?.toUpperCase() === letter;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-[#F4F8FC] border-slate-200 text-slate-700'
                        }`}
                      >
                        {letter}. {opt} {isCorrect && '✓ (Đáp án đúng)'}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.questionType === 'true_false' && q.subItems && (
                <div className="space-y-1.5 text-xs bg-[#F4F8FC] p-3 rounded-lg border border-slate-200">
                  {q.subItems.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between gap-2">
                      <span>
                        <strong>{sub.id})</strong> {sub.text}
                      </span>
                      <span
                        className={`font-bold ${
                          sub.isTrue ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {sub.isTrue ? 'Đúng' : 'Sai'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(q.questionType === 'short_answer' || q.questionType === 'essay') && (
                <div className="text-xs bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-lg text-emerald-950">
                  <strong>Đáp án / Hướng dẫn chấm:</strong> {q.correctAnswer}{' '}
                  {q.gradingGuide ? `| Biểu điểm: ${q.gradingGuide}` : ''}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Create/Edit Question */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                {editingQuestion ? 'Chỉnh sửa Câu hỏi Tin học' : 'Thêm Câu hỏi mới vào Ngân hàng'}
              </h3>
              <button onClick={() => setShowModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Mã câu hỏi *</label>
                  <input
                    type="text"
                    required
                    value={qForm.code}
                    onChange={(e) => setQForm({ ...qForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Khối lớp *</label>
                  <select
                    value={qForm.grade}
                    onChange={(e) => setQForm({ ...qForm, grade: e.target.value as GradeLevel })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="10">Tin học 10</option>
                    <option value="11">Tin học 11</option>
                    <option value="12">Tin học 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Mức độ nhận thức *</label>
                  <select
                    value={qForm.cognitiveLevel}
                    onChange={(e) =>
                      setQForm({ ...qForm, cognitiveLevel: e.target.value as CognitiveLevel })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="Nhận biết">Nhận biết</option>
                    <option value="Thông hiểu">Thông hiểu</option>
                    <option value="Vận dụng">Vận dụng</option>
                    <option value="Vận dụng cao">Vận dụng cao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Điểm số *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="10"
                    value={qForm.points}
                    onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Dạng câu hỏi *</label>
                  <select
                    value={qForm.questionType}
                    onChange={(e) =>
                      setQForm({ ...qForm, questionType: e.target.value as QuestionType })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="multiple_choice">Trắc nghiệm 1 đáp án (A/B/C/D)</option>
                    <option value="true_false">Trắc nghiệm Đúng / Sai (4 ý a,b,c,d)</option>
                    <option value="short_answer">Câu hỏi trả lời ngắn</option>
                    <option value="essay">Câu hỏi tự luận</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Chủ đề chương trình *</label>
                  <input
                    type="text"
                    required
                    value={qForm.topic}
                    onChange={(e) => setQForm({ ...qForm, topic: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  required
                  value={qForm.content}
                  onChange={(e) => setQForm({ ...qForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Đoạn mã lập trình (Python / SQL / HTML - nếu có)
                </label>
                <textarea
                  rows={3}
                  value={qForm.codeSnippet}
                  onChange={(e) => setQForm({ ...qForm, codeSnippet: e.target.value })}
                  placeholder="for i in range(5): print(i)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              {qForm.questionType === 'multiple_choice' && (
                <div className="space-y-2 bg-[#F4F8FC] p-3.5 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-[#0D47A1]">
                    Danh sách 4 phương án và chọn đáp án đúng:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                      <div key={letter} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOpt"
                          checked={qForm.correctAnswer === letter}
                          onChange={() => setQForm({ ...qForm, correctAnswer: letter })}
                        />
                        <span className="text-xs font-bold">{letter}.</span>
                        <input
                          type="text"
                          required
                          value={qForm.options[idx] || ''}
                          onChange={(e) => {
                            const next = [...qForm.options];
                            next[idx] = e.target.value;
                            setQForm({ ...qForm, options: next });
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {qForm.questionType === 'true_false' && (
                <div className="space-y-2 bg-[#F4F8FC] p-3.5 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-[#0D47A1]">
                    Thiết lập các mệnh đề a, b, c, d và chọn Đúng / Sai cho từng ý:
                  </p>
                  {qForm.subItems.map((sub, idx) => (
                    <div key={sub.id} className="flex items-center gap-2">
                      <span className="text-xs font-bold w-6">{sub.id})</span>
                      <input
                        type="text"
                        required
                        value={sub.text}
                        onChange={(e) => {
                          const next = [...qForm.subItems];
                          next[idx] = { ...sub, text: e.target.value };
                          setQForm({ ...qForm, subItems: next });
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <select
                        value={sub.isTrue ? 'true' : 'false'}
                        onChange={(e) => {
                          const next = [...qForm.subItems];
                          next[idx] = { ...sub, isTrue: e.target.value === 'true' };
                          setQForm({ ...qForm, subItems: next });
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold"
                      >
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {(qForm.questionType === 'short_answer' || qForm.questionType === 'essay') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      Đáp án chính xác / Đáp án tham khảo *
                    </label>
                    <input
                      type="text"
                      required
                      value={qForm.correctAnswer}
                      onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  {qForm.questionType === 'essay' && (
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Hướng dẫn chấm và thang điểm chi tiết
                      </label>
                      <textarea
                        rows={2}
                        value={qForm.gradingGuide}
                        onChange={(e) => setQForm({ ...qForm, gradingGuide: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">Lời giải &amp; Giải thích</label>
                <textarea
                  rows={2}
                  value={qForm.explanation}
                  onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Lưu vào Ngân hàng câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Question Generator */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF8A00]" />
                <h3 className="text-lg font-bold text-[#0D47A1]">
                  Trợ lý AI Biên soạn Câu hỏi Tin học THPT
                </h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950">
              <strong>Lưu ý chuyên môn:</strong> Mọi câu hỏi và đáp án do AI đề xuất chỉ mang tính tham khảo. Giáo viên Nguyễn Tiến Dương vui lòng kiểm tra, chỉnh sửa trực tiếp nếu cần và nhấn <strong>&quot;Duyệt &amp; Lưu&quot;</strong> để đưa vào ngân hàng câu hỏi chính thức.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Khối lớp</label>
                <select
                  value={aiParams.grade}
                  onChange={(e) =>
                    setAiParams({ ...aiParams, grade: e.target.value as GradeLevel })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="10">Tin học 10</option>
                  <option value="11">Tin học 11</option>
                  <option value="12">Tin học 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Mức độ nhận thức</label>
                <select
                  value={aiParams.cognitiveLevel}
                  onChange={(e) =>
                    setAiParams({
                      ...aiParams,
                      cognitiveLevel: e.target.value as CognitiveLevel,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">Vận dụng cao</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Dạng câu hỏi</label>
                <select
                  value={aiParams.questionType}
                  onChange={(e) =>
                    setAiParams({ ...aiParams, questionType: e.target.value as QuestionType })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="multiple_choice">Trắc nghiệm 1 đáp án</option>
                  <option value="true_false">Trắc nghiệm Đúng/Sai</option>
                  <option value="short_answer">Trả lời ngắn</option>
                  <option value="essay">Tự luận</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Số lượng câu (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={aiParams.count}
                  onChange={(e) => setAiParams({ ...aiParams, count: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">Chủ đề</label>
                <input
                  type="text"
                  value={aiParams.topic}
                  onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Bài học / Yêu cầu cụ thể</label>
                <input
                  type="text"
                  value={aiParams.lesson}
                  onChange={(e) => setAiParams({ ...aiParams, lesson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Dán nội dung tài liệu / SGK tham khảo (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={aiParams.sourceMaterial}
                onChange={(e) => setAiParams({ ...aiParams, sourceMaterial: e.target.value })}
                placeholder="Dán đoạn văn bản bài học hoặc yêu cầu cần bám sát..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerateAiQuestions}
                disabled={aiLoading}
                className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? 'Đang tạo dự thảo câu hỏi...' : 'Đề xuất câu hỏi với AI'}
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-bold">
                {aiError}
              </div>
            )}

            {aiDrafts.length > 0 && (
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <h4 className="text-sm font-bold text-[#0D47A1]">
                  Danh sách câu hỏi dự thảo chờ Giáo viên kiểm duyệt ({aiDrafts.length})
                </h4>
                {aiDrafts.map((draft, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[#F4F8FC] border border-blue-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0D47A1]">
                        Dự thảo #{idx + 1} · {draft.code} · {draft.cognitiveLevel}
                      </span>
                      <button
                        onClick={() => handleApproveAiDraft(draft, idx)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Duyệt &amp; Lưu vào ngân hàng</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={draft.content}
                      onChange={(e) => {
                        const next = [...aiDrafts];
                        next[idx] = { ...draft, content: e.target.value };
                        setAiDrafts(next);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
                    />
                    <div className="text-xs text-slate-700">
                      <strong>Đáp án đề xuất:</strong> {draft.correctAnswer} |{' '}
                      <strong>Giải thích:</strong> {draft.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Preview Question */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                Xem trước câu hỏi: {previewQuestion.code}
              </h3>
              <button onClick={() => setPreviewQuestion(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">
                Tin học {previewQuestion.grade} · {previewQuestion.topic} · Mức độ:{' '}
                <strong>{previewQuestion.cognitiveLevel}</strong> · Điểm:{' '}
                <strong>{previewQuestion.points}</strong>
              </p>
              <p className="font-bold text-[#17365D]">{previewQuestion.content}</p>
              {previewQuestion.codeSnippet && (
                <pre className="p-3 bg-slate-900 text-cyan-300 rounded-lg text-xs font-mono">
                  {previewQuestion.codeSnippet}
                </pre>
              )}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                <p>
                  <strong>Đáp án chính xác:</strong> {previewQuestion.correctAnswer}
                </p>
                {previewQuestion.explanation && (
                  <p>
                    <strong>Lời giải chi tiết:</strong> {previewQuestion.explanation}
                  </p>
                )}
                {previewQuestion.gradingGuide && (
                  <p>
                    <strong>Hướng dẫn chấm:</strong> {previewQuestion.gradingGuide}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Questions from Word (.docx) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full p-6 border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0D47A1]">
                  Thêm Câu hỏi mới từ File mẫu Word (.docx) — Chuẩn 3 Phần (Nhận diện Gạch chân)
                </h3>
                <p className="text-xs text-slate-600">
                  Hỗ trợ tự động nhận diện đáp án gạch chân (Underline) cho Phần I (A, B, C, D), Phần II (Đúng/Sai 4 ý a, b, c, d kèm mức độ [1.NB], [2.TH], [2.VD], [2.VDC]) và Phần III (Trả lời ngắn)
                </p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Quick Format Specification Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-[#0D47A1]">PHẦN I. TRẮC NGHIỆM 4 LỰA CHỌN</p>
                <p className="text-slate-700">
                  • Ghi mức độ sau số câu: <code>Câu 1 [NB].</code>, <code>Câu 2 [TH].</code>,{' '}
                  <code>Câu 3 [VD].</code>, <code>Câu 4 [VDC].</code>
                </p>
                <p className="text-emerald-800 font-semibold">
                  • Đáp án đúng: Gạch chân chữ cái <u>A</u>, <u>B</u>, <u>C</u> hoặc <u>D</u> trong Word.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-[#0D47A1]">PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI</p>
                <p className="text-slate-700">
                  • 4 ý ghi kèm mức độ: <code>a)[1.NB] ...</code>, <code>b)[2.TH] ...</code>,{' '}
                  <code>c)[2.VD] ...</code>, <code>d)[2.VDC] ...</code>
                </p>
                <p className="text-emerald-800 font-semibold">
                  • Đáp án Đúng: Gạch chân ý đúng. Ý Sai: Không gạch chân.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-[#0D47A1]">PHẦN III. TRẢ LỜI NGẮN</p>
                <p className="text-slate-700">
                  • <code>Câu 1 [VD]: Nội dung câu hỏi</code>
                </p>
                <p className="text-emerald-800 font-semibold">
                  • Dòng đáp án: <code>.nội dung trả lời: 15</code> (hệ thống tự lọc dấu chấm <code>....</code>)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F8FC] p-3.5 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Khối mặc định (nếu trong file Word không gắn thẻ [KHỐI])
                </label>
                <select
                  value={wordDefaultGrade}
                  onChange={(e) => setWordDefaultGrade(e.target.value as GradeLevel)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold"
                >
                  <option value="10">Tin học 10</option>
                  <option value="11">Tin học 11</option>
                  <option value="12">Tin học 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  Chủ đề / Bài học mặc định (nếu trong file Word không gắn thẻ [CHỦ ĐỀ])
                </label>
                <input
                  type="text"
                  value={wordDefaultTopic}
                  onChange={(e) => setWordDefaultTopic(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".docx"
                  onChange={handleWordFileUpload}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#0D47A1] file:text-white file:font-bold cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => downloadQuestionWordTemplate()}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>1. Tải file mẫu Word 3 Phần (.docx)</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleParseRawWordText(SAMPLE_WORD_RAW_TEXT)}
                className="px-3 py-1.5 bg-[#F4F8FC] border border-blue-200 text-[#0D47A1] rounded-lg text-xs font-bold cursor-pointer"
              >
                Điền mẫu chuẩn 3 Phần (Phần I, II, III có gạch chân)
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-[#17365D]">
                Nội dung trích xuất từ file Word (.docx) — Thẻ <code>&lt;u&gt;...&lt;/u&gt;</code> biểu thị nội dung được gạch chân trong Word:
              </label>
              <textarea
                rows={7}
                value={importText}
                onChange={(e) => handleParseRawWordText(e.target.value)}
                placeholder="Chọn file .docx ở trên hoặc nhấn 'Điền mẫu chuẩn 3 Phần'..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            {wordParsedDrafts.length > 0 && (
              <div className="space-y-2 border border-blue-200 rounded-xl p-4 bg-[#F4F8FC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0D47A1]">
                    Xem trước &amp; Chỉnh sửa kết quả bóc tách tự động: Đã nhận diện{' '}
                    <strong className="text-emerald-700">{wordParsedDrafts.length} câu hỏi</strong>
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2.5">
                  {wordParsedDrafts.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 font-bold text-[#0D47A1]">
                          <span>
                            Câu {idx + 1} ({QUESTION_TYPE_LABELS[d.questionType]})
                          </span>
                          <select
                            value={d.grade}
                            onChange={(e) => {
                              const next = [...wordParsedDrafts];
                              next[idx] = { ...d, grade: e.target.value as GradeLevel };
                              setWordParsedDrafts(next);
                            }}
                            className="px-2 py-0.5 border border-slate-300 rounded text-xs"
                          >
                            <option value="10">Khối 10</option>
                            <option value="11">Khối 11</option>
                            <option value="12">Khối 12</option>
                          </select>
                          <select
                            value={d.cognitiveLevel}
                            onChange={(e) => {
                              const next = [...wordParsedDrafts];
                              next[idx] = {
                                ...d,
                                cognitiveLevel: e.target.value as CognitiveLevel,
                              };
                              setWordParsedDrafts(next);
                            }}
                            className="px-2 py-0.5 border border-slate-300 rounded text-xs"
                          >
                            <option value="Nhận biết">Nhận biết (NB)</option>
                            <option value="Thông hiểu">Thông hiểu (TH)</option>
                            <option value="Vận dụng">Vận dụng (VD)</option>
                            <option value="Vận dụng cao">Vận dụng cao (VDC)</option>
                          </select>
                          <label className="flex items-center gap-1">
                            <span>Điểm:</span>
                            <input
                              type="number"
                              step="0.25"
                              value={d.points}
                              onChange={(e) => {
                                const next = [...wordParsedDrafts];
                                next[idx] = { ...d, points: Number(e.target.value) || 0.25 };
                                setWordParsedDrafts(next);
                              }}
                              className="w-14 px-1.5 py-0.5 border border-slate-300 rounded text-xs tabular-nums"
                            />
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 font-bold text-emerald-700">
                            <span>Đáp án:</span>
                            <input
                              type="text"
                              value={d.correctAnswer || ''}
                              onChange={(e) => {
                                const next = [...wordParsedDrafts];
                                next[idx] = { ...d, correctAnswer: e.target.value };
                                setWordParsedDrafts(next);
                              }}
                              placeholder={
                                d.questionType === 'short_answer' ? 'Nhập đáp án trả lời ngắn...' : ''
                              }
                              className="w-32 px-1.5 py-0.5 border border-emerald-300 rounded text-xs"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setWordParsedDrafts((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-red-600 hover:underline font-bold cursor-pointer px-1"
                            title="Loại bỏ câu này"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={d.content}
                        onChange={(e) => {
                          const next = [...wordParsedDrafts];
                          next[idx] = { ...d, content: e.target.value };
                          setWordParsedDrafts(next);
                        }}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-slate-800 font-semibold"
                      />
                      {d.questionType === 'multiple_choice' && d.options && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                          {d.options.map((opt, oIdx) => {
                            const letter = ['A', 'B', 'C', 'D'][oIdx];
                            const isCorrect = d.correctAnswer === letter;
                            return (
                              <button
                                key={letter}
                                type="button"
                                onClick={() => {
                                  const next = [...wordParsedDrafts];
                                  next[idx] = { ...d, correctAnswer: letter };
                                  setWordParsedDrafts(next);
                                }}
                                className={`p-1.5 rounded border text-left cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className={isCorrect ? 'underline' : ''}>{letter}.</span> {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {d.questionType === 'true_false' && d.subItems && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {d.subItems.map((sub, sIdx) => (
                            <div
                              key={sub.id}
                              className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                            >
                              <span className={sub.isTrue ? 'underline font-semibold text-emerald-900' : 'text-slate-700'}>
                                <strong>{sub.id})</strong>{' '}
                                {sub.cognitiveLevel ? `[${sub.cognitiveLevel}] ` : ''}
                                {sub.text}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSubs = d.subItems!.map((item, i) =>
                                    i === sIdx ? { ...item, isTrue: !item.isTrue } : item
                                  );
                                  const nextAns = nextSubs
                                    .map((s) => `${s.id}:${s.isTrue ? 'Đ' : 'S'}`)
                                    .join(',');
                                  const next = [...wordParsedDrafts];
                                  next[idx] = {
                                    ...d,
                                    subItems: nextSubs,
                                    correctAnswer: nextAns,
                                  };
                                  setWordParsedDrafts(next);
                                }}
                                className={`px-2 py-0.5 rounded font-bold cursor-pointer shrink-0 ${
                                  sub.isTrue
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {sub.isTrue ? 'Đúng (Gạch chân)' : 'Sai'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {d.codeSnippet && (
                        <pre className="p-2 bg-slate-900 text-cyan-300 rounded text-[11px] font-mono">
                          {d.codeSnippet}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmWordImport}
                className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Lưu {wordParsedDrafts.length} câu hỏi vào Ngân hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-red-700">Xác nhận xóa câu hỏi</h3>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa câu hỏi <strong>{deleteTarget.code}</strong> khỏi ngân hàng câu hỏi?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  await onDeleteQuestion(deleteTarget.id);
                  setDeleteTarget(null);
                  setBanner({ type: 'success', text: 'Đã xóa câu hỏi khỏi ngân hàng.' });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
