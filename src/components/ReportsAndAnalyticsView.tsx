import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Search,
  AlertCircle,
  CheckCircle2,
  Users,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Assignment,
  ClassRoom,
  Exam,
  ExamAnswerKey,
  LearningPlan,
  Question,
  Student,
  Submission,
} from '../types';
import { exportToCsv } from '../data/demoSeedData';

interface ReportsAndAnalyticsViewProps {
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  answerKeys: ExamAnswerKey[];
  assignments: Assignment[];
  submissions: Submission[];
  learningPlans: LearningPlan[];
}

export const ReportsAndAnalyticsView: React.FC<ReportsAndAnalyticsViewProps> = ({
  classes,
  students,
  questions,
  exams,
  answerKeys,
  submissions,
  learningPlans,
}) => {
  const [reportTab, setReportTab] = useState<'by_class' | 'by_student' | 'by_question'>('by_class');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('ALL');

  // Only graded submissions are counted in official score averages
  const gradedSubmissions = submissions.filter((s) => s.status === 'Đã chấm');

  // 1. Class Report Metrics
  const classReportRows = classes.map((cls) => {
    const classStudents = students.filter((s) => s.classId === cls.id);
    const siSo = classStudents.length || cls.studentCount;
    const classSubs = submissions.filter((s) => s.classId === cls.id);
    const participantIds = new Set(classSubs.map((s) => s.studentId));
    const participatedCount = participantIds.size;
    const notParticipatedCount = Math.max(0, siSo - participatedCount);

    const classGraded = gradedSubmissions.filter((s) => s.classId === cls.id);
    const scores = classGraded.map((s) => s.totalScore);
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const completionRate = siSo > 0 ? Math.min(100, Math.round((participatedCount / siSo) * 100)) : 0;

    return {
      classId: cls.id,
      classCode: cls.code,
      className: cls.name,
      grade: cls.grade,
      siSo,
      participatedCount,
      notParticipatedCount,
      avgScore,
      maxScore,
      minScore,
      completionRate,
      under5: scores.filter((sc) => sc < 5).length,
      from5to65: scores.filter((sc) => sc >= 5 && sc < 6.5).length,
      from65to8: scores.filter((sc) => sc >= 6.5 && sc < 8).length,
      above8: scores.filter((sc) => sc >= 8).length,
    };
  });

  // 2. Student Report Metrics
  const studentReportRows = students
    .filter((st) => {
      const matchClass = selectedClassId === 'ALL' || st.classId === selectedClassId;
      const matchQuery =
        st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchQuery;
    })
    .map((st) => {
      const stGraded = gradedSubmissions.filter(
        (s) => s.studentId === st.id || s.studentCode === st.studentCode
      );
      const individualScoresText =
        stGraded.length > 0
          ? stGraded.map((g) => `${g.examTitle.slice(0, 22)}...: ${g.totalScore}đ`).join(' | ')
          : 'Chưa có bài đã chấm';
      const computedAvg =
        stGraded.length > 0
          ? Math.round(
              (stGraded.reduce((acc, g) => acc + g.totalScore, 0) / stGraded.length) * 100
            ) / 100
          : st.avgScore;

      return {
        student: st,
        gradedCount: stGraded.length,
        individualScoresText,
        computedAvg,
      };
    });

  // 3. Question Item Analysis
  const questionAnalysisRows = questions.map((q) => {
    let totalAttempts = 0;
    let correctCount = 0;

    for (const sub of gradedSubmissions) {
      if (sub.answersMap && q.id in sub.answersMap) {
        totalAttempts += 1;
        const studentAns = (sub.answersMap[q.id] || '').trim().toLowerCase();
        const keyDoc = answerKeys.find((k) => k.examId === sub.examId);
        const expectedAns = (keyDoc?.answersMap?.[q.id] || q.correctAnswer || '')
          .trim()
          .toLowerCase();
        if (expectedAns && studentAns === expectedAns) {
          correctCount += 1;
        }
      }
    }

    const correctRate =
      totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    const wrongRate = totalAttempts > 0 ? 100 - correctRate : 0;

    return {
      question: q,
      totalAttempts,
      correctCount,
      correctRate,
      wrongRate,
    };
  });

  // 6 Excel (.xlsx) Export Handlers
  const exportStudentList = () => {
    exportToExcel(
      '1_Bao_Cao_Danh_Sach_Hoc_Sinh.xlsx',
      'DanhSachHocSinh',
      ['Mã HS', 'Họ và tên', 'Ngày sinh', 'Lớp', 'Khối', 'Trạng thái'],
      students.map((s) => [
        s.studentCode,
        s.fullName,
        s.birthDate || '',
        s.className,
        s.grade,
        s.accountStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa',
      ])
    );
  };

  const exportGradebook = () => {
    exportToExcel(
      '2_Bang_Diem_Tong_Hop.xlsx',
      'BangDiemTongHop',
      [
        'Mã HS',
        'Họ và tên',
        'Lớp',
        'Số bài đã chấm',
        'Điểm từng bài kiểm tra',
        'Điểm TB tích lũy',
        'Nội dung cần ôn tập thêm',
      ],
      studentReportRows.map((r) => [
        r.student.studentCode,
        r.student.fullName,
        r.student.className,
        r.gradedCount,
        r.individualScoresText,
        r.computedAvg,
        r.student.weakTopics || '',
      ])
    );
  };

  const exportClassReport = () => {
    exportToExcel(
      '3_Bao_Cao_Ket_Qua_Theo_Lop.xlsx',
      'KetQuaTheoLop',
      [
        'Mã lớp',
        'Tên lớp',
        'Khối',
        'Sĩ số',
        'Số HS dự thi',
        'Chưa làm bài',
        'Điểm TB',
        'Cao nhất',
        'Thấp nhất',
        'Tỷ lệ hoàn thành (%)',
      ],
      classReportRows.map((c) => [
        c.classCode,
        c.className,
        c.grade,
        c.siSo,
        c.participatedCount,
        c.notParticipatedCount,
        c.avgScore,
        c.maxScore,
        c.minScore,
        c.completionRate,
      ])
    );
  };

  const exportExamResults = () => {
    exportToExcel(
      '4_Ket_Qua_Tung_De_Kiem_Tra.xlsx',
      'KetQuaTheoDe',
      ['Mã đề', 'Tên đề kiểm tra', 'Khối', 'Số lượt nộp', 'Điểm TB đề thi'],
      exams.map((ex) => {
        const subs = gradedSubmissions.filter((s) => s.examId === ex.id);
        const avg =
          subs.length > 0
            ? Math.round((subs.reduce((a, b) => a + b.totalScore, 0) / subs.length) * 100) / 100
            : 0;
        return [ex.code, ex.title, ex.grade, subs.length, avg];
      })
    );
  };

  const exportScoreDistribution = () => {
    exportToExcel(
      '5_Thong_Ke_Phan_Bo_Diem.xlsx',
      'PhanBoDiem',
      ['Lớp', 'Dưới 5.0', 'Từ 5.0 đến 6.4', 'Từ 6.5 đến 7.9', 'Từ 8.0 đến 10.0'],
      classReportRows.map((c) => [
        c.className,
        c.under5,
        c.from5to65,
        c.from65to8,
        c.above8,
      ])
    );
  };

  const exportReviewReport = () => {
    exportToExcel(
      '6_Bao_Cao_Ke_Hoach_On_Tap.xlsx',
      'KeHoachOnTap',
      ['Tên kế hoạch ôn tập', 'Khối', 'Chủ đề', 'Chế độ', 'Hoàn thành', 'Tổng HS', 'Trạng thái'],
      learningPlans.map((p) => [
        p.title,
        p.grade,
        p.topic,
        p.mode,
        p.completedCount,
        p.totalStudents,
        p.status,
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 7: Báo cáo Kết quả &amp; Phân tích Chất lượng Dạy học
          </h2>
          <p className="text-sm text-slate-600">
            Thống kê theo lớp, bảng điểm cá nhân tách biệt điểm từng bài với điểm trung bình, và phân tích tỷ lệ đúng/sai từng câu hỏi
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F4F8FC] p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setReportTab('by_class')}
            className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap ${
              reportTab === 'by_class' ? 'bg-[#0D47A1] text-white' : 'text-[#17365D]'
            }`}
          >
            1. Báo cáo theo Lớp
          </button>
          <button
            onClick={() => setReportTab('by_student')}
            className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap ${
              reportTab === 'by_student' ? 'bg-[#0D47A1] text-white' : 'text-[#17365D]'
            }`}
          >
            2. Báo cáo theo Học sinh
          </button>
          <button
            onClick={() => setReportTab('by_question')}
            className={`px-3 py-1.5 rounded text-xs font-bold cursor-pointer whitespace-nowrap ${
              reportTab === 'by_question' ? 'bg-[#0D47A1] text-white' : 'text-[#17365D]'
            }`}
          >
            3. Phân tích Câu hỏi
          </button>
        </div>
      </div>

      {/* 6 Export Buttons Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
        <p className="text-xs font-bold text-[#0D47A1]">
          Trung tâm Xuất dữ liệu Báo cáo (Định dạng Microsoft Excel .xlsx chuẩn):
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportStudentList}
            className="px-3 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Xuất DS Học sinh (.xlsx)</span>
          </button>
          <button
            onClick={exportGradebook}
            className="px-3 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Xuất Bảng điểm (.xlsx)</span>
          </button>
          <button
            onClick={exportClassReport}
            className="px-3 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>3. Xuất Kết quả theo Lớp (.xlsx)</span>
          </button>
          <button
            onClick={exportExamResults}
            className="px-3 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>4. Xuất Kết quả từng Đề (.xlsx)</span>
          </button>
          <button
            onClick={exportScoreDistribution}
            className="px-3 py-1.5 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>5. Xuất Phân bố điểm (.xlsx)</span>
          </button>
          <button
            onClick={exportReviewReport}
            className="px-3 py-1.5 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>6. Xuất Báo cáo Ôn tập (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Class Report */}
      {reportTab === 'by_class' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-[#0D47A1]">
                Bảng tổng hợp chất lượng kiểm tra theo từng lớp học
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#0D47A1] text-white text-xs">
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Khối</th>
                    <th className="py-3 px-4 text-right">Sĩ số</th>
                    <th className="py-3 px-4 text-right">Đã tham gia</th>
                    <th className="py-3 px-4 text-right">Chưa làm bài</th>
                    <th className="py-3 px-4 text-right">Tỷ lệ HT</th>
                    <th className="py-3 px-4 text-right">Điểm TB</th>
                    <th className="py-3 px-4 text-right">Cao nhất</th>
                    <th className="py-3 px-4 text-right">Thấp nhất</th>
                    <th className="py-3 px-4 text-center">Phân bố (&lt;5 / 5-6.4 / 6.5-7.9 / 8-10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classReportRows.map((row) => (
                    <tr key={row.classId} className="hover:bg-[#F4F8FC]">
                      <td className="py-3 px-4 font-bold text-[#0D47A1]">{row.className}</td>
                      <td className="py-3 px-4">Khối {row.grade}</td>
                      <td className="py-3 px-4 text-right tabular-nums font-semibold">{row.siSo}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-emerald-700 font-bold">
                        {row.participatedCount}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-red-600 font-semibold">
                        {row.notParticipatedCount}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold">
                        {row.completionRate}%
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-[#FF8A00]">
                        {row.avgScore.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{row.maxScore}</td>
                      <td className="py-3 px-4 text-right tabular-nums">{row.minScore}</td>
                      <td className="py-3 px-4 text-center tabular-nums text-xs">
                        {row.under5} / {row.from5to65} / {row.from65to8} / {row.above8}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {classReportRows.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="text-base font-bold text-[#0D47A1] mb-4">
                Biểu đồ so sánh Điểm trung bình và Tỷ lệ hoàn thành theo Lớp
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classReportRows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="classCode" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgScore" name="Điểm trung bình (Thang 10)" fill="#0D47A1" />
                    <Bar dataKey="participatedCount" name="Số HS tham gia" fill="#00C8FF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Student Report */}
      {reportTab === 'by_student' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0D47A1]">
                Báo cáo kết quả chi tiết theo từng Học sinh
              </h3>
              <p className="text-xs text-slate-500">
                Phân biệt rõ điểm của từng bài kiểm tra và điểm trung bình tích lũy trên các bài đã được chấm
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm họ tên hoặc mã HS..."
                  className="pl-9 pr-3 py-1.5 bg-[#F4F8FC] border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 bg-[#F4F8FC] border border-slate-300 rounded-lg text-xs font-bold"
              >
                <option value="ALL">Tất cả lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0D47A1] text-white text-xs">
                  <th className="py-3 px-4">Mã HS</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Điểm từng bài kiểm tra đã chấm</th>
                  <th className="py-3 px-4 text-right">Điểm TB tổng hợp</th>
                  <th className="py-3 px-4">Nội dung cần ôn tập thêm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {studentReportRows.map((row) => (
                  <tr key={row.student.id} className="hover:bg-[#F4F8FC]">
                    <td className="py-3 px-4 font-bold text-[#0D47A1] tabular-nums">
                      {row.student.studentCode}
                    </td>
                    <td className="py-3 px-4 font-bold">{row.student.fullName}</td>
                    <td className="py-3 px-4 text-xs">{row.student.className}</td>
                    <td className="py-3 px-4 text-xs text-slate-700">{row.individualScoresText}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-[#FF8A00]">
                      {row.computedAvg.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs text-red-700 font-semibold">
                      {row.student.weakTopics || 'Đạt yêu cầu'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Question Analysis */}
      {reportTab === 'by_question' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-base font-bold text-[#0D47A1]">
              Thống kê độ khó và tỷ lệ trả lời Đúng / Sai của từng câu hỏi
            </h3>
            <p className="text-xs text-slate-500">
              Giúp giáo viên phát hiện những câu hỏi nhiều học sinh trả lời sai và các chủ đề có kết quả thấp để tổ chức ôn tập
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#0D47A1] text-white text-xs">
                  <th className="py-3 px-4">Mã câu hỏi</th>
                  <th className="py-3 px-4">Khối · Chủ đề</th>
                  <th className="py-3 px-4">Mức độ</th>
                  <th className="py-3 px-4">Nội dung câu hỏi</th>
                  <th className="py-3 px-4 text-right">Số lượt làm</th>
                  <th className="py-3 px-4 text-right">Tỷ lệ Đúng</th>
                  <th className="py-3 px-4 text-right">Tỷ lệ Sai</th>
                  <th className="py-3 px-4">Đánh giá cảnh báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {questionAnalysisRows.map((item) => (
                  <tr key={item.question.id} className="hover:bg-[#F4F8FC]">
                    <td className="py-3 px-4 font-bold text-[#0D47A1] tabular-nums">
                      {item.question.code}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <strong>Khối {item.question.grade}</strong> — {item.question.topic}
                    </td>
                    <td className="py-3 px-4 text-xs">{item.question.cognitiveLevel}</td>
                    <td className="py-3 px-4 text-xs max-w-md truncate">
                      {item.question.content}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">{item.totalAttempts}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-700">
                      {item.correctRate}%
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-red-600">
                      {item.wrongRate}%
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
                      {item.totalAttempts === 0 ? (
                        <span className="text-slate-400">Chưa có lượt thi</span>
                      ) : item.wrongRate >= 50 ? (
                        <span className="text-red-700">▲ Nhiều HS sai — Cần củng cố</span>
                      ) : (
                        <span className="text-emerald-700">● Nắm vững kiến thức</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
