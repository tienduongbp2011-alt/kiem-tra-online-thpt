import React, { useState } from 'react';
import {
  Users,
  School,
  Plus,
  Search,
  Upload,
  Download,
  Edit3,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ClassRoom, GradeLevel, Student, Submission } from '../types';
import { SAMPLE_STUDENT_CSV_TEMPLATE } from '../data/demoSeedData';
import {
  downloadStudentExcelTemplate,
  exportToExcel,
  parseStudentExcelFile,
} from '../utils/officeDocumentUtils';

interface ClassesAndStudentsViewProps {
  classes: ClassRoom[];
  students: Student[];
  submissions: Submission[];
  isTeacherOrAdmin: boolean;
  onSaveClass: (cls: Omit<ClassRoom, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>, editId?: string) => Promise<void>;
  onDeleteClass: (classId: string) => Promise<void>;
  onSaveStudent: (
    st: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
    editId?: string
  ) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onBatchImportStudents: (
    validStudents: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]
  ) => Promise<void>;
}

interface CsvValidationRow {
  rowNumber: number;
  studentCode: string;
  fullName: string;
  birthDate: string;
  classCode: string;
  grade: GradeLevel;
  loginCode: string;
  isValid: boolean;
  errorMsg?: string;
}

export const ClassesAndStudentsView: React.FC<ClassesAndStudentsViewProps> = ({
  classes,
  students,
  submissions,
  isTeacherOrAdmin,
  onSaveClass,
  onDeleteClass,
  onSaveStudent,
  onDeleteStudent,
  onBatchImportStudents,
}) => {
  const [subTab, setSubTab] = useState<'students' | 'classes'>('students');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Class modal state
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    grade: '10' as GradeLevel,
    academicYear: '2026 - 2027',
    homeroomTeacher: 'Nguyễn Tiến Dương',
    description: '',
    isDemo: false,
  });

  // Student modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    studentCode: '',
    fullName: '',
    birthDate: '',
    classId: '',
    accountStatus: 'active' as 'active' | 'suspended',
    loginCode: '',
    weakTopics: '',
    isDemo: false,
  });

  // CSV Import Modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvValidationResults, setCsvValidationResults] = useState<CsvValidationRow[]>([]);

  // Individual Student Academic Profile Modal
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  // Delete confirmation modal
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'class' | 'student';
    id: string;
    name: string;
  } | null>(null);

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filtered classes (null-safe)
  const filteredClasses = classes.filter((c) => {
    const matchGrade = gradeFilter === 'ALL' || String(c.grade || '10') === gradeFilter;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.code || '').toLowerCase().includes(q);
    return matchGrade && matchQuery;
  });

  // Filtered students (null-safe)
  const filteredStudents = students.filter((st) => {
    const matchGrade = gradeFilter === 'ALL' || String(st.grade || '10') === gradeFilter;
    const matchClass =
      classFilter === 'ALL' ||
      st.classId === classFilter ||
      st.className === classFilter;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      String(st.fullName || '').toLowerCase().includes(q) ||
      String(st.studentCode || '').toLowerCase().includes(q) ||
      String(st.className || '').toLowerCase().includes(q);
    return matchGrade && matchClass && matchQuery;
  });

  const handleQuickCreateStandardClasses = async () => {
    const standardClasses: Array<{ code: string; name: string; grade: GradeLevel; desc: string }> = [
      {
        code: '10A1',
        name: 'Lớp 10A1 - Tin học 10',
        grade: '10',
        desc: 'Chương trình GDPT 2018 - Kết nối tri thức (Python cơ bản & Thiết kế đồ họa)',
      },
      {
        code: '10A2',
        name: 'Lớp 10A2 - Tin học 10',
        grade: '10',
        desc: 'Chương trình GDPT 2018 - Tin học ứng dụng Khối 10',
      },
      {
        code: '11A1',
        name: 'Lớp 11A1 - Tin học 11',
        grade: '11',
        desc: 'Cơ sở dữ liệu quan hệ, SQL & Lập trình thuật toán nâng cao',
      },
      {
        code: '12A1',
        name: 'Lớp 12A1 - Tin học 12',
        grade: '12',
        desc: 'Trí tuệ nhân tạo (AI), Mạng máy tính, HTML/CSS & Ôn thi Tốt nghiệp THPT',
      },
    ];

    for (const item of standardClasses) {
      const exists = classes.some(
        (c) => String(c.code || '').toLowerCase() === item.code.toLowerCase()
      );
      if (!exists) {
        await onSaveClass({
          code: item.code,
          name: item.name,
          grade: item.grade,
          academicYear: '2026 - 2027',
          homeroomTeacher: 'Nguyễn Tiến Dương',
          studentCount: 0,
          description: item.desc,
          isDemo: false,
        });
      }
    }
    setStatusBanner({
      type: 'success',
      message: 'Đã khởi tạo danh sách 4 lớp chuẩn (10A1, 10A2, 11A1, 12A1) lên Supabase.',
    });
  };

  const openAddClass = () => {
    setEditingClass(null);
    setClassForm({
      code: '',
      name: '',
      grade: '10',
      academicYear: '2026 - 2027',
      homeroomTeacher: 'Nguyễn Tiến Dương',
      description: '',
      isDemo: false,
    });
    setShowClassModal(true);
  };

  const openEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClassForm({
      code: cls.code || '',
      name: cls.name || '',
      grade: cls.grade || '10',
      academicYear: cls.academicYear || '2026 - 2027',
      homeroomTeacher: cls.homeroomTeacher || 'Nguyễn Tiến Dương',
      description: cls.description || '',
      isDemo: Boolean(cls.isDemo),
    });
    setShowClassModal(true);
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.code.trim() || !classForm.name.trim()) {
      setStatusBanner({ type: 'error', message: 'Vui lòng nhập đầy đủ Mã lớp và Tên lớp.' });
      return;
    }
    const countInClass = editingClass
      ? students.filter((s) => s.classId === editingClass.id).length
      : 0;
    await onSaveClass(
      {
        code: classForm.code.trim(),
        name: classForm.name.trim(),
        grade: classForm.grade,
        academicYear: classForm.academicYear.trim() || '2026 - 2027',
        homeroomTeacher: classForm.homeroomTeacher.trim(),
        studentCount: countInClass,
        description: classForm.description.trim(),
        isDemo: classForm.isDemo,
      },
      editingClass?.id
    );
    setShowClassModal(false);
    setStatusBanner({
      type: 'success',
      message: editingClass ? 'Đã cập nhật thông tin lớp học.' : 'Đã thêm lớp học mới thành công.',
    });
  };

  const openAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      studentCode: `HS${Date.now().toString().slice(-4)}`,
      fullName: '',
      birthDate: '',
      classId: classes[0]?.id || '10A1',
      accountStatus: 'active',
      loginCode: `hs${Date.now().toString().slice(-4)}`,
      weakTopics: '',
      isDemo: false,
    });
    setShowStudentModal(true);
  };

  const openEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStudentForm({
      studentCode: st.studentCode || '',
      fullName: st.fullName || '',
      birthDate: st.birthDate || '',
      classId: st.classId || classes[0]?.id || '10A1',
      accountStatus: st.accountStatus || 'active',
      loginCode: st.loginCode || '',
      weakTopics: st.weakTopics || '',
      isDemo: Boolean(st.isDemo),
    });
    setShowStudentModal(true);
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.studentCode.trim() || !studentForm.fullName.trim()) {
      setStatusBanner({
        type: 'error',
        message: 'Vui lòng nhập đầy đủ Mã học sinh và Họ và tên.',
      });
      return;
    }
    const targetClass = classes.find(
      (c) => c.id === studentForm.classId || c.code === studentForm.classId
    );
    const fallbackCode = studentForm.classId || '10A1';
    const fallbackGrade: GradeLevel = fallbackCode.startsWith('12')
      ? '12'
      : fallbackCode.startsWith('11')
      ? '11'
      : '10';

    await onSaveStudent(
      {
        studentCode: studentForm.studentCode.trim(),
        fullName: studentForm.fullName.trim(),
        birthDate: studentForm.birthDate.trim(),
        classId: targetClass?.id || `class_${fallbackCode}`,
        className: targetClass?.name || `Lớp ${fallbackCode}`,
        grade: targetClass?.grade || fallbackGrade,
        accountStatus: studentForm.accountStatus,
        loginCode: studentForm.loginCode.trim() || studentForm.studentCode.trim().toLowerCase(),
        avgScore: Number(editingStudent?.avgScore || 0),
        completedExamsCount: Number(editingStudent?.completedExamsCount || 0),
        weakTopics: studentForm.weakTopics.trim(),
        isDemo: studentForm.isDemo,
      },
      editingStudent?.id
    );
    setShowStudentModal(false);
    setStatusBanner({
      type: 'success',
      message: editingStudent
        ? 'Đã cập nhật hồ sơ học sinh.'
        : 'Đã thêm học sinh mới vào danh sách lớp.',
    });
  };

  // CSV Validation Logic
  const validateCsvContent = (raw: string) => {
    setCsvRawText(raw);
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setCsvValidationResults([]);
      return;
    }
    const startIdx = lines[0].toLowerCase().includes('mahocsinh') ? 1 : 0;
    const results: CsvValidationRow[] = [];
    // Vì hệ thống sẽ xóa danh sách học sinh cũ mỗi lần nhập từ Excel,
    // chỉ kiểm tra trùng Mã HS ngay bên trong tệp Excel đang tải lên.
    const seenCodes = new Set<string>();

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const [studentCode = '', fullName = '', birthDate = '', classCode = '', gradeRaw = '', loginCode = ''] =
        cols;
      const errors: string[] = [];
      if (!studentCode) errors.push('Thiếu Mã HS');
      if (!fullName) errors.push('Thiếu Họ tên');
      if (studentCode && seenCodes.has(studentCode.toLowerCase())) {
        errors.push(`Trùng Mã HS trong tệp (${studentCode})`);
      }
      if (!['10', '11', '12'].includes(gradeRaw)) {
        errors.push(`Khối "${gradeRaw}" không hợp lệ (chỉ nhận 10, 11, 12)`);
      }
      if (!classCode) {
        errors.push('Thiếu Mã lớp');
      }

      if (studentCode) seenCodes.add(studentCode.toLowerCase());

      results.push({
        rowNumber: i + 1,
        studentCode,
        fullName,
        birthDate,
        classCode,
        grade: (['10', '11', '12'].includes(gradeRaw) ? gradeRaw : '10') as GradeLevel,
        loginCode: loginCode || studentCode.toLowerCase(),
        isValid: errors.length === 0,
        errorMsg: errors.join('; '),
      });
    }
    setCsvValidationResults(results);
  };

  const handleExcelOrCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvRawText('');
    setCsvValidationResults([]);
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const rows = await parseStudentExcelFile(file);
        const csvEquivalent = rows.map((r) => r.join(',')).join('\n');
        validateCsvContent(csvEquivalent);
      } catch {
        setStatusBanner({
          type: 'error',
          message: 'Không thể đọc tệp Excel (.xlsx). Vui lòng tải tệp mẫu Excel chuẩn của hệ thống.',
        });
      } finally {
        e.target.value = '';
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      validateCsvContent(text);
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmCsvImport = async () => {
    const validRows = csvValidationResults.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setStatusBanner({
        type: 'error',
        message: 'Không có dòng dữ liệu hợp lệ nào để nhập. Vui lòng kiểm tra lỗi trong bảng.',
      });
      return;
    }

    const toImport: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[] = validRows.map(
      (r) => {
        const matchedClass = classes.find(
          (c) =>
            String(c.code || '').toLowerCase() === r.classCode.toLowerCase() ||
            String(c.name || '').toLowerCase().includes(r.classCode.toLowerCase())
        );
        return {
          studentCode: r.studentCode,
          fullName: r.fullName,
          birthDate: r.birthDate,
          classId: matchedClass?.id || `class_${r.classCode}`,
          className: matchedClass?.name || `Lớp ${r.classCode}`,
          grade: matchedClass?.grade || r.grade,
          accountStatus: 'active',
          loginCode: r.loginCode,
          avgScore: 0,
          completedExamsCount: 0,
          weakTopics: '',
          isDemo: false,
        };
      }
    );

    await onBatchImportStudents(toImport);
    setShowCsvModal(false);
    setCsvRawText('');
    setCsvValidationResults([]);
    setStatusBanner({
      type: 'success',
      message: `Đã xóa danh sách học sinh cũ và nhập thành công ${validRows.length} học sinh mới từ tệp Excel vào hệ thống.`,
    });
  };

  const handleDownloadTemplate = () => {
    downloadStudentExcelTemplate();
  };

  const handleExportStudents = () => {
    exportToExcel(
      'Danh_Sach_Hoc_Sinh_Tin_Hoc_THPT_Thanh_Hoa.xlsx',
      'DanhSachHocSinh',
      [
        'Mã học sinh',
        'Họ và tên',
        'Ngày sinh',
        'Lớp',
        'Khối',
        'Mã đăng nhập',
        'Trạng thái',
        'Số bài đã làm',
        'Điểm trung bình',
        'Chủ đề cần củng cố',
      ],
      filteredStudents.map((s) => [
        s.studentCode,
        s.fullName,
        s.birthDate || '',
        s.className,
        s.grade,
        s.loginCode,
        s.accountStatus === 'active' ? 'Đang hoạt động' : 'Tạm khóa',
        s.completedExamsCount,
        s.avgScore,
        s.weakTopics || '',
      ])
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Tabs */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D47A1]">
            Phân hệ 2: Quản lý Lớp học và Hồ sơ Học sinh
          </h2>
          <p className="text-sm text-slate-600">
            Quản lý danh sách lớp Khối 10, 11, 12, nhập/xuất học sinh từ CSV/Excel và theo dõi hồ sơ học tập cá nhân
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#F4F8FC] p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setSubTab('students')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'students'
                ? 'bg-[#0D47A1] text-white'
                : 'text-[#17365D] hover:bg-blue-50'
            }`}
          >
            Danh sách Học sinh ({students.length})
          </button>
          <button
            onClick={() => setSubTab('classes')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'classes'
                ? 'bg-[#0D47A1] text-white'
                : 'text-[#17365D] hover:bg-blue-50'
            }`}
          >
            Quản lý Lớp học ({classes.length})
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-bold">
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-700" />
            )}
            <span>{statusBanner.message}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter & Action Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                subTab === 'students'
                  ? 'Tìm theo họ tên hoặc mã HS...'
                  : 'Tìm theo tên lớp hoặc mã lớp...'
              }
              className="pl-9 pr-4 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#168BFA]"
            />
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold text-[#17365D]"
          >
            <option value="ALL">Tất cả Khối (10, 11, 12)</option>
            <option value="10">Khối 10</option>
            <option value="11">Khối 11</option>
            <option value="12">Khối 12</option>
          </select>

          {subTab === 'students' && (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-[#F4F8FC] border border-slate-300 rounded-lg text-sm font-semibold text-[#17365D]"
            >
              <option value="ALL">Tất cả các lớp</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Khối {c.grade})
                </option>
              ))}
            </select>
          )}
        </div>

        {isTeacherOrAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            {subTab === 'students' ? (
              <>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải tệp mẫu Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => setShowCsvModal(true)}
                  className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nhập từ tệp Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportStudents}
                  className="px-3 py-2 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất danh sách Excel (.xlsx)</span>
                </button>
                <button
                  onClick={openAddStudent}
                  className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm học sinh</span>
                </button>
              </>
            ) : (
              <button
                onClick={openAddClass}
                className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm lớp học mới</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content View: Students Table OR Classes Grid */}
      {subTab === 'students' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-base font-bold text-[#17365D]">
                {students.length === 0
                  ? 'Hiện chưa có học sinh nào trong cơ sở dữ liệu Supabase'
                  : 'Chưa có học sinh nào phù hợp với bộ lọc'}
              </p>
              <p className="text-xs text-slate-500 max-w-xl mx-auto">
                Giáo viên có thể nhấn <strong>&quot;+ Thêm học sinh&quot;</strong>,{' '}
                <strong>&quot;Nhập từ tệp Excel (.xlsx)&quot;</strong> hoặc khởi tạo nhanh các lớp học chuẩn bên dưới.
              </p>
              {isTeacherOrAdmin && (
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={openAddStudent}
                    className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Thêm học sinh mới
                  </button>
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="px-4 py-2 bg-[#168BFA] hover:bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Nhập danh sách từ Excel (.xlsx)
                  </button>
                  {classes.length === 0 && (
                    <button
                      onClick={handleQuickCreateStandardClasses}
                      className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Khởi tạo nhanh 4 lớp chuẩn (10A1, 10A2, 11A1, 12A1)
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0D47A1] text-white text-xs">
                    <th className="py-3 px-4 font-bold">Mã HS</th>
                    <th className="py-3 px-4 font-bold">Họ và tên</th>
                    <th className="py-3 px-4 font-bold">Ngày sinh</th>
                    <th className="py-3 px-4 font-bold">Lớp · Khối</th>
                    <th className="py-3 px-4 font-bold">Mã đăng nhập</th>
                    <th className="py-3 px-4 font-bold text-right">Số bài thi</th>
                    <th className="py-3 px-4 font-bold text-right">Điểm TB</th>
                    <th className="py-3 px-4 font-bold">Trạng thái</th>
                    <th className="py-3 px-4 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredStudents.map((st) => {
                    const stSubs = submissions.filter(
                      (s) => s.studentId === st.id || s.studentCode === st.studentCode
                    );
                    const gradedSubs = stSubs.filter((s) => s.status === 'Đã chấm');
                    const realAvg =
                      gradedSubs.length > 0
                        ? Math.round(
                            (gradedSubs.reduce((acc, s) => acc + Number(s.totalScore || 0), 0) /
                              gradedSubs.length) *
                              100
                          ) / 100
                        : Number(st.avgScore || 0);

                    return (
                      <tr key={st.id} className="hover:bg-[#F4F8FC] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#0D47A1] tabular-nums">
                          {st.studentCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#17365D]">
                          {st.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 tabular-nums">
                          {st.birthDate || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {st.className} · Khối {st.grade}
                        </td>
                        <td className="py-3 px-4 text-slate-600 tabular-nums">{st.loginCode}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-semibold">
                          {stSubs.length || Number(st.completedExamsCount || 0)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-[#0D47A1]">
                          {Number(realAvg || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-bold ${
                              st.accountStatus === 'active'
                                ? 'text-emerald-700'
                                : 'text-red-700'
                            }`}
                          >
                            {st.accountStatus === 'active' ? '● Hoạt động' : '▲ Tạm ngưng'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setProfileStudent(st)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Xem hồ sơ học tập cá nhân"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Hồ sơ</span>
                            </button>
                            {isTeacherOrAdmin && (
                              <>
                                <button
                                  onClick={() => openEditStudent(st)}
                                  className="p-1.5 text-slate-600 hover:text-[#0D47A1] cursor-pointer"
                                  title="Chỉnh sửa"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmDelete({
                                      type: 'student',
                                      id: st.id,
                                      name: st.fullName,
                                    })
                                  }
                                  className="p-1.5 text-slate-600 hover:text-red-600 cursor-pointer"
                                  title="Xóa học sinh"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-10 text-center border border-slate-200 space-y-3">
              <School className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-base font-bold text-[#17365D]">Chưa có lớp học nào trên Supabase</p>
              <p className="text-xs text-slate-500 mt-1">
                Nhấn &quot;Thêm lớp học mới&quot; hoặc khởi tạo nhanh bộ lớp học Khối 10, 11, 12 của trường.
              </p>
              {isTeacherOrAdmin && (
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={openAddClass}
                    className="px-4 py-2 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Thêm lớp học mới
                  </button>
                  <button
                    onClick={handleQuickCreateStandardClasses}
                    className="px-4 py-2 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Khởi tạo nhanh 4 lớp chuẩn (10A1, 10A2, 11A1, 12A1)
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const actualStudents = students.filter(
                (s) => s.classId === cls.id || s.className === cls.name
              );
              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Mã lớp: {cls.code}</span>
                      <span>·</span>
                      <span>Khối {cls.grade}</span>
                      <span>·</span>
                      <span>Năm học: {cls.academicYear}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0D47A1]">{cls.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      GV phụ trách: <strong>{cls.homeroomTeacher || 'Nguyễn Tiến Dương'}</strong>
                    </p>
                    {cls.description && (
                      <p className="text-xs text-slate-500 mt-2">{cls.description}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-[#17365D] tabular-nums">
                      Sĩ số: {actualStudents.length || Number(cls.studentCount || 0)} học sinh
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setClassFilter(cls.id);
                          setSubTab('students');
                        }}
                        className="px-2.5 py-1 bg-[#F4F8FC] hover:bg-blue-50 text-[#0D47A1] border border-blue-200 rounded text-xs font-bold cursor-pointer"
                      >
                        Xem DS lớp
                      </button>
                      {isTeacherOrAdmin && (
                        <>
                          <button
                            onClick={() => openEditClass(cls)}
                            className="p-1 text-slate-600 hover:text-[#0D47A1] cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDelete({ type: 'class', id: cls.id, name: cls.name })
                            }
                            className="p-1 text-slate-600 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Add/Edit Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                {editingClass ? 'Chỉnh sửa thông tin Lớp học' : 'Thêm Lớp học mới'}
              </h3>
              <button onClick={() => setShowClassModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Mã lớp *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                    placeholder="VD: 10A1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Khối lớp *
                  </label>
                  <select
                    value={classForm.grade}
                    onChange={(e) =>
                      setClassForm({ ...classForm, grade: e.target.value as GradeLevel })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17365D] mb-1">
                  Tên hiển thị của lớp *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="VD: Lớp 10A1 - Tin học THPT Thanh Hòa"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">Năm học</label>
                  <input
                    type="text"
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Giáo viên phụ trách
                  </label>
                  <input
                    type="text"
                    value={classForm.homeroomTeacher}
                    onChange={(e) =>
                      setClassForm({ ...classForm, homeroomTeacher: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17365D] mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Lưu lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Student */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                {editingStudent ? 'Cập nhật thông tin Học sinh' : 'Thêm Học sinh mới'}
              </h3>
              <button onClick={() => setShowStudentModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Mã học sinh *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={studentForm.studentCode}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, studentCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Ngày sinh (dd/MM/yyyy)
                  </label>
                  <input
                    type="text"
                    placeholder="15/05/2011"
                    value={studentForm.birthDate}
                    onChange={(e) => setStudentForm({ ...studentForm, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17365D] mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  placeholder="Nguyễn Văn An"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Lớp học *
                  </label>
                  <select
                    required
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {classes.length > 0 ? (
                      classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Khối {c.grade})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="10A1">Lớp 10A1 (Khối 10)</option>
                        <option value="10A2">Lớp 10A2 (Khối 10)</option>
                        <option value="11A1">Lớp 11A1 (Khối 11)</option>
                        <option value="12A1">Lớp 12A1 (Khối 12)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Mã đăng nhập
                  </label>
                  <input
                    type="text"
                    value={studentForm.loginCode}
                    onChange={(e) => setStudentForm({ ...studentForm, loginCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={studentForm.accountStatus}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        accountStatus: e.target.value as 'active' | 'suspended',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="suspended">Ngừng kích hoạt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17365D] mb-1">
                    Nội dung cần củng cố
                  </label>
                  <input
                    type="text"
                    value={studentForm.weakTopics}
                    onChange={(e) => setStudentForm({ ...studentForm, weakTopics: e.target.value })}
                    placeholder="VD: Vòng lặp Python, SQL JOIN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Lưu thông tin học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excel Import with Validation */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-[#0D47A1]">
                Nhập danh sách Học sinh từ tệp mẫu Excel (.xlsx)
              </h3>
              <button onClick={() => setShowCsvModal(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Hỗ trợ đọc trực tiếp tệp <strong>Excel (.xlsx, .xls)</strong> theo mẫu chuẩn gồm các cột: <strong>MaHocSinh, HoVaTen, NgaySinh, MaLop, Khoi, MaDangNhap</strong>. Mỗi lần xác nhận nhập từ tệp Excel, hệ thống sẽ <strong>tự động xóa toàn bộ danh sách học sinh cũ</strong> và cập nhật mới theo danh sách trong tệp Excel.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelOrCsvFileUpload}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#0D47A1] file:text-white file:font-bold cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải tệp mẫu Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => validateCsvContent(SAMPLE_STUDENT_CSV_TEMPLATE)}
                  className="px-3 py-1.5 bg-[#F4F8FC] border border-blue-200 text-[#0D47A1] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Điền dữ liệu mẫu hợp lệ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    validateCsvContent(
                      `MaHocSinh,HoVaTen,NgaySinh,MaLop,Khoi,MaDangNhap\nHS10A1-99,Nguyễn Minh Tâm,12/04/2011,10A1,10,hs1099\n,Học Sinh Thiếu Mã,01/01/2011,10A1,15,hs_loi`
                    )
                  }
                  className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-[#FF8A00] rounded-lg text-xs font-bold cursor-pointer"
                >
                  Kiểm thử tệp có dòng lỗi
                </button>
              </div>
              <textarea
                rows={4}
                value={csvRawText}
                onChange={(e) => validateCsvContent(e.target.value)}
                placeholder="Dán nội dung CSV vào đây hoặc chọn tệp..."
                className="w-full p-3 border border-slate-300 rounded-lg text-xs font-mono"
              />

              {csvValidationResults.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-[#F4F8FC] px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-bold">
                    <span>
                      Kết quả kiểm tra dữ liệu đầu vào: Hợp lệ{' '}
                      <strong className="text-emerald-700">
                        {csvValidationResults.filter((r) => r.isValid).length}
                      </strong>{' '}
                      / {csvValidationResults.length} dòng
                    </span>
                    {csvValidationResults.some((r) => !r.isValid) && (
                      <span className="text-red-600">
                        Phát hiện {csvValidationResults.filter((r) => !r.isValid).length} dòng lỗi
                      </span>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-2">Dòng</th>
                          <th className="p-2">Mã HS</th>
                          <th className="p-2">Họ tên</th>
                          <th className="p-2">Lớp / Khối</th>
                          <th className="p-2">Trạng thái kiểm tra</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {csvValidationResults.map((r) => (
                          <tr
                            key={r.rowNumber}
                            className={r.isValid ? 'bg-white' : 'bg-red-50/70'}
                          >
                            <td className="p-2 tabular-nums">#{r.rowNumber}</td>
                            <td className="p-2 font-bold">{r.studentCode || '—'}</td>
                            <td className="p-2">{r.fullName || '—'}</td>
                            <td className="p-2">
                              {r.classCode} (Khối {r.grade})
                            </td>
                            <td className="p-2 font-bold">
                              {r.isValid ? (
                                <span className="text-emerald-700">● Hợp lệ</span>
                              ) : (
                                <span className="text-red-600">▲ Lỗi: {r.errorMsg}</span>
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
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCsvImport}
                className="px-4 py-2 bg-[#0D47A1] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Nhập các dòng hợp lệ ({csvValidationResults.filter((r) => r.isValid).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Individual Student Academic Profile */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#0D47A1]">
                  Hồ sơ Học tập Cá nhân: {profileStudent.fullName}
                </h3>
                <p className="text-xs text-slate-600">
                  Mã học sinh: <strong>{profileStudent.studentCode}</strong> · Lớp:{' '}
                  <strong>{profileStudent.className}</strong> (Khối {profileStudent.grade})
                </p>
              </div>
              <button onClick={() => setProfileStudent(null)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {(() => {
              const stSubs = submissions.filter(
                (s) =>
                  s.studentId === profileStudent.id ||
                  s.studentCode === profileStudent.studentCode
              );
              const graded = stSubs.filter((s) => s.status === 'Đã chấm');
              const avg =
                graded.length > 0
                  ? Math.round(
                      (graded.reduce((acc, s) => acc + (Number(s.totalScore) || 0), 0) /
                        graded.length) *
                        100
                    ) / 100
                  : Number(profileStudent.avgScore || 0);

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-lg bg-[#F4F8FC] border border-slate-200">
                      <p className="text-xs text-slate-500">Số bài kiểm tra đã tham gia</p>
                      <p className="text-xl font-bold text-[#0D47A1] tabular-nums mt-1">
                        {stSubs.length || profileStudent.completedExamsCount || 0} bài
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F4F8FC] border border-slate-200">
                      <p className="text-xs text-slate-500">Điểm trung bình tích lũy</p>
                      <p className="text-xl font-bold text-[#FF8A00] tabular-nums mt-1">
                        {Number(avg || 0).toFixed(2)} / 10
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F4F8FC] border border-slate-200">
                      <p className="text-xs text-slate-500">Nội dung thường trả lời sai</p>
                      <p className="text-xs font-bold text-red-700 mt-1">
                        {profileStudent.weakTopics || 'Chưa ghi nhận nội dung yếu'}
                      </p>
                    </div>
                  </div>

                  {graded.length > 0 && (
                    <div className="p-4 rounded-lg border border-slate-200">
                      <h4 className="text-sm font-bold text-[#0D47A1] mb-2">
                        Biểu đồ tiến bộ qua các lần kiểm tra
                      </h4>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={graded.map((g, i) => ({
                              lan: `Lần ${i + 1}`,
                              diem: Number(g.totalScore || 0),
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="lan" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="diem"
                              name="Điểm số"
                              stroke="#0D47A1"
                              strokeWidth={2.5}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-bold text-[#0D47A1] mb-2">
                      Lịch sử các bài kiểm tra đã tham gia
                    </h4>
                    {stSubs.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 bg-[#F4F8FC] rounded-lg">
                        Học sinh chưa có bài nộp nào được ghi nhận.
                      </p>
                    ) : (
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-[#0D47A1] text-white">
                          <tr>
                            <th className="p-2.5">Đề kiểm tra</th>
                            <th className="p-2.5">Thời gian nộp</th>
                            <th className="p-2.5">Trạng thái</th>
                            <th className="p-2.5 text-right">Điểm TN</th>
                            <th className="p-2.5 text-right">Điểm TL</th>
                            <th className="p-2.5 text-right">Tổng điểm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {stSubs.map((s) => (
                            <tr key={s.id}>
                              <td className="p-2.5 font-bold">{s.examTitle}</td>
                              <td className="p-2.5 tabular-nums">
                                {String(s.submittedAt || s.startedAt || '')
                                  .slice(0, 16)
                                  .replace('T', ' ')}
                              </td>
                              <td className="p-2.5 font-bold">{s.status}</td>
                              <td className="p-2.5 text-right tabular-nums">{s.objectiveScore}</td>
                              <td className="p-2.5 text-right tabular-nums">{s.essayScore}</td>
                              <td className="p-2.5 text-right tabular-nums font-bold text-[#0D47A1]">
                                {s.totalScore}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-red-700">Xác nhận xóa dữ liệu</h3>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xóa{' '}
              <strong>
                {confirmDelete.type === 'class' ? 'lớp học' : 'học sinh'} &quot;{confirmDelete.name}&quot;
              </strong>{' '}
              không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (confirmDelete.type === 'class') {
                    await onDeleteClass(confirmDelete.id);
                  } else {
                    await onDeleteStudent(confirmDelete.id);
                  }
                  setConfirmDelete(null);
                  setStatusBanner({ type: 'success', message: 'Đã xóa dữ liệu thành công.' });
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
