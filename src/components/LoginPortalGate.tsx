import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  UserCheck,
  LogIn,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  PlayCircle,
  School,
} from 'lucide-react';
import { ClassRoom, Student } from '../types';
import { SchoolBookTechLogo, TeacherAvatarSvg } from './BrandIllustrations';

interface LoginPortalGateProps {
  classes: ClassRoom[];
  students: Student[];
  onStudentLoginSuccess: (student: Student) => void;
  onTeacherLoginSuccess: () => void;
}

export const LoginPortalGate: React.FC<LoginPortalGateProps> = ({
  classes,
  students,
  onStudentLoginSuccess,
  onTeacherLoginSuccess,
}) => {
  // Student Login Window State
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [studentSearchText, setStudentSearchText] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentLoginCode, setStudentLoginCode] = useState<string>('');
  const [showStudentPass, setShowStudentPass] = useState<boolean>(false);
  const [studentError, setStudentError] = useState<string>('');

  // Teacher Login Window State
  const [teacherUsername, setTeacherUsername] = useState<string>('tienduongbp2011@gmail.com');
  const [teacherPassword, setTeacherPassword] = useState<string>('');
  const [showTeacherPass, setShowTeacherPass] = useState<boolean>(false);
  const [teacherError, setTeacherError] = useState<string>('');

  // Extract distinct class options from both classes and students
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes) {
      const code = String(c.code || c.name || '').trim();
      if (code) map.set(code.toLowerCase(), c.name || `Lớp ${code}`);
    }
    for (const s of students) {
      const clsName = String(s.className || '').trim();
      if (clsName) {
        const key = clsName.toLowerCase().replace(/^lớp\s+/i, '').trim();
        if (!map.has(key)) {
          map.set(key, clsName.startsWith('Lớp') ? clsName : `Lớp ${clsName}`);
        }
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [classes, students]);

  // Filter students by selected class and search text
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (st.accountStatus === 'suspended') return false;

      if (selectedClassFilter !== 'ALL') {
        const stCls = String(st.className || '').toLowerCase();
        const stClsId = String(st.classId || '').toLowerCase();
        if (!stCls.includes(selectedClassFilter) && !stClsId.includes(selectedClassFilter)) {
          return false;
        }
      }

      if (studentSearchText.trim()) {
        const q = studentSearchText.trim().toLowerCase();
        const matchName = String(st.fullName || '').toLowerCase().includes(q);
        const matchCode = String(st.studentCode || '').toLowerCase().includes(q);
        const matchClass = String(st.className || '').toLowerCase().includes(q);
        return matchName || matchCode || matchClass;
      }

      return true;
    });
  }, [students, selectedClassFilter, studentSearchText]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    if (!selectedStudent) {
      setStudentError('Vui lòng chọn đúng họ và tên học sinh trong danh sách trước khi đăng nhập.');
      return;
    }

    const inputCode = studentLoginCode.trim().toLowerCase();
    if (!inputCode) {
      setStudentError('Vui lòng nhập Mã đăng nhập của học sinh.');
      return;
    }

    const expectedLoginCode = String(selectedStudent.loginCode || '').trim().toLowerCase();
    const expectedStudentCode = String(selectedStudent.studentCode || '').trim().toLowerCase();

    if (inputCode === expectedLoginCode || inputCode === expectedStudentCode) {
      onStudentLoginSuccess(selectedStudent);
    } else {
      setStudentError(
        `Mã đăng nhập không chính xác cho học sinh "${selectedStudent.fullName}". Vui lòng kiểm tra lại Mã đăng nhập hoặc Mã học sinh.`
      );
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');

    const userClean = teacherUsername.trim().toLowerCase();
    const passClean = teacherPassword.trim();

    if (!userClean) {
      setTeacherError('Vui lòng nhập Email hoặc Tên đăng nhập Giáo viên.');
      return;
    }

    if (!passClean) {
      setTeacherError('Vui lòng nhập Mật khẩu đăng nhập của Giáo viên.');
      return;
    }

    const savedCustomPass = localStorage.getItem('thpt_thanh_hoa_teacher_pass') || '';
    const validPasswords = ['123456', 'thanhhoa2026', 'admin123', savedCustomPass].filter(Boolean);
    const validUsers = [
      'tienduongbp2011@gmail.com',
      'giaovien',
      'admin',
      'nguyentienduong',
      'gv',
    ];

    if (
      validUsers.includes(userClean) &&
      validPasswords.some((p) => p.toLowerCase() === passClean.toLowerCase())
    ) {
      onTeacherLoginSuccess();
    } else {
      setTeacherError(
        'Thông tin đăng nhập Giáo viên chưa đúng. (Mật khẩu mặc định: 123456 hoặc thanhhoa2026)'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-[#17365D] flex flex-col justify-between">
      {/* Top School Banner */}
      <header className="bg-[#0D47A1] text-white border-b-4 border-[#FF8A00] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-white p-1.5 rounded-xl shadow-xs shrink-0">
              <SchoolBookTechLogo className="w-12 h-12" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#FF8A00] text-white text-xs font-bold uppercase tracking-wider">
                  Cổng Đăng Nhập Hệ Thống
                </span>
                <span className="text-xs text-blue-100 font-semibold">
                  Trường THPT Thanh Hòa · Xã Thiện Hưng - TP. Đồng Nai
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                TIN HỌC THPT THANH HÒA — DẠY HỌC & KIỂM TRA TRỰC TUYẾN
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                Giáo viên phụ trách: <strong className="text-[#00C8FF]">Nguyễn Tiến Dương</strong> ·
                Môn học: <strong>Tin học (Khối 10, 11, 12 - Chương trình GDPT 2018)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-[#082F6E] px-4 py-2.5 rounded-xl border border-blue-700 text-xs shrink-0">
            <School className="w-4 h-4 text-[#00C8FF]" />
            <div>
              <p className="font-bold text-white">Cơ sở dữ liệu trực tuyến</p>
              <p className="text-blue-200 text-[11px]">
                Đã tải {students.length} học sinh · {classes.length} lớp học
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: 2 Dedicated Login Windows */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-6 space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0D47A1] uppercase">
            Chọn Cổng Đăng Nhập Phù Hợp Với Vai Trò Của Bạn
          </h2>
          <p className="text-sm text-slate-600">
            Học sinh chọn đúng tên của mình trong danh sách và nhập mã đăng nhập ở{' '}
            <strong className="text-[#0D47A1]">Cửa sổ Học sinh (bên trái)</strong> để vào làm bài thi.
            Giáo viên đăng nhập ở <strong className="text-[#0D47A1]">Cửa sổ Giáo viên (bên phải)</strong>{' '}
            để vào Trang chính quản trị.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* ===============================================================
              WINDOW 1: STUDENT ONLINE EXAM LOGIN WINDOW (7 columns on lg)
          =============================================================== */}
          <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#168BFA] shadow-md overflow-hidden flex flex-col justify-between">
            <div>
              {/* Window Title Bar */}
              <div className="bg-gradient-to-r from-[#0D47A1] to-[#168BFA] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/15">
                    <GraduationCap className="w-6 h-6 text-[#00C8FF]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C8FF]">
                      Cửa sổ 1 · Dành cho Học sinh
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      ĐĂNG NHẬP KIỂM TRA TRỰC TUYẾN CHO HỌC SINH
                    </h3>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 text-xs font-bold">
                  <PlayCircle className="w-3.5 h-3.5 text-[#00C8FF]" />
                  <span>Vào phòng thi</span>
                </span>
              </div>

              {/* Student Login Form Body */}
              <form onSubmit={handleStudentSubmit} className="p-6 space-y-4">
                {studentError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{studentError}</span>
                  </div>
                )}

                {/* Filter by Class & Search Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F8FC] p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-[#0D47A1] mb-1">
                      Lọc theo Lớp học (Tùy chọn):
                    </label>
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => {
                        setSelectedClassFilter(e.target.value);
                        setSelectedStudentId('');
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#17365D]"
                    >
                      <option value="ALL">Tất cả các lớp ({students.length} học sinh)</option>
                      {classOptions.map((cls) => (
                        <option key={cls.key} value={cls.key}>
                          {cls.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D47A1] mb-1">
                      Tìm nhanh tên hoặc mã học sinh:
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentSearchText}
                        onChange={(e) => setStudentSearchText(e.target.value)}
                        placeholder="Nhập tên học sinh để lọc nhanh..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 1: Select exact student from the list */}
                <div>
                  <label className="block text-sm font-bold text-[#0D47A1] mb-1.5">
                    Bước 1: Chọn đúng Họ và tên Học sinh trong danh sách (*):
                  </label>
                  {students.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
                      Hiện chưa có danh sách học sinh trong hệ thống. Giáo viên vui lòng đăng nhập ở
                      Cửa sổ Giáo viên bên phải để nhập danh sách học sinh từ Excel trước.
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => {
                          setSelectedStudentId(e.target.value);
                          setStudentError('');
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-[#168BFA] rounded-xl text-sm font-bold text-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]"
                      >
                        <option value="">
                          -- Nhấn vào đây để chọn đúng tên học sinh ({filteredStudents.length} học
                          sinh) --
                        </option>
                        {filteredStudents.map((st, idx) => (
                          <option key={st.id} value={st.id}>
                            {idx + 1}. {st.fullName} — {st.className} (Mã HS: {st.studentCode})
                          </option>
                        ))}
                      </select>

                      {/* Visual Scrollable Student List for Quick Click Selection */}
                      <div className="mt-2.5 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 flex items-center justify-between border-b border-slate-200">
                          <span>Danh sách học sinh (Nhấp trực tiếp vào tên của bạn để chọn)</span>
                          <span>Hiển thị: {filteredStudents.length} HS</span>
                        </div>
                        <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                          {filteredStudents.length === 0 ? (
                            <p className="p-3 text-xs text-slate-500 text-center">
                              Không tìm thấy học sinh phù hợp với từ khóa tìm kiếm.
                            </p>
                          ) : (
                            filteredStudents.map((st, index) => {
                              const isSelected = st.id === selectedStudentId;
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedStudentId(st.id);
                                    setStudentError('');
                                  }}
                                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0D47A1] text-white font-bold'
                                      : 'hover:bg-blue-50 text-[#17365D]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span
                                      className={`w-5 text-right tabular-nums ${
                                        isSelected ? 'text-[#00C8FF]' : 'text-slate-400'
                                      }`}
                                    >
                                      {index + 1}.
                                    </span>
                                    <span className="font-bold truncate">{st.fullName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        isSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-[#F4F8FC] text-[#0D47A1]'
                                      }`}
                                    >
                                      {st.className}
                                    </span>
                                    <span
                                      className={`text-[11px] tabular-nums ${
                                        isSelected ? 'text-blue-100' : 'text-slate-500'
                                      }`}
                                    >
                                      Mã: {st.studentCode}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Selected Student Info Badge */}
                {selectedStudent && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-emerald-950 text-sm">
                          Thí sinh đã chọn: {selectedStudent.fullName}
                        </p>
                        <p className="text-emerald-800">
                          Lớp: <strong>{selectedStudent.className}</strong> (Khối{' '}
                          {selectedStudent.grade}) · Mã học sinh:{' '}
                          <strong>{selectedStudent.studentCode}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Enter Student Login Code */}
                <div>
                  <label className="block text-sm font-bold text-[#0D47A1] mb-1.5">
                    Bước 2: Nhập Mã đăng nhập để vào làm bài thi (*):
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showStudentPass ? 'text' : 'password'}
                      value={studentLoginCode}
                      onChange={(e) => {
                        setStudentLoginCode(e.target.value);
                        setStudentError('');
                      }}
                      placeholder="Nhập Mã đăng nhập (hoặc Mã học sinh) do Giáo viên cấp..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-slate-300 focus:border-[#0D47A1] rounded-xl text-sm font-bold text-[#17365D] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPass(!showStudentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0D47A1] cursor-pointer"
                      title={showStudentPass ? 'Ẩn mã đăng nhập' : 'Hiện mã đăng nhập'}
                    >
                      {showStudentPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gợi ý: Nhập cột <strong>Mã đăng nhập (MaDangNhap)</strong> hoặc{' '}
                    <strong>Mã học sinh (MaHocSinh)</strong> trong danh sách lớp.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 bg-[#FF8A00] hover:bg-[#e67c00] text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>ĐĂNG NHẬP VÀO LÀM BÀI THI TRỰC TUYẾN</span>
                </button>
              </form>
            </div>

            <div className="bg-[#F4F8FC] px-6 py-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Chế độ bảo mật phòng thi trực tuyến</span>
              <span className="font-bold text-[#0D47A1]">
                Tự động lưu bài làm & Chấm điểm tức thời
              </span>
            </div>
          </div>

          {/* ===============================================================
              WINDOW 2: TEACHER MAIN DASHBOARD LOGIN WINDOW (5 columns on lg)
          =============================================================== */}
          <div className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#0D47A1] shadow-md overflow-hidden flex flex-col justify-between">
            <div>
              {/* Window Title Bar */}
              <div className="bg-[#0D47A1] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/15">
                    <ShieldCheck className="w-6 h-6 text-[#FF8A00]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C8FF]">
                      Cửa sổ 2 · Dành cho Giáo viên
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      ĐĂNG NHẬP GIÁO VIÊN & TRANG CHÍNH
                    </h3>
                  </div>
                </div>
              </div>

              <form onSubmit={handleTeacherSubmit} className="p-6 space-y-4">
                {/* Teacher Profile Card */}
                <div className="p-4 rounded-xl bg-[#F4F8FC] border border-blue-200 flex items-center gap-3.5">
                  <TeacherAvatarSvg className="w-12 h-12 shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <p className="text-sm font-bold text-[#0D47A1]">
                      Giáo viên: Nguyễn Tiến Dương
                    </p>
                    <p className="text-slate-600 font-semibold">
                      Trường THPT Thanh Hòa · Môn Tin học
                    </p>
                    <p className="text-slate-500 text-[11px]">Email: tienduongbp2011@gmail.com</p>
                  </div>
                </div>

                {teacherError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{teacherError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-[#0D47A1] mb-1.5">
                    Tài khoản / Email Giáo viên (*):
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={teacherUsername}
                      onChange={(e) => {
                        setTeacherUsername(e.target.value);
                        setTeacherError('');
                      }}
                      placeholder="tienduongbp2011@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border-2 border-slate-300 focus:border-[#0D47A1] rounded-xl text-sm font-bold text-[#17365D] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-[#0D47A1]">
                      Mật khẩu quản trị Giáo viên (*):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherUsername('tienduongbp2011@gmail.com');
                        setTeacherPassword('123456');
                        setTeacherError('');
                      }}
                      className="text-[11px] font-bold text-[#168BFA] hover:underline cursor-pointer"
                    >
                      Điền nhanh mật khẩu mặc định (123456)
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showTeacherPass ? 'text' : 'password'}
                      value={teacherPassword}
                      onChange={(e) => {
                        setTeacherPassword(e.target.value);
                        setTeacherError('');
                      }}
                      placeholder="Nhập mật khẩu giáo viên (Mặc định: 123456)..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-slate-300 focus:border-[#0D47A1] rounded-xl text-sm font-bold text-[#17365D] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPass(!showTeacherPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0D47A1] cursor-pointer"
                      title={showTeacherPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showTeacherPass ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mật khẩu mặc định: <strong>123456</strong> (hoặc <strong>thanhhoa2026</strong>).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-[#0D47A1] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Quyền hạn Trang chính Quản trị Giáo viên:</span>
                  </p>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-600">
                    <li>Quản lý Lớp học & Nhập danh sách Học sinh từ Excel</li>
                    <li>Ngân hàng câu hỏi chuẩn GDPT 2018 & Tạo đề theo Ma trận</li>
                    <li>Giao bài kiểm tra trực tuyến, chấm điểm & xuất báo cáo Excel/Word</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 bg-[#0D47A1] hover:bg-[#168BFA] text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-5 h-5" />
                  <span>ĐĂNG NHẬP TRANG CHÍNH QUẢN TRỊ (GIÁO VIÊN)</span>
                </button>
              </form>
            </div>

            <div className="bg-[#F4F8FC] px-6 py-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Quyền Quản trị viên toàn hệ thống</span>
              <span className="font-bold text-emerald-700">● Kết nối Supabase PostgreSQL</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-600">
        <strong>TIN HỌC THPT THANH HÒA</strong> — Trường THPT Thanh Hòa, Xã Thiện Hưng, TP. Đồng Nai
        · Giáo viên phụ trách: <strong>Nguyễn Tiến Dương</strong>
      </footer>
    </div>
  );
};
