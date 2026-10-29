import React from 'react';

export const SchoolBookTechLogo: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Biểu tượng Tin học THPT Thanh Hòa"
  >
    <rect width="64" height="64" rx="14" fill="#0D47A1" />
    <rect x="3" y="3" width="58" height="58" rx="11" stroke="#00C8FF" strokeOpacity="0.45" strokeWidth="1.5" />
    {/* Open Book Base */}
    <path
      d="M12 44V22C12 20.5 19 18 32 22C45 18 52 20.5 52 22V44C45 40.5 36 42 32 45C28 42 19 40.5 12 44Z"
      fill="#168BFA"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M32 22V45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    {/* Tech Circuit Nodes rising from the Book */}
    <path
      d="M22 28L22 15L17 11M32 22V10M42 28L42 15L47 11"
      stroke="#00C8FF"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="17" cy="11" r="3" fill="#FF8A00" stroke="#FFFFFF" strokeWidth="1.2" />
    <circle cx="32" cy="9" r="3.5" fill="#00C8FF" stroke="#FFFFFF" strokeWidth="1.2" />
    <circle cx="47" cy="11" r="3" fill="#FF8A00" stroke="#FFFFFF" strokeWidth="1.2" />
    {/* Binary / Code lines on book pages */}
    <path d="M17 30H27M17 35H25" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M37 30H47M39 35H47" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const TeacherAvatarSvg: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Ảnh đại diện Giáo viên Nguyễn Tiến Dương"
  >
    <circle cx="32" cy="32" r="31" fill="#E3F2FD" stroke="#168BFA" strokeWidth="2" />
    {/* Shoulders & Shirt */}
    <path d="M12 56C15 45 23 41 32 41C41 41 49 45 52 56" fill="#0D47A1" />
    {/* Collar & Tie */}
    <path d="M26 41L32 49L38 41" fill="#FFFFFF" />
    <path d="M30.5 45L32 56L33.5 45L32 42L30.5 45Z" fill="#FF8A00" />
    {/* Head */}
    <circle cx="32" cy="25" r="11" fill="#FBD3B4" />
    {/* Hair */}
    <path
      d="M21 23C21 15 26 12 32 12C38 12 43 15 43 23C41 19 37 17 32 17C27 17 23 19 21 23Z"
      fill="#17365D"
    />
    {/* Glasses */}
    <rect x="24" y="22" width="6.5" height="4.5" rx="1" stroke="#0D47A1" strokeWidth="1.6" fill="#FFFFFF" fillOpacity="0.4" />
    <rect x="33.5" y="22" width="6.5" height="4.5" rx="1" stroke="#0D47A1" strokeWidth="1.6" fill="#FFFFFF" fillOpacity="0.4" />
    <path d="M30.5 24H33.5" stroke="#0D47A1" strokeWidth="1.6" />
    {/* Smile */}
    <path d="M29 30.5C30.5 32 33.5 32 35 30.5" stroke="#17365D" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const DashboardHeroIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-36' }) => (
  <svg
    viewBox="0 0 420 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Minh họa Hệ thống Quản lý Dạy học và Kiểm tra Tin học THPT Thanh Hòa"
  >
    <rect x="8" y="8" width="404" height="144" rx="12" fill="#0A357A" stroke="#00C8FF" strokeOpacity="0.35" />
    {/* Grid lines */}
    <path d="M8 44H412M8 80H412M8 116H412" stroke="#168BFA" strokeOpacity="0.2" strokeDasharray="4 4" />
    <path d="M90 8V152M180 8V152M270 8V152M350 8V152" stroke="#168BFA" strokeOpacity="0.2" strokeDasharray="4 4" />
    {/* Code Screen Card */}
    <rect x="28" y="24" width="145" height="108" rx="8" fill="#FFFFFF" />
    <rect x="28" y="24" width="145" height="22" rx="8" fill="#168BFA" />
    <circle cx="40" cy="35" r="3.5" fill="#FF8A00" />
    <circle cx="51" cy="35" r="3.5" fill="#00C8FF" />
    <circle cx="62" cy="35" r="3.5" fill="#FFFFFF" />
    <text x="40" y="64" fill="#0D47A1" fontSize="11" fontWeight="bold" fontFamily="Times New Roman">
      def kiem_tra_tin_hoc():
    </text>
    <text x="50" y="82" fill="#17365D" fontSize="10.5" fontFamily="Times New Roman">
      hoc_sinh = &quot;THPT Thanh Hòa&quot;
    </text>
    <text x="50" y="98" fill="#168BFA" fontSize="10.5" fontFamily="Times New Roman">
      diem_so = cham_tu_dong()
    </text>
    <rect x="40" y="109" width="88" height="12" rx="3" fill="#E3F2FD" />
    <text x="46" y="118" fill="#0D47A1" fontSize="9.5" fontWeight="bold" fontFamily="Times New Roman">
      Python • SQL • AI
    </text>

    {/* Connecting Flowchart / Database */}
    <path d="M173 78H215" stroke="#00C8FF" strokeWidth="2.5" />
    <circle cx="194" cy="78" r="4" fill="#FF8A00" />

    {/* Analytics & Score Chart Card */}
    <rect x="215" y="24" width="175" height="108" rx="8" fill="#F4F8FC" stroke="#00C8FF" strokeWidth="1.5" />
    <text x="230" y="44" fill="#0D47A1" fontSize="11.5" fontWeight="bold" fontFamily="Times New Roman">
      PHÂN TÍCH NĂNG LỰC SỐ
    </text>
    {/* Bars */}
    <rect x="235" y="96" width="20" height="22" rx="2" fill="#168BFA" />
    <rect x="268" y="80" width="20" height="38" rx="2" fill="#0D47A1" />
    <rect x="301" y="64" width="20" height="54" rx="2" fill="#00C8FF" />
    <rect x="334" y="54" width="20" height="64" rx="2" fill="#FF8A00" />
    <path d="M245 88L278 72L311 58L344 48" stroke="#0D47A1" strokeWidth="2" strokeLinecap="round" />
    <circle cx="245" cy="88" r="3" fill="#0D47A1" />
    <circle cx="278" cy="72" r="3" fill="#0D47A1" />
    <circle cx="311" cy="58" r="3" fill="#0D47A1" />
    <circle cx="344" cy="48" r="3.5" fill="#FF8A00" />
  </svg>
);
