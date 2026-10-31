import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  Copy,
  CheckCircle2,
  X,
  Share,
  PlusSquare,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-mgtbxwwftmezlgba67kdsa-357986342833.asia-southeast1.run.app';
  const studentAppUrl = `${originUrl}/?mode=student`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    studentAppUrl
  )}`;

  const handleCopyStudentLink = () => {
    navigator.clipboard.writeText(studentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        !isInstalled && (
          <div className="bg-gradient-to-r from-[#0D47A1] to-[#168BFA] text-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-blue-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/15 shrink-0">
                <Smartphone className="w-5 h-5 text-[#00C8FF]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Ứng dụng Kiểm tra Trực tuyến trên Điện thoại (App Thi Tin Học)
                </p>
                <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5">
                  Cài đặt biểu tượng App ra màn hình chính điện thoại hoặc lấy Mã QR cho học sinh quét vào phòng thi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-[#FF8A00] hover:bg-[#e67c00] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cài App ngay</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-white text-[#0D47A1] hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-[#FF8A00]" />
                <span>{isIOS ? 'Cách cài trên iPhone & QR' : 'Lấy Mã QR & Cài App ĐT'}</span>
              </button>
            </div>
          </div>
        )
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#FF8A00] hover:bg-[#e67c00] text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
          title="Cài đặt App Kiểm tra Trực tuyến lên Điện thoại hoặc lấy Mã QR cho học sinh"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>{isInstalled ? 'Mã QR App HS' : 'Cài App ĐT / QR'}</span>
        </button>
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto text-[#17365D] shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0D47A1] text-white">
                  <Smartphone className="w-5 h-5 text-[#00C8FF]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0D47A1]">
                    Cài đặt App Kiểm tra Trực tuyến trên Điện thoại
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dành cho Học sinh &amp; Giáo viên Trường THPT Thanh Hòa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Section 1: QR Code & Direct Student App Link */}
            <div className="p-4 rounded-xl bg-[#F4F8FC] border-2 border-[#168BFA] flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shrink-0 text-center">
                <img
                  src={qrCodeImageUrl}
                  alt="Mã QR App Kiểm tra Trực tuyến Học sinh"
                  className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                />
                <span className="block text-[10px] font-bold text-[#0D47A1] mt-1">
                  Quét bằng Zalo / Camera ĐT
                </span>
              </div>

              <div className="space-y-2.5 flex-1 text-xs sm:text-sm">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#0D47A1] text-white text-[11px] font-bold">
                  BƯỚC 1: GỬI LINK HOẶC MÃ QR CHO HỌC SINH
                </span>
                <p className="font-bold text-[#0D47A1] text-sm sm:text-base">
                  Đường dẫn mở thẳng Cửa sổ Đăng nhập Học sinh:
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khi học sinh mở đường dẫn này (hoặc quét mã QR), điện thoại sẽ tự động vào thẳng{' '}
                  <strong>Giao diện Kiểm tra Trực tuyến của Học sinh</strong> (ẩn giao diện quản trị của Giáo viên).
                </p>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-300">
                  <input
                    type="text"
                    readOnly
                    value={studentAppUrl}
                    className="w-full text-xs font-mono text-[#0D47A1] font-bold bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyStudentLink}
                    className="px-3 py-1.5 rounded-lg bg-[#0D47A1] hover:bg-[#168BFA] text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Install onto Home Screen (Android & iOS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Android Guide */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white font-bold text-[11px]">
                    ĐIỆN THOẠI ANDROID (Samsung, Oppo, Xiaomi...)
                  </span>
                </div>
                <p className="font-bold text-emerald-950 text-sm">
                  Cách cài App &quot;Thi Tin Học&quot; ra màn hình chính:
                </p>
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Bấm vào đây để Cài đặt App ngay</span>
                  </button>
                ) : null}
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                  <li>
                    Mở đường link trên bằng trình duyệt <strong>Chrome</strong> trên điện thoại Android.
                  </li>
                  <li>
                    Nhấn vào biểu tượng <strong>3 dấu chấm (⋮)</strong> ở góc trên bên phải trình duyệt.
                  </li>
                  <li>
                    Chọn <strong>&quot;Cài đặt ứng dụng&quot; (Install App)</strong> hoặc{' '}
                    <strong>&quot;Thêm vào màn hình chính&quot;</strong>.
                  </li>
                  <li>
                    App <strong>Thi Tin Học</strong> sẽ xuất hiện ngay trên màn hình điện thoại như một ứng dụng độc lập!
                  </li>
                </ol>
              </div>

              {/* iPhone / iOS Guide */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-300 space-y-2.5 text-xs">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-[#0D47A1] text-white font-bold text-[11px]">
                    ĐIỆN THOẠI IPHONE / IPAD (iOS)
                  </span>
                </div>
                <p className="font-bold text-[#0D47A1] text-sm">
                  Cách cài App &quot;Thi Tin Học&quot; trên iPhone:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                  <li>
                    Mở đường link bằng trình duyệt <strong>Safari</strong> trên iPhone.
                  </li>
                  <li className="flex items-start gap-1">
                    <span>
                      2. Nhấn nút <strong>Chia sẻ (Share)</strong>
                    </span>
                    <Share className="w-3.5 h-3.5 text-[#0D47A1] shrink-0 mt-0.5 inline" />
                    <span>ở thanh công cụ phía dưới màn hình.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span>
                      3. Cuộn xuống chọn <strong>&quot;Thêm vào MH chính&quot;</strong>
                    </span>
                    <PlusSquare className="w-3.5 h-3.5 text-[#0D47A1] shrink-0 mt-0.5 inline" />
                    <span>(Add to Home Screen).</span>
                  </li>
                  <li>
                    Nhấn <strong>Thêm (Add)</strong> ở góc phải trên cùng để hoàn tất.
                  </li>
                </ol>
              </div>
            </div>

            {/* Section 3: Optional APK packaging for Android */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1.5">
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#FF8A00]" />
                <span>
                  Mẹo nâng cao cho Giáo viên: Muốn xuất thành file cài đặt <code>.APK</code> gửi qua Zalo?
                </span>
              </p>
              <p className="text-slate-700 leading-relaxed">
                Hệ thống này đã được tích hợp sẵn chuẩn <strong>PWA (Progressive Web App)</strong>. Nếu thầy muốn đóng gói thành tệp <code>.apk</code> riêng cho Android, thầy chỉ cần truy cập{' '}
                <strong>pwabuilder.com</strong> hoặc <strong>webintoapp.com</strong>, dán đường dẫn{' '}
                <code className="bg-white px-1.5 py-0.5 rounded border border-amber-200 font-bold text-[#0D47A1]">
                  {studentAppUrl}
                </code>{' '}
                vào và nhấn <strong>Package for Android</strong> để tải file <code>.apk</code> miễn phí trong 1 phút.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#168BFA] text-white text-xs font-bold cursor-pointer"
              >
                Đã hiểu &amp; Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
