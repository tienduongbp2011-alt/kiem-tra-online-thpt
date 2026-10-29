import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  FolderOpen,
  Settings,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Download,
  Upload,
  Shuffle,
  X,
} from 'lucide-react';
import {
  AuditLogItem,
  ClassRoom,
  GradeLevel,
  LearningPlan,
  LearningResource,
  Question,
  Student,
  Submission,
  SystemSetting,
} from '../types';

// ============================================================================
// PHÂN HỆ 8: KẾ HOẠCH ÔN TẬP (LEARNING PLANS)
// ============================================================================
interface LearningPlansViewProps {
  plans: LearningPlan[];
  questions: Question[];
  classes: ClassRoom[];
  onSavePlan: (
    plan: Omit<LearningPlan, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
}

export const LearningPlansView: React.FC<LearningPlansViewProps> = ({
  plans,
  questions,
  classes,
  onSavePlan,
  onDeletePlan,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    title: '',
    grade: '10' as GradeLevel,
    topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính (Python)',
    lesson: 'Ôn tập Vòng lặp và Danh sách',
    objective: 'Học sinh nắm vững cú pháp và giải được các bài toán duyệt danh sách cơ bản.',
    mode: 'Luyện tập' as 'Luyện tập' | 'Kiểm tra',
    classId: classes[0]?.id || '',
    dueDate: '2026-11-30',
    questionIds: [] as string[],
    isDemo: false,
  });

  // Interactive Practice / Review Runner Modal
  const [activePracticePlan, setActivePracticePlan] = useState<LearningPlan | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);

  const handleRandomSelectApprovedQuestions = () => {
    const approved = questions.filter((q) => q.isApproved && q.grade === planForm.grade);
    const pool = approved.length > 0 ? approved : questions.filter((q) => q.isApproved);
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    setPlanForm((prev) => ({
      ...prev,
      questionIds: shuffled.map((q) => q.id),
    }));
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.title.trim()) return;
    const cls = classes.find((c) => c.id === planForm.classId);
    await onSavePlan({
      title: planForm.title.trim(),
      grade: planForm.grade,
      topic: planForm.topic.trim(),
      lesson: planForm.lesson.trim(),
      objective: planForm.objective.trim(),
      mode: planForm.mode,
      classId: cls?.id || '',
      className: cls?.name || 'Toàn khối',
      dueDate: planForm.dueDate,
      questionIds:
        planForm.questionIds.length > 0
          ? planForm.questionIds
          : questions.slice(0, 3).map((q) => q.id),
      completedCount: 0,
      totalStudents: cls?.studentCount || 30,
      status: 'active',
      isDemo: planForm.isDemo,
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 8: Kế hoạch Ôn tập &amp; Luyện tập theo Chủ đề
          </h2>
          <p className="text-sm text-slate-600">
            Tổ chức ôn tập hệ thống theo Khối 10, 11, 12 với 2 chế độ: Luyện tập (xem đáp án và lời giải ngay) và Kiểm tra
          </p>
        </div>
        <button
          onClick={() => {
            setPlanForm({
              ...planForm,
              title: '',
              classId: classes[0]?.id || '',
              questionIds: questions.slice(0, 3).map((q) => q.id),
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo kế hoạch ôn tập mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-10 text-center border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-[#17365D]">Chưa có kế hoạch ôn tập nào</p>
          </div>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Khối {p.grade} · Lớp: <strong>{p.className || 'Toàn khối'}</strong> · Hạn:{' '}
                    {p.dueDate || 'Không giới hạn'}
                  </span>
                  <span
                    className={`font-bold ${
                      p.mode === 'Luyện tập' ? 'text-emerald-700' : 'text-[#FF8A00]'
                    }`}
                  >
                    ● Chế độ: {p.mode}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0D47A1]">{p.title}</h3>
                <p className="text-xs font-semibold text-slate-700">{p.topic}</p>
                {p.objective && <p className="text-xs text-slate-600">Mục tiêu: {p.objective}</p>}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#17365D] tabular-nums">
                  Tiến độ hoàn thành: {p.completedCount}/{p.totalStudents} học sinh (
                  {(p.questionIds || []).length} câu hỏi)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActivePracticePlan(p);
                      setPracticeAnswers({});
                      setRevealedQuestions({});
                      setTestSubmitted(false);
                    }}
                    className="px-3 py-1.5 bg-[#168BFA] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Mở bài luyện tập</span>
                  </button>
                  <button
                    onClick={() => onDeletePlan(p.id)}
                    className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Plan */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">Tạo Kế hoạch Ôn tập Có Hệ thống</h3>
              <button onClick={() => setShowModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Tên kế hoạch ôn tập *</label>
                <input
                  type="text"
                  required
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  placeholder="Ôn tập chuyên đề Python / SQL..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Khối lớp</label>
                  <select
                    value={planForm.grade}
                    onChange={(e) =>
                      setPlanForm({ ...planForm, grade: e.target.value as GradeLevel })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Chế độ ôn tập *</label>
                  <select
                    value={planForm.mode}
                    onChange={(e) =>
                      setPlanForm({
                        ...planForm,
                        mode: e.target.value as 'Luyện tập' | 'Kiểm tra',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="Luyện tập">Chế độ Luyện tập (Xem giải ngay)</option>
                    <option value="Kiểm tra">Chế độ Kiểm tra (Nộp mới xem)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Giao cho Lớp</label>
                  <select
                    value={planForm.classId}
                    onChange={(e) => setPlanForm({ ...planForm, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Chủ đề &amp; Bài học</label>
                <input
                  type="text"
                  value={planForm.topic}
                  onChange={(e) => setPlanForm({ ...planForm, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Mục tiêu cần đạt</label>
                <textarea
                  rows={2}
                  value={planForm.objective}
                  onChange={(e) => setPlanForm({ ...planForm, objective: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="p-3 bg-[#F4F8FC] rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0D47A1]">
                    Bộ câu hỏi luyện tập (Đã chọn {planForm.questionIds.length} câu đã duyệt)
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomSelectApprovedQuestions}
                    className="px-2.5 py-1 bg-[#FF8A00] text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Bốc ngẫu nhiên câu hỏi đã duyệt</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
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
                  Lưu kế hoạch ôn tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Practice Session Modal */}
      {activePracticePlan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold text-[#168BFA]">
                  CHẾ ĐỘ: {activePracticePlan.mode.toUpperCase()}
                </span>
                <h3 className="text-lg font-bold text-[#0D47A1]">{activePracticePlan.title}</h3>
              </div>
              <button onClick={() => setActivePracticePlan(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {(() => {
              const planQs = questions.filter((q) =>
                (activePracticePlan.questionIds || []).includes(q.id)
              );
              const listToShow = planQs.length > 0 ? planQs : questions.slice(0, 3);

              return (
                <div className="space-y-4">
                  {listToShow.map((q, idx) => {
                    const userAns = practiceAnswers[q.id] || '';
                    const canShowSolution =
                      (activePracticePlan.mode === 'Luyện tập' && revealedQuestions[q.id]) ||
                      (activePracticePlan.mode === 'Kiểm tra' && testSubmitted);

                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-[#F4F8FC] border border-slate-200 space-y-2.5"
                      >
                        <p className="text-sm font-bold text-[#0D47A1]">
                          Câu {idx + 1} ({q.code}): {q.content}
                        </p>
                        {q.options && q.options.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const letter = ['A', 'B', 'C', 'D'][oIdx] || 'A';
                              return (
                                <label
                                  key={letter}
                                  className="p-2 bg-white rounded border border-slate-300 flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={`prac_${q.id}`}
                                    checked={userAns === letter}
                                    onChange={() => {
                                      setPracticeAnswers((prev) => ({ ...prev, [q.id]: letter }));
                                      if (activePracticePlan.mode === 'Luyện tập') {
                                        setRevealedQuestions((prev) => ({ ...prev, [q.id]: true }));
                                      }
                                    }}
                                  />
                                  <span>
                                    <strong>{letter}.</strong> {opt}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={userAns}
                            onChange={(e) =>
                              setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="Nhập câu trả lời của bạn..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                          />
                        )}

                        {activePracticePlan.mode === 'Luyện tập' && !revealedQuestions[q.id] && (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedQuestions((prev) => ({ ...prev, [q.id]: true }))
                            }
                            className="text-xs font-bold text-[#168BFA] underline cursor-pointer"
                          >
                            Kiểm tra đáp án &amp; Xem lời giải
                          </button>
                        )}

                        {canShowSolution && (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-1">
                            <p>
                              <strong>Đáp án đúng:</strong> {q.correctAnswer}
                            </p>
                            {q.explanation && (
                              <p>
                                <strong>Lời giải:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activePracticePlan.mode === 'Kiểm tra' && !testSubmitted && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setTestSubmitted(true)}
                        className="px-4 py-2 bg-[#FF8A00] text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Nộp bài Ôn tập để xem kết quả
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PHÂN HỆ 9: TRỢ LÝ AI GIÁO VIÊN (AI TEACHER ASSISTANT)
// ============================================================================
interface AiAssistantViewProps {
  classes: ClassRoom[];
  students: Student[];
  submissions: Submission[];
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  classes,
  students,
  submissions,
}) => {
  const [aiStatus, setAiStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [taskType, setTaskType] = useState('Hỗ trợ tạo đề cương ôn tập');
  const [grade, setGrade] = useState<GradeLevel>('10');
  const [topic, setTopic] = useState('Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính (Python)');
  const [prompt, setPrompt] = useState(
    'Hãy lập đề cương ôn tập kiểm tra giữa kỳ I môn Tin học 10 gồm các trọng tâm lý thuyết, bài tập mẫu Python về vòng lặp for/while và hướng dẫn giải chi tiết.'
  );
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then((d) => setAiStatus(d))
      .catch(() =>
        setAiStatus({
          connected: false,
          message: 'Chưa kết nối được dịch vụ AI phía máy chủ.',
        })
      );
  }, []);

  const handleAskAssistant = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Anonymous aggregated stats only (never leaks personal student data)
      const graded = submissions.filter((s) => s.status === 'Đã chấm');
      const avg =
        graded.length > 0
          ? Math.round((graded.reduce((a, b) => a + b.totalScore, 0) / graded.length) * 100) / 100
          : 0;
      const contextSummary = `Tổng số lớp: ${classes.length}, Tổng số học sinh: ${students.length}, Số bài đã chấm: ${graded.length}, Điểm TB chung: ${avg}/10.`;

      const resp = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          grade,
          topic,
          prompt,
          contextSummary,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.error || 'Dịch vụ AI chưa phản hồi.');
      } else {
        setReply(data.reply || '');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối dịch vụ AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#FF8A00]" />
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 9: Trợ lý AI Chuyên môn Tin học THPT
          </h2>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Hỗ trợ giáo viên Nguyễn Tiến Dương xây dựng câu hỏi, tạo đề cương ôn tập, phân tích kết quả kiểm tra ẩn danh và soạn hướng dẫn giải tham khảo.
        </p>

        {aiStatus && (
          <div
            className={`mt-3 p-3 rounded-lg border text-xs font-bold flex items-center gap-2 ${
              aiStatus.connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {aiStatus.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            )}
            <span>{aiStatus.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-[#0D47A1]">Thiết lập yêu cầu chuyên môn</h3>

          <div>
            <label className="block text-xs font-bold mb-1">Chức năng hỗ trợ</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
            >
              <option value="Hỗ trợ xây dựng câu hỏi">1. Hỗ trợ xây dựng câu hỏi</option>
              <option value="Hỗ trợ tạo đề cương ôn tập">2. Hỗ trợ tạo đề cương ôn tập</option>
              <option value="Hỗ trợ phân tích kết quả kiểm tra">
                3. Hỗ trợ phân tích kết quả kiểm tra
              </option>
              <option value="Đề xuất chủ đề cần củng cố">4. Đề xuất chủ đề cần củng cố</option>
              <option value="Hỗ trợ lập kế hoạch ôn tập">5. Hỗ trợ lập kế hoạch ôn tập</option>
              <option value="Hỗ trợ soạn hướng dẫn giải và lời giải tham khảo">
                6. Hỗ trợ soạn hướng dẫn giải &amp; lời giải tham khảo
              </option>
              <option value="Tạo báo cáo tổng hợp ẩn danh">
                7. Tạo báo cáo tổng hợp (Bảo mật PII)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Khối lớp</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm"
              >
                <option value="10">Tin học 10</option>
                <option value="11">Tin học 11</option>
                <option value="12">Tin học 12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Chủ đề chương trình</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Nội dung yêu cầu chi tiết</label>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <button
            onClick={handleAskAssistant}
            disabled={loading}
            className="w-full py-2.5 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Trợ lý AI đang xử lý...' : 'Gửi yêu cầu tới Trợ lý AI Giáo viên'}
          </button>

          <p className="text-[11px] text-slate-500">
            Nguyên tắc an toàn: AI kết nối qua máy chủ trung gian, không lộ API key dưới trình duyệt và không có quyền tự ý thay đổi điểm số hay phát hành đề thi khi chưa có xác nhận của giáo viên.
          </p>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0D47A1] border-b border-slate-200 pb-3">
              Kết quả tư vấn &amp; Dự thảo từ Trợ lý AI
            </h3>
            {errorMsg && (
              <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-xs font-bold text-red-800">
                {errorMsg}
              </div>
            )}
            {reply ? (
              <div className="mt-4 p-4 rounded-xl bg-[#F4F8FC] border border-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                {reply}
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Sparkles className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">
                  Chọn chức năng bên trái và nhấn &quot;Gửi yêu cầu&quot; để nhận bản dự thảo chuyên môn
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PHÂN HỆ 10: TÀI LIỆU VÀ HỌC LIỆU (LEARNING RESOURCES)
// ============================================================================
interface ResourcesViewProps {
  resources: LearningResource[];
  isTeacherOrAdmin: boolean;
  onSaveResource: (
    res: Omit<LearningResource, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>
  ) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources,
  isTeacherOrAdmin,
  onSaveResource,
  onDeleteResource,
}) => {
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [resForm, setResForm] = useState({
    title: '',
    category: 'Bài giảng' as LearningResource['category'],
    grade: '10' as GradeLevel | 'ALL',
    topic: '',
    description: '',
    externalUrl: 'https://hanhtrangso.nxbgd.vn',
    accessLevel: 'public_students' as 'public_students' | 'teacher_only',
  });

  const visibleResources = resources.filter((r) => {
    if (!isTeacherOrAdmin && r.accessLevel === 'teacher_only') return false;
    if (gradeFilter !== 'ALL' && r.grade !== 'ALL' && r.grade !== gradeFilter) return false;
    return true;
  });

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.title.trim()) return;
    await onSaveResource({
      title: resForm.title.trim(),
      category: resForm.category,
      grade: resForm.grade,
      topic: resForm.topic.trim(),
      description: resForm.description.trim(),
      resourceType: 'document',
      externalUrl: resForm.externalUrl.trim(),
      fileStatus: 'Đã lưu siêu dữ liệu và liên kết học liệu (Chưa cấu hình máy chủ lưu tệp vật lý)',
      accessLevel: resForm.accessLevel,
      isDemo: false,
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 10: Thư viện Tài liệu &amp; Học liệu Tin học THPT
          </h2>
          <p className="text-sm text-slate-600">
            Bài giảng, đề cương PDF, bài tập thực hành Python/SQL và hướng dẫn sử dụng hệ thống theo Khối 10, 11, 12
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-xs font-bold"
          >
            <option value="ALL">Mọi khối lớp</option>
            <option value="10">Tin học 10</option>
            <option value="11">Tin học 11</option>
            <option value="12">Tin học 12</option>
          </select>
          {isTeacherOrAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học liệu</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleResources.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {r.category} · {r.grade === 'ALL' ? 'Toàn trường' : `Khối ${r.grade}`}
                </span>
                <span className="font-bold text-[#0D47A1]">
                  {r.accessLevel === 'public_students' ? 'Học sinh được xem' : 'Nội bộ GV'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0D47A1] mt-1">{r.title}</h3>
              {r.description && <p className="text-xs text-slate-600 mt-1">{r.description}</p>}
              {r.fileStatus && (
                <p className="text-[11px] text-slate-500 mt-2 italic">
                  Trạng thái: {r.fileStatus}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {r.externalUrl ? (
                <a
                  href={r.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#168BFA] hover:underline flex items-center gap-1"
                >
                  <span>Mở tài liệu</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Không có liên kết ngoài</span>
              )}
              {isTeacherOrAdmin && (
                <button
                  onClick={() => onDeleteResource(r.id)}
                  className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">Thêm Tài liệu / Học liệu mới</h3>
              <button onClick={() => setShowModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddResource} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Tiêu đề học liệu *</label>
                <input
                  type="text"
                  required
                  value={resForm.title}
                  onChange={(e) => setResForm({ ...resForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Phân loại</label>
                  <select
                    value={resForm.category}
                    onChange={(e) =>
                      setResForm({
                        ...resForm,
                        category: e.target.value as LearningResource['category'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="Bài giảng">Bài giảng</option>
                    <option value="Tệp PDF">Tệp PDF</option>
                    <option value="Tài liệu thực hành">Tài liệu thực hành</option>
                    <option value="Bài tập">Bài tập</option>
                    <option value="Liên kết tài nguyên">Liên kết tài nguyên</option>
                    <option value="Hướng dẫn sử dụng">Hướng dẫn sử dụng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Khối lớp</label>
                  <select
                    value={resForm.grade}
                    onChange={(e) =>
                      setResForm({ ...resForm, grade: e.target.value as GradeLevel | 'ALL' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                    <option value="ALL">Tất cả khối</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Liên kết tài liệu (URL)</label>
                <input
                  type="text"
                  value={resForm.externalUrl}
                  onChange={(e) => setResForm({ ...resForm, externalUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Quyền truy cập</label>
                <select
                  value={resForm.accessLevel}
                  onChange={(e) =>
                    setResForm({
                      ...resForm,
                      accessLevel: e.target.value as 'public_students' | 'teacher_only',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="public_students">Cho phép Học sinh xem và tải</option>
                  <option value="teacher_only">Chỉ Giáo viên xem</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Mô tả nội dung</label>
                <textarea
                  rows={2}
                  value={resForm.description}
                  onChange={(e) => setResForm({ ...resForm, description: e.target.value })}
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
                  Lưu học liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PHÂN HỆ 11 & 12: CÀI ĐẶT HỆ THỐNG, PHÂN QUYỀN & NHẬT KÝ HOẠT ĐỘNG
// ============================================================================
interface SystemSettingsViewProps {
  settings: SystemSetting;
  auditLogs: AuditLogItem[];
  onSaveSettings: (newSettings: SystemSetting) => Promise<void>;
  onExportFullBackup: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  settings,
  auditLogs,
  onSaveSettings,
  onExportFullBackup,
}) => {
  const [formState, setFormState] = useState<SystemSetting>(settings);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(formState);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 11 &amp; 12: Quản lý Phân quyền, Sao lưu &amp; Cài đặt Hệ thống
          </h2>
          <p className="text-sm text-slate-600">
            Cấu hình thông tin Trường THPT Thanh Hòa, thang điểm, bảo mật phân quyền RBAC và nhật ký hoạt động hệ thống
          </p>
        </div>
        <button
          onClick={onExportFullBackup}
          className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Sao lưu toàn bộ dữ liệu (JSON)</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          <span>Đã lưu cấu hình hệ thống Tin học THPT Thanh Hòa thành công.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* School & System Config Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Settings className="w-5 h-5 text-[#0D47A1]" />
            <h3 className="text-base font-bold text-[#0D47A1]">
              Thông tin Trường học &amp; Tham số Kiểm tra Mặc định
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Tên chính thức của Website</label>
              <input
                type="text"
                value={formState.websiteName}
                onChange={(e) => setFormState({ ...formState, websiteName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Đơn vị Trường học</label>
              <input
                type="text"
                value={formState.schoolName}
                onChange={(e) => setFormState({ ...formState, schoolName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Địa chỉ</label>
              <input
                type="text"
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Giáo viên phụ trách</label>
              <input
                type="text"
                value={formState.teacherName}
                onChange={(e) => setFormState({ ...formState, teacherName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Môn học</label>
              <input
                type="text"
                value={formState.subjectName}
                onChange={(e) => setFormState({ ...formState, subjectName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Năm học</label>
              <input
                type="text"
                value={formState.academicYear}
                onChange={(e) => setFormState({ ...formState, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Thang điểm chuẩn</label>
              <select
                value={formState.gradingScale}
                onChange={(e) =>
                  setFormState({ ...formState, gradingScale: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value={10}>Thang điểm 10</option>
                <option value={100}>Thang điểm 100</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                Thời gian làm bài mặc định (Phút)
              </label>
              <input
                type="number"
                value={formState.defaultDurationMinutes}
                onChange={(e) =>
                  setFormState({ ...formState, defaultDurationMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F4F8FC] border border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              Ngôn ngữ: <strong>Tiếng Việt</strong>
            </div>
            <div>
              Múi giờ: <strong>Asia/Ho_Chi_Minh</strong>
            </div>
            <div>
              Định dạng: <strong>dd/MM/yyyy</strong>
            </div>
            <div>
              Phông chữ: <strong>Times New Roman</strong>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Lưu Cài đặt Hệ thống
            </button>
          </div>
        </form>

        {/* RBAC Security & Audit Logs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-sm">
              <Shield className="w-5 h-5 text-emerald-700" />
              <span>Cơ chế Phân quyền &amp; Bảo mật Dữ liệu (RBAC)</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
              <li>
                <strong>Quản trị viên / Giáo viên (Nguyễn Tiến Dương):</strong> Toàn quyền quản lý lớp, học sinh, ngân hàng câu hỏi, ma trận đề, chấm bài và cấu hình hệ thống.
              </li>
              <li>
                <strong>Học sinh (Khối 10, 11, 12):</strong> Chỉ xem bài thi được giao đúng lớp, làm bài, nộp bài và xem điểm cá nhân của chính mình.
              </li>
              <li>
                <strong>Bảo vệ Đáp án &amp; PII:</strong> Thực thi trực tiếp tại lớp bảo mật <code>firestore.rules</code> trên đám mây, ngăn học sinh tự nâng quyền hoặc đọc đáp án trước khi nộp bài.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-[#0D47A1]">
              Nhật ký các hoạt động quan trọng ({auditLogs.length})
            </h3>
            <div className="max-h-56 overflow-y-auto space-y-2">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500">Chưa có bản ghi nhật ký mới.</p>
              ) : (
                auditLogs.slice(0, 15).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded bg-[#F4F8FC] border border-slate-200 text-xs"
                  >
                    <div className="flex justify-between font-bold text-[#0D47A1]">
                      <span>
                        [{log.module}] {log.action}
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {log.createdAt.slice(0, 16).replace('T', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Thực hiện bởi: <strong>{log.actorName}</strong>{' '}
                      {log.details ? `— ${log.details}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
