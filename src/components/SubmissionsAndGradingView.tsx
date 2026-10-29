import React, { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  Download,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  X,
  History,
} from 'lucide-react';
import {
  Assignment,
  ClassRoom,
  ExamAnswerKey,
  Submission,
  SubmissionStatus,
} from '../types';
import { exportToCsv } from '../data/demoSeedData';

interface SubmissionsAndGradingViewProps {
  submissions: Submission[];
  classes: ClassRoom[];
  assignments: Assignment[];
  answerKeys: ExamAnswerKey[];
  onGradeOrAdjustSubmission: (
    submission: Submission,
    newObjectiveScore: number,
    newEssayScore: number,
    feedback: string,
    reason: string
  ) => Promise<void>;
}

export const SubmissionsAndGradingView: React.FC<SubmissionsAndGradingViewProps> = ({
  submissions,
  classes,
  assignments,
  answerKeys,
  onGradeOrAdjustSubmission,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [inspectingSub, setInspectingSub] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({
    objectiveScore: 0,
    essayScore: 0,
    feedback: '',
    reason: 'Chấm điểm tự luận và rà soát bài làm',
  });
  const [banner, setBanner] = useState<string | null>(null);

  const filteredSubmissions = submissions.filter((s) => {
    const matchClass = classFilter === 'ALL' || s.classId === classFilter;
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchQuery =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchStatus && matchQuery;
  });

  const openGradingModal = (sub: Submission) => {
    setInspectingSub(sub);
    setGradeForm({
      objectiveScore: sub.objectiveScore,
      essayScore: sub.essayScore,
      feedback: sub.teacherFeedback || '',
      reason:
        sub.status === 'Chờ chấm'
          ? 'Chấm điểm câu hỏi tự luận'
          : 'Rà soát và điều chỉnh điểm số',
    });
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingSub) return;
    await onGradeOrAdjustSubmission(
      inspectingSub,
      Number(gradeForm.objectiveScore) || 0,
      Number(gradeForm.essayScore) || 0,
      gradeForm.feedback.trim(),
      gradeForm.reason.trim() || 'Cập nhật điểm bài kiểm tra'
    );
    setInspectingSub(null);
    setBanner(`Đã cập nhật điểm số và ghi nhận lịch sử chấm bài cho học sinh ${inspectingSub.studentName}.`);
  };

  const handleExportSubmissions = () => {
    exportToCsv(
      'Bang_Diem_Bai_Lam_Hoc_Sinh_THPT_Thanh_Hoa.csv',
      [
        'Mã bài nộp',
        'Đề kiểm tra',
        'Mã HS',
        'Họ và tên',
        'Lớp',
        'Bắt đầu',
        'Nộp bài',
        'Trạng thái',
        'Điểm TN',
        'Điểm TL',
        'Tổng điểm',
      ],
      filteredSubmissions.map((s) => [
        s.id,
        s.examTitle,
        s.studentCode,
        s.studentName,
        s.className,
        s.startedAt,
        s.submittedAt || '',
        s.status,
        s.objectiveScore,
        s.essayScore,
        s.totalScore,
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 6: Quản lý Bài làm Học sinh &amp; Chấm điểm Tự luận
          </h2>
          <p className="text-sm text-slate-600">
            Theo dõi trạng thái làm bài, chấm điểm tự luận, rà soát câu đúng/sai và lưu lịch sử thay đổi điểm số
          </p>
        </div>
        <button
          onClick={handleExportSubmissions}
          className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Xuất bảng điểm CSV / Excel</span>
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between text-sm font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>{banner}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Quick Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Tổng số bài phát sinh</p>
          <p className="text-2xl font-bold text-[#0D47A1] tabular-nums mt-1">
            {submissions.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Đang làm bài</p>
          <p className="text-2xl font-bold text-[#168BFA] tabular-nums mt-1">
            {submissions.filter((s) => s.status === 'Đang làm bài').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Chờ chấm tự luận</p>
          <p className="text-2xl font-bold text-[#FF8A00] tabular-nums mt-1">
            {submissions.filter((s) => s.status === 'Chờ chấm').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Đã hoàn tất chấm</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {submissions.filter((s) => s.status === 'Đã chấm').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm học sinh, mã HS, tên đề..."
            className="pl-9 pr-4 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
        >
          <option value="ALL">Tất cả các lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold"
        >
          <option value="ALL">Mọi trạng thái bài làm</option>
          {(
            [
              'Chưa bắt đầu',
              'Đang làm bài',
              'Đã nộp',
              'Chờ chấm',
              'Đã chấm',
              'Quá hạn',
            ] as SubmissionStatus[]
          ).map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-base font-bold text-[#17365D]">Chưa có bài làm học sinh nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Khi học sinh bắt đầu làm bài hoặc nộp bài, danh sách sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0D47A1] text-white text-xs">
                  <th className="py-3 px-4">Mã bài</th>
                  <th className="py-3 px-4">Tên bài kiểm tra</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Bắt đầu / Nộp bài</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Điểm TN</th>
                  <th className="py-3 px-4 text-right">Điểm TL</th>
                  <th className="py-3 px-4 text-right">Tổng điểm</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#F4F8FC]">
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {sub.id.slice(-8)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#0D47A1]">
                      {sub.examTitle}
                      {sub.isDemo && (
                        <span className="ml-1 text-xs text-[#FF8A00]">[DEMO]</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#17365D]">{sub.studentName}</p>
                      <p className="text-xs text-slate-500">{sub.studentCode}</p>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">{sub.className}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 tabular-nums">
                      <div>BĐ: {sub.startedAt.slice(0, 16).replace('T', ' ')}</div>
                      {sub.submittedAt && (
                        <div>Nộp: {sub.submittedAt.slice(0, 16).replace('T', ' ')}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold ${
                          sub.status === 'Đã chấm'
                            ? 'text-emerald-700'
                            : sub.status === 'Chờ chấm'
                            ? 'text-[#FF8A00]'
                            : 'text-[#168BFA]'
                        }`}
                      >
                        {sub.status === 'Chờ chấm' ? '▲ Chờ chấm TL' : `● ${sub.status}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">
                      {sub.objectiveScore}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">
                      {sub.essayScore}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-[#0D47A1]">
                      {sub.totalScore}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openGradingModal(sub)}
                        className="px-3 py-1.5 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {sub.status === 'Chờ chấm' ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Chấm tự luận</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết / Rà soát</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Detailed Submission Inspector & Essay Grading */}
      {inspectingSub && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0D47A1]">
                  Chi tiết Bài làm &amp; Chấm điểm: {inspectingSub.studentName} ({inspectingSub.studentCode})
                </h3>
                <p className="text-xs text-slate-600">
                  Đề kiểm tra: <strong>{inspectingSub.examTitle}</strong> · Lớp:{' '}
                  <strong>{inspectingSub.className}</strong>
                </p>
              </div>
              <button onClick={() => setInspectingSub(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Questions & Student Answers Review */}
            {(() => {
              const asg = assignments.find((a) => a.id === inspectingSub.assignmentId);
              const qList = asg?.questionsSnapshot || [];
              const keyDoc = answerKeys.find((k) => k.examId === inspectingSub.examId);
              const keyMap = keyDoc?.answersMap || {};

              return (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#0D47A1]">
                    Chi tiết từng câu trả lời của học sinh:
                  </h4>
                  {qList.map((q, idx) => {
                    const studentAns = inspectingSub.answersMap[q.id] || '(Bỏ trống)';
                    const correctAns = keyMap[q.id] || '';
                    const isEssay = q.questionType === 'essay';
                    const isMatch =
                      !isEssay &&
                      studentAns.trim().toLowerCase() === correctAns.trim().toLowerCase();

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                          isEssay
                            ? 'bg-orange-50/50 border-orange-300'
                            : isMatch
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-red-50/40 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-[#0D47A1]">
                            Câu {idx + 1} ({q.code} - {q.points} điểm) [{q.questionType}]
                          </span>
                          <span>
                            {isEssay
                              ? 'Câu tự luận (Giáo viên chấm)'
                              : isMatch
                              ? '✓ Trả lời Đúng'
                              : '✗ Trả lời Sai / Chưa trọn vẹn'}
                          </span>
                        </div>
                        <p className="text-[#17365D] font-medium">{q.content}</p>
                        <div className="p-2 bg-white rounded border border-slate-200 font-mono">
                          <strong>Bài làm của HS:</strong> {studentAns}
                        </div>
                        <div className="text-emerald-800">
                          <strong>Đáp án chuẩn / Hướng dẫn chấm:</strong> {correctAns}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Grading & Score Adjustment Form */}
            <form
              onSubmit={handleSaveGrade}
              className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-200 space-y-4"
            >
              <h4 className="text-sm font-bold text-[#0D47A1]">
                Nhập điểm Tự luận &amp; Rà soát Tổng điểm
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Điểm Trắc nghiệm (Tự động)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="100"
                    value={gradeForm.objectiveScore}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, objectiveScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Điểm Tự luận (Giáo viên chấm) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="100"
                    value={gradeForm.essayScore}
                    onChange={(e) =>
                      setGradeForm({ ...gradeForm, essayScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-[#FF8A00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Tổng điểm cuối cùng</label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-bold text-[#0D47A1] tabular-nums">
                    {Math.round(
                      ((Number(gradeForm.objectiveScore) || 0) +
                        (Number(gradeForm.essayScore) || 0)) *
                        100
                    ) / 100}{' '}
                    điểm
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Nhận xét của Giáo viên Nguyễn Tiến Dương
                  </label>
                  <input
                    type="text"
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    placeholder="Nhận xét ưu điểm và nội dung cần lưu ý..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Lý do chấm / điều chỉnh điểm (Lưu nhật ký) *
                  </label>
                  <input
                    type="text"
                    required
                    value={gradeForm.reason}
                    onChange={(e) => setGradeForm({ ...gradeForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Grade Change History */}
              {inspectingSub.gradeHistory && inspectingSub.gradeHistory.length > 0 && (
                <div className="text-xs space-y-1 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <History className="w-3.5 h-3.5" />
                    <span>Lịch sử thay đổi điểm số:</span>
                  </div>
                  {inspectingSub.gradeHistory.map((h, i) => (
                    <p key={i} className="text-slate-600 tabular-nums">
                      • {h.timestamp.slice(0, 16).replace('T', ' ')} — {h.actorName}:{' '}
                      {h.previousScore} → <strong>{h.newScore} điểm</strong> ({h.reason})
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingSub(null)}
                  className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Xác nhận Lưu điểm &amp; Công bố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
