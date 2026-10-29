import React from 'react';
import {
  Users,
  School,
  Database,
  FileText,
  Send,
  CheckCircle2,
  Percent,
  Award,
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  Activity,
  BookOpen,
  Sparkles,
  PlayCircle,
  ArrowRight,
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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  Assignment,
  AuditLogItem,
  ClassRoom,
  Exam,
  LearningResource,
  MenuTabId,
  Question,
  Student,
  Submission,
} from '../types';
import { DashboardHeroIllustration } from './BrandIllustrations';
import { exportToCsv } from '../data/demoSeedData';

interface OverviewDashboardProps {
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  assignments: Assignment[];
  submissions: Submission[];
  resources: LearningResource[];
  auditLogs: AuditLogItem[];
  isDemoMode: boolean;
  isConnectedToFirestore: boolean;
  onNavigate: (tab: MenuTabId) => void;
  onSeedDemoToFirestore: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  classes,
  students,
  questions,
  exams,
  assignments,
  submissions,
  resources,
  auditLogs,
  isDemoMode,
  isConnectedToFirestore,
  onNavigate,
  onSeedDemoToFirestore,
}) => {
  // Real metrics calculation (never fabricated)
  const totalStudents = students.length;
  const totalClasses = classes.length;
  const totalQuestions = questions.length;
  const totalExams = exams.length;
  const totalAssignments = assignments.length;

  const submittedList = submissions.filter((s) =>
    ['Đã nộp', 'Chờ chấm', 'Đã chấm'].includes(s.status)
  );
  const totalSubmitted = submittedList.length;

  // Expected total submissions across open assignments
  const expectedSubmissionsCount = assignments.reduce((acc, a) => {
    const classStudentCount = students.filter((st) => st.classId === a.classId).length;
    return acc + classStudentCount;
  }, 0);

  const completionRate =
    expectedSubmissionsCount > 0
      ? Math.min(100, Math.round((totalSubmitted / expectedSubmissionsCount) * 100))
      : 0;

  const gradedList = submissions.filter((s) => s.status === 'Đã chấm');
  const avgScore =
    gradedList.length > 0
      ? Math.round(
          (gradedList.reduce((acc, s) => acc + (Number(s.totalScore) || 0), 0) / gradedList.length) *
            100
        ) / 100
      : null;

  // 1. Score distribution data
  const scoreDistributionData = [
    {
      range: 'Dưới 5.0 (Chưa đạt)',
      soBai: gradedList.filter((s) => s.totalScore < 5).length,
    },
    {
      range: '5.0 - 6.4 (Đạt)',
      soBai: gradedList.filter((s) => s.totalScore >= 5 && s.totalScore < 6.5).length,
    },
    {
      range: '6.5 - 7.9 (Khá)',
      soBai: gradedList.filter((s) => s.totalScore >= 6.5 && s.totalScore < 8.0).length,
    },
    {
      range: '8.0 - 10.0 (Tốt)',
      soBai: gradedList.filter((s) => s.totalScore >= 8.0).length,
    },
  ];

  // 2. Results by class
  const classPerformanceData = classes.map((cls) => {
    const clsGraded = gradedList.filter((s) => s.classId === cls.id);
    const clsAvg =
      clsGraded.length > 0
        ? Math.round(
            (clsGraded.reduce((acc, s) => acc + s.totalScore, 0) / clsGraded.length) * 100
          ) / 100
        : 0;
    const clsSubmitted = submittedList.filter((s) => s.classId === cls.id).length;
    return {
      className: cls.code,
      diemTB: clsAvg,
      soBaiNop: clsSubmitted,
    };
  });

  // 3. Comparison across exams
  const examComparisonData = exams.map((ex) => {
    const exGraded = gradedList.filter((s) => s.examId === ex.id);
    const exAvg =
      exGraded.length > 0
        ? Math.round(
            (exGraded.reduce((acc, s) => acc + s.totalScore, 0) / exGraded.length) * 100
          ) / 100
        : 0;
    return {
      examCode: ex.code,
      examTitle: ex.title,
      diemTB: exAvg,
      sootThamGia: submittedList.filter((s) => s.examId === ex.id).length,
    };
  });

  // 4. Progress over time (sorted by submittedAt)
  const progressOverTimeData = [...gradedList]
    .sort((a, b) => (a.submittedAt || a.createdAt).localeCompare(b.submittedAt || b.createdAt))
    .map((s, idx) => ({
      lan: `Bài #${idx + 1} (${s.studentName.split(' ').slice(-2).join(' ')})`,
      diemSo: s.totalScore,
      tracNghiem: s.objectiveScore,
    }));

  const handleQuickExportSummary = () => {
    exportToCsv(
      'Bao_Cao_Tong_Quan_Tin_Hoc_THPT_Thanh_Hoa.csv',
      ['Chỉ tiêu thống kê', 'Giá trị thực tế', 'Chế độ dữ liệu'],
      [
        ['Tổng số lớp học', totalClasses, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        ['Tổng số học sinh', totalStudents, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        ['Tổng số câu hỏi ngân hàng', totalQuestions, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        ['Tổng số đề kiểm tra', totalExams, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        ['Số đợt giao bài kiểm tra', totalAssignments, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        ['Số bài làm đã nộp', totalSubmitted, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        ['Tỷ lệ hoàn thành (%)', `${completionRate}%`, isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT'],
        [
          'Điểm trung bình các bài đã chấm',
          avgScore !== null ? avgScore : 'Chưa có bài đã chấm',
          isDemoMode ? 'DỮ LIỆU DEMO' : 'DỮ LIỆU THẬT',
        ],
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#0D47A1] via-[#1259C3] to-[#168BFA] rounded-xl p-6 text-white shadow-sm border border-[#00C8FF]/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#00C8FF] font-semibold">
              <span>TRƯỜNG THPT THANH HÒA</span>
              <span aria-hidden="true">·</span>
              <span>XÃ THIỆN HƯNG - TP. ĐỒNG NAI</span>
              <span aria-hidden="true">·</span>
              <span>BỘ MÔN TIN HỌC THPT</span>
              {isDemoMode && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#FF8A00] underline">ĐANG HIỂN THỊ DỮ LIỆU DEMO</span>
                </>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              Chào mừng Thầy Nguyễn Tiến Dương đến với Hệ thống Quản lý Dạy học và Kiểm tra Trực tuyến
            </h2>
            <p className="text-sm md:text-base text-blue-100 leading-relaxed">
              Quản lý đồng bộ lớp học Khối 10, 11, 12, ngân hàng câu hỏi theo chương trình GDPT 2018,
              ma trận đề kiểm tra, tổ chức thi trực tuyến chống lộ đáp án, chấm bài tự động và phân tích năng lực số của học sinh.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('exams')}
                className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo &amp; Giao đề kiểm tra</span>
              </button>
              <button
                onClick={() => onNavigate('student_portal')}
                className="px-4 py-2 bg-white text-[#0D47A1] hover:bg-blue-50 font-bold rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-[#168BFA]" />
                <span>Mở Giao diện Học sinh Làm bài</span>
              </button>
              {isConnectedToFirestore && totalClasses === 0 && !isDemoMode && (
                <button
                  onClick={onSeedDemoToFirestore}
                  className="px-4 py-2 bg-[#00C8FF]/20 hover:bg-[#00C8FF]/30 border border-[#00C8FF] text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Khởi tạo dữ liệu mẫu [DEMO] vào Firestore
                </button>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            <DashboardHeroIllustration className="w-full h-40" />
          </div>
        </div>
      </div>

      {/* 8 Real-time Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Tổng số học sinh</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{totalStudents}</p>
            <p className="text-xs text-slate-500 mt-1">
              {totalStudents === 0 ? 'Chưa có học sinh' : `Phân bổ tại ${totalClasses} lớp`}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#0D47A1]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Tổng số lớp học</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{totalClasses}</p>
            <p className="text-xs text-slate-500 mt-1">
              Khối 10: {classes.filter((c) => c.grade === '10').length} · Khối 11:{' '}
              {classes.filter((c) => c.grade === '11').length} · Khối 12:{' '}
              {classes.filter((c) => c.grade === '12').length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#168BFA]">
            <School className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Câu hỏi trong ngân hàng</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{totalQuestions}</p>
            <p className="text-xs text-slate-500 mt-1">
              Đã duyệt: {questions.filter((q) => q.isApproved).length} câu hỏi
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-50 text-[#0097A7]">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Tổng số đề kiểm tra</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{totalExams}</p>
            <p className="text-xs text-slate-500 mt-1">
              Đang mở: {exams.filter((e) => e.status === 'open').length} đề
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-50 text-[#FF8A00]">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Số bài kiểm tra đã giao</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{totalAssignments}</p>
            <p className="text-xs text-slate-500 mt-1">
              {totalAssignments === 0 ? 'Chưa giao bài' : 'Đang triển khai cho các lớp'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#0D47A1]">
            <Send className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Số bài học sinh đã nộp</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{totalSubmitted}</p>
            <p className="text-xs text-slate-500 mt-1">
              Chờ chấm tự luận: {submissions.filter((s) => s.status === 'Chờ chấm').length} bài
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Tỷ lệ hoàn thành</p>
            <p className="text-2xl font-bold text-[#0D47A1] mt-1 tabular-nums">{completionRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {expectedSubmissionsCount === 0
                ? 'Chưa có lượt giao bài'
                : `${totalSubmitted}/${expectedSubmissionsCount} lượt học sinh`}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#168BFA]">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-600 font-medium">Điểm trung bình</p>
            <p className="text-2xl font-bold text-[#FF8A00] mt-1 tabular-nums">
              {avgScore !== null ? avgScore.toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {gradedList.length === 0
                ? 'Chưa có dữ liệu chấm'
                : `Tính trên ${gradedList.length} bài đã chấm`}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-orange-50 text-[#FF8A00]">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0D47A1]">Thao tác nghiệp vụ nhanh</h3>
            <p className="text-xs text-slate-500">
              Truy cập trực tiếp các công cụ quản lý giảng dạy và kiểm tra môn Tin học
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('classes_students')}
              className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-100 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              + Thêm học sinh
            </button>
            <button
              onClick={() => onNavigate('question_bank')}
              className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-100 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              + Tạo câu hỏi
            </button>
            <button
              onClick={() => onNavigate('exams')}
              className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-100 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              + Tạo đề kiểm tra
            </button>
            <button
              onClick={() => onNavigate('exams')}
              className="px-3 py-2 bg-[#168BFA] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Giao bài kiểm tra
            </button>
            <button
              onClick={() => onNavigate('submissions')}
              className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-100 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Xem bảng điểm &amp; Chấm bài
            </button>
            <button
              onClick={handleQuickExportSummary}
              className="px-3 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất báo cáo CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Score Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0D47A1]">
                1. Biểu đồ phân bố kết quả theo mức điểm
              </h3>
              <p className="text-xs text-slate-500">
                Thống kê trên các bài kiểm tra đã hoàn tất chấm điểm ({gradedList.length} bài)
              </p>
            </div>
          </div>
          {gradedList.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300 text-center p-4">
              <p className="text-sm font-bold text-slate-600">Chưa có dữ liệu điểm đã chấm</p>
              <p className="text-xs text-slate-500 mt-1">
                Biểu đồ sẽ tự động hiển thị ngay khi học sinh nộp bài và hệ thống chấm điểm.
              </p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#17365D' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#17365D' }} />
                  <Tooltip />
                  <Bar dataKey="soBai" name="Số bài làm" fill="#0D47A1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: Results by Class */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0D47A1]">
                2. Biểu đồ kết quả học tập theo lớp
              </h3>
              <p className="text-xs text-slate-500">
                Điểm trung bình và số bài đã nộp của từng lớp học
              </p>
            </div>
          </div>
          {classPerformanceData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300 text-center p-4">
              <p className="text-sm font-bold text-slate-600">Chưa có dữ liệu lớp học</p>
              <p className="text-xs text-slate-500 mt-1">
                Hãy thêm lớp học tại phân hệ Lớp học và Học sinh để theo dõi thống kê.
              </p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="className" tick={{ fontSize: 12, fill: '#17365D' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#17365D' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="diemTB" name="Điểm TB" fill="#168BFA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="soBaiNop" name="Số bài nộp" fill="#FF8A00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Comparison across Exams */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0D47A1]">
                3. So sánh kết quả giữa các đề kiểm tra
              </h3>
              <p className="text-xs text-slate-500">
                Đối chiếu điểm trung bình và số lượt làm bài giữa các kỳ kiểm tra
              </p>
            </div>
          </div>
          {examComparisonData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300 text-center p-4">
              <p className="text-sm font-bold text-slate-600">Chưa có đề kiểm tra</p>
              <p className="text-xs text-slate-500 mt-1">
                Tạo đề kiểm tra từ ngân hàng câu hỏi để bắt đầu đối sánh kết quả.
              </p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={examComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="examCode" tick={{ fontSize: 12, fill: '#17365D' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#17365D' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="diemTB"
                    name="Điểm trung bình"
                    stroke="#0D47A1"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="sootThamGia"
                    name="Số lượt nộp"
                    stroke="#00C8FF"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 4: Progress Over Time */}
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0D47A1]">
                4. Tiến bộ học tập theo thời gian
              </h3>
              <p className="text-xs text-slate-500">
                Biến thiên điểm số qua các lượt nộp bài đã được chấm
              </p>
            </div>
          </div>
          {progressOverTimeData.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300 text-center p-4">
              <p className="text-sm font-bold text-slate-600">Chưa có lịch sử tiến bộ</p>
              <p className="text-xs text-slate-500 mt-1">
                Khi có các bài kiểm tra được chấm điểm theo thời gian, tiến trình sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="lan" tick={{ fontSize: 11, fill: '#17365D' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#17365D' }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="diemSo"
                    name="Tổng điểm"
                    stroke="#0D47A1"
                    fill="#168BFA"
                    fillOpacity={0.25}
                  />
                  <Area
                    type="monotone"
                    dataKey="tracNghiem"
                    name="Điểm trắc nghiệm"
                    stroke="#FF8A00"
                    fill="#FF8A00"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Exams & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Exam Schedule */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0D47A1]" />
              <h3 className="text-base font-bold text-[#0D47A1]">
                Lịch kiểm tra sắp tới &amp; Đang mở
              </h3>
            </div>
            <button
              onClick={() => onNavigate('exams')}
              className="text-xs font-bold text-[#168BFA] hover:underline cursor-pointer"
            >
              Quản lý lịch thi →
            </button>
          </div>
          {assignments.length === 0 ? (
            <div className="p-6 text-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300">
              <p className="text-sm font-semibold text-slate-600">
                Chưa có lịch kiểm tra nào được giao
              </p>
              <button
                onClick={() => onNavigate('exams')}
                className="mt-2 px-3 py-1.5 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Giao đề kiểm tra đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 5).map((asg) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-lg bg-[#F4F8FC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-bold text-[#0D47A1]">{asg.examTitle}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Lớp: <strong>{asg.className}</strong> · Khối {asg.grade} · Thời lượng:{' '}
                      <span className="tabular-nums font-semibold">{asg.durationMinutes} phút</span> · Hạn nộp:{' '}
                      <span className="tabular-nums">{asg.dueTime.replace('T', ' ')}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-emerald-700">
                      {asg.status === 'open' ? '● Đang mở' : 'Đã đóng'}
                    </span>
                    <button
                      onClick={() => onNavigate('student_portal')}
                      className="px-2.5 py-1 bg-[#168BFA] hover:bg-[#0D47A1] text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Vào phòng thi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#FF8A00]" />
              <h3 className="text-base font-bold text-[#0D47A1]">Hoạt động gần đây trên hệ thống</h3>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs font-bold text-[#168BFA] hover:underline cursor-pointer"
            >
              Xem nhật ký →
            </button>
          </div>
          <div className="space-y-3">
            {exams.slice(0, 2).map((ex) => (
              <div
                key={`act_ex_${ex.id}`}
                className="p-3 rounded-lg bg-[#F4F8FC] border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-[#168BFA] font-bold">ĐỀ KIỂM TRA MỚI TẠO</p>
                  <p className="text-sm font-bold text-[#17365D]">{ex.title}</p>
                  <p className="text-xs text-slate-500">
                    Khối {ex.grade} · {ex.questionCount} câu hỏi · Tổng {ex.totalPoints} điểm
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('exams')}
                  className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer shrink-0"
                >
                  Chi tiết
                </button>
              </div>
            ))}

            {submissions.slice(0, 2).map((sub) => (
              <div
                key={`act_sub_${sub.id}`}
                className="p-3 rounded-lg bg-[#F4F8FC] border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-emerald-700 font-bold">
                    {sub.status === 'Đã chấm' ? 'BÀI KIỂM TRA ĐÃ CHẤM' : 'HỌC SINH VỪA NỘP BÀI'}
                  </p>
                  <p className="text-sm font-bold text-[#17365D]">
                    {sub.studentName} ({sub.className}) — {sub.examTitle}
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Trạng thái: {sub.status} · Tổng điểm: <strong>{sub.totalScore}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('submissions')}
                  className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer shrink-0"
                >
                  Xem bài
                </button>
              </div>
            ))}

            {resources.slice(0, 1).map((res) => (
              <div
                key={`act_res_${res.id}`}
                className="p-3 rounded-lg bg-[#F4F8FC] border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-[#FF8A00] font-bold">HỌC LIỆU CẬP NHẬT</p>
                  <p className="text-sm font-bold text-[#17365D]">{res.title}</p>
                  <p className="text-xs text-slate-500">
                    Phân loại: {res.category} · Khối {res.grade}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('resources')}
                  className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer shrink-0"
                >
                  Mở thư viện
                </button>
              </div>
            ))}

            {exams.length === 0 && submissions.length === 0 && resources.length === 0 && (
              <div className="p-6 text-center bg-[#F4F8FC] rounded-lg border border-dashed border-slate-300">
                <p className="text-sm font-semibold text-slate-600">
                  Chưa có hoạt động phát sinh
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Các sự kiện tạo đề, nộp bài, chấm điểm và cập nhật học liệu sẽ được ghi nhận tại đây.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Functional Modules Grid & Quick Links to Resources/Support */}
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <h3 className="text-base font-bold text-[#0D47A1] mb-3">
          Các phân hệ chức năng chính &amp; Liên kết hỗ trợ giảng dạy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[#F4F8FC] border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#FF8A00]" />
                <span>Trợ lý AI Giáo viên Tin học</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Hỗ trợ thầy Nguyễn Tiến Dương biên soạn câu hỏi Python, SQL, AI theo chuẩn Kết nối tri thức, gợi ý đề cương và nhận xét kết quả học tập.
              </p>
            </div>
            <button
              onClick={() => onNavigate('ai_assistant')}
              className="mt-3 text-xs font-bold text-[#168BFA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Mở Trợ lý AI chuyên môn</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F8FC] border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-sm">
                <BookOpen className="w-4 h-4 text-[#168BFA]" />
                <span>Thư viện Tài liệu &amp; Học liệu số</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Quản lý bài giảng, tệp PDF, bài tập thực hành Python/SQL và hướng dẫn sử dụng hệ thống cho học sinh Khối 10, 11, 12.
              </p>
            </div>
            <button
              onClick={() => onNavigate('resources')}
              className="mt-3 text-xs font-bold text-[#168BFA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Truy cập Thư viện Học liệu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F8FC] border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#0D47A1] font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Kế hoạch Ôn tập &amp; Củng cố Kiến thức</span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Tổ chức ôn tập theo chủ đề với 2 chế độ Luyện tập (xem giải chi tiết ngay) và Kiểm tra, tự động phát hiện chủ đề học sinh hay sai.
              </p>
            </div>
            <button
              onClick={() => onNavigate('learning_plans')}
              className="mt-3 text-xs font-bold text-[#168BFA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Thiết lập Kế hoạch Ôn tập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
