import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from 'docx';
import {
  CognitiveLevel,
  Exam,
  ExamAnswerKey,
  GradeLevel,
  MatrixRow,
  Question,
  QuestionType,
  TrueFalseSubItem,
} from '../types';

/**
 * 1. EXCEL (.xlsx) EXPORT & TEMPLATE UTILITIES
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const worksheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-calculate column widths
  ws['!cols'] = headers.map((h, colIdx) => {
    let maxLen = h.length;
    for (const r of rows) {
      const cellStr = String(r[colIdx] ?? '');
      if (cellStr.length > maxLen) maxLen = cellStr.length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 55) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const cleanFileName = filename.replace(/\.(csv|xlsx|xls)$/i, '') + '.xlsx';
  XLSX.writeFile(wb, cleanFileName);
}

export function downloadStudentExcelTemplate() {
  const headers = ['MaHocSinh', 'HoVaTen', 'NgaySinh', 'MaLop', 'Khoi', 'MaDangNhap'];
  const sampleRows = [
    ['HS10A1-01', 'Nguyễn Văn An', '15/04/2011', '10A1', '10', 'hs10a101'],
    ['HS10A1-02', 'Trần Thị Bích Ngọc', '22/09/2011', '10A1', '10', 'hs10a102'],
    ['HS11A1-01', 'Lê Minh Khang', '08/11/2010', '11A1', '11', 'hs11a101'],
    ['HS12A1-01', 'Phạm Hoàng Nam', '19/01/2009', '12A1', '12', 'hs12a101'],
  ];

  const guideRows = [
    ['CỘT DỮ LIỆU', 'BẮT BUỘC', 'HƯỚNG DẪN NHẬP LIỆU CHUẨN (TRƯỜNG THPT THANH HÒA)'],
    ['MaHocSinh', 'Có', 'Mã định danh duy nhất của học sinh (VD: HS10A1-01). Không được trùng lặp.'],
    ['HoVaTen', 'Có', 'Họ và tên đầy đủ có dấu tiếng Việt (VD: Nguyễn Văn An).'],
    ['NgaySinh', 'Tùy chọn', 'Định dạng dd/MM/yyyy (VD: 15/04/2011).'],
    ['MaLop', 'Có', 'Mã lớp học trên hệ thống (VD: 10A1, 11A1, 12A1).'],
    ['Khoi', 'Có', 'Chỉ nhập một trong 3 giá trị: 10, 11 hoặc 12.'],
    ['MaDangNhap', 'Tùy chọn', 'Tên đăng nhập của học sinh (nếu để trống hệ thống tự lấy theo MaHocSinh).'],
  ];

  const wsStudents = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  wsStudents['!cols'] = [
    { wch: 16 },
    { wch: 26 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 16 },
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 68 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsStudents, 'DanhSachHocSinh');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'HuongDan');

  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_THPT_Thanh_Hoa.xlsx');
}

export async function parseStudentExcelFile(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
  });
  return rows
    .map((r) => r.map((cell) => String(cell ?? '').trim()))
    .filter((r) => r.some((cell) => cell !== ''));
}

export function downloadMatrixExcelTemplate() {
  const headers = [
    'ChuDe',
    'DonViKienThuc',
    'BanDacTaYeuCauCanDat',
    'MucDoNhanThuc',
    'DangCauHoi',
    'SoCau',
    'TongDiem',
  ];
  const sampleRows = [
    [
      'Chủ đề 1: Máy tính và xã hội tri thức',
      'Đơn vị đo dung lượng thông tin',
      'Nhận biết được các đơn vị đo lượng thông tin Bit, Byte, KB, MB, GB',
      'Nhận biết',
      'TN',
      1,
      2.0,
    ],
    [
      'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      'Vòng lặp for và hàm range()',
      'Hiểu được hoạt động của câu lệnh lặp for với vùng giá trị range() trong Python',
      'Thông hiểu',
      'TN',
      1,
      2.0,
    ],
    [
      'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      'Thao tác trên danh sách Python',
      'Vận dụng được các phương thức xử lý danh sách (list) và truy cập phần tử',
      'Vận dụng',
      'DS',
      1,
      4.0,
    ],
    [
      'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      'Hàm và phương thức xử lý xâu',
      'Viết được hàm Python giải quyết bài toán xử lý xâu kí tự thực tiễn',
      'Vận dụng cao',
      'TL',
      1,
      2.0,
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 36 },
    { wch: 28 },
    { wch: 48 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KhungMaTranDacTa');
  XLSX.writeFile(wb, 'Mau_Khung_Ma_Tran_Dac_Ta_THPT_Thanh_Hoa.xlsx');
}

export async function parseMatrixExcelFile(
  file: File,
  examTotalPoints = 10
): Promise<MatrixRow[]> {
  const rows = await parseStudentExcelFile(file);
  if (rows.length === 0) return [];
  const startIdx = rows[0][0]?.toLowerCase().includes('chude') || rows[0][0]?.toLowerCase().includes('chủ đề') ? 1 : 0;
  const parsed: MatrixRow[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const [
      topic = '',
      knowledgeUnit = '',
      specification = '',
      rawLevel = 'Nhận biết',
      rawType = 'TN',
      rawCount = '1',
      rawPts = '1',
    ] = rows[i];
    if (!topic) continue;

    let cognitiveLevel: CognitiveLevel = 'Nhận biết';
    const lv = rawLevel.toLowerCase();
    if (lv.includes('vận dụng cao') || lv === 'vdc') cognitiveLevel = 'Vận dụng cao';
    else if (lv.includes('vận dụng') || lv === 'vd') cognitiveLevel = 'Vận dụng';
    else if (lv.includes('thông hiểu') || lv === 'th') cognitiveLevel = 'Thông hiểu';

    let questionType: QuestionType = 'multiple_choice';
    const tp = rawType.toUpperCase();
    if (tp === 'DS' || tp.includes('ĐÚNG')) questionType = 'true_false';
    else if (tp === 'TLN' || tp.includes('NGẮN')) questionType = 'short_answer';
    else if (tp === 'TL' || tp.includes('TỰ LUẬN')) questionType = 'essay';

    const questionCount = Math.max(1, parseInt(rawCount, 10) || 1);
    const totalPoints = parseFloat(rawPts.replace(',', '.')) || 1.0;

    parsed.push({
      id: `m_xl_${Date.now()}_${i}`,
      topic,
      knowledgeUnit: knowledgeUnit || 'Kiến thức trọng tâm',
      specification: specification || `${cognitiveLevel}: ${knowledgeUnit || topic}`,
      cognitiveLevel,
      questionType,
      questionCount,
      pointsPerQuestion: Math.round((totalPoints / questionCount) * 100) / 100,
      totalPoints,
      percentage: Math.round((totalPoints / (examTotalPoints || 10)) * 100),
    });
  }

  return parsed;
}

/**
 * 2. WORD (.docx) TEMPLATE & PARSER FOR QUESTION BANK (CHUẨN 3 PHẦN & GẠCH CHÂN ĐÁP ÁN)
 */
export const SAMPLE_WORD_RAW_TEXT = `[KHỐI: 10]
[CHỦ ĐỀ: Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính]

PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN
Câu 1 [NB]. Trong ngôn ngữ lập trình Python, tên biến nào sau đây là hợp lệ?
   A. 10_hoc_sinh
   <u>B</u>. diem_tin_hoc
   C. for
   D. ho-va-ten
Câu 2 [TH]. Cho đoạn lệnh Python: s = 0; for i in range(1, 5): s = s + i. Kết quả biến s sau khi thực hiện là?
   A. 15
   <u>B</u>. 10
   C. 6
   D. 4
Câu 3 [VD]. Để thêm phần tử số 20 vào cuối danh sách A trong Python, ta dùng lệnh nào sau đây?
   <u>A</u>. A.append(20)
   B. A.insert(0, 20)
   C. A.pop(20)
   D. A.remove(20)
Câu 4 [VDC]. Cho danh sách A = [1, 2, 3, 4, 5, 6]. Biểu thức tạo danh sách mới gồm bình phương các số chẵn từ A là?
   A. [x*2 for x in A if x % 2 == 0]
   B. [x**2 for x in A if x % 2 == 1]
   <u>C</u>. [x**2 for x in A if x % 2 == 0]
   D. [x**2 for x in A]

PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI (4,0 điểm)
Câu hỏi có 4 ý a, b, c, d , thí sinh chọn Đúng hoặc Sai.
Câu 1. Cho danh sách ds = [10, 20, 30, 40] trong ngôn ngữ lập trình Python.
   <u>a)[1.NB] Phần tử đầu tiên ds[0] có giá trị là 10.</u>
   b)[2.TH] Lệnh len(ds) trả về kết quả là 3.
   <u>c) [2.VD] Sau khi thực hiện lệnh ds.append(50), danh sách ds có 5 phần tử.</u>
   d) [2.VDC] Biểu thức (25 in ds) and (ds[-1] == 40) trả về giá trị True.

PHẦN III. Câu trắc nghiệm trả lời ngắn.
Câu 1 [VD]: Trong ngôn ngữ lập trình Python, kết quả của phép chia lấy phần nguyên 29 // 5 bằng bao nhiêu?
.nội dung trả lời: 5
Câu 2 [VDC]: Cho xâu kí tự s = "THPT Thanh Hoa". Lệnh len(s.split()) trả về giá trị bằng bao nhiêu?
.nội dung trả lời: 3`;

export async function downloadQuestionWordTemplate() {
  const makeMcQuestionParagraphs = (
    num: number,
    levelCode: 'NB' | 'TH' | 'VD' | 'VDC',
    questionText: string,
    opts: { letter: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect?: boolean }[]
  ): Paragraph[] => {
    return [
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: `Câu ${num} [${levelCode}]. `,
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
          new TextRun({
            text: questionText,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      }),
      ...opts.map(
        (o) =>
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: o.letter,
                bold: true,
                underline: o.isCorrect ? { type: UnderlineType.SINGLE } : undefined,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `. ${o.text}`,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          })
      ),
    ];
  };

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'TRƯỜNG THPT THANH HÒA — HỆ THỐNG TIN HỌC TRỰC TUYẾN',
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'MẪU CÂU HỎI CHUẨN 3 PHẦN NHẬP TỪ FILE WORD (.DOCX)',
                bold: true,
                size: 28,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: '[KHỐI: 10]',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: '[CHỦ ĐỀ: Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính]',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),

          // PHẦN I
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: 'PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          ...makeMcQuestionParagraphs(
            1,
            'NB',
            'Trong ngôn ngữ lập trình Python, tên biến nào sau đây là hợp lệ?',
            [
              { letter: 'A', text: '10_hoc_sinh' },
              { letter: 'B', text: 'diem_tin_hoc', isCorrect: true },
              { letter: 'C', text: 'for' },
              { letter: 'D', text: 'ho-va-ten' },
            ]
          ),
          ...makeMcQuestionParagraphs(
            2,
            'TH',
            'Cho đoạn lệnh Python: s = 0; for i in range(1, 5): s = s + i. Kết quả biến s sau khi thực hiện là?',
            [
              { letter: 'A', text: '15' },
              { letter: 'B', text: '10', isCorrect: true },
              { letter: 'C', text: '6' },
              { letter: 'D', text: '4' },
            ]
          ),
          ...makeMcQuestionParagraphs(
            3,
            'VD',
            'Để thêm phần tử số 20 vào cuối danh sách A trong Python, ta dùng lệnh nào sau đây?',
            [
              { letter: 'A', text: 'A.append(20)', isCorrect: true },
              { letter: 'B', text: 'A.insert(0, 20)' },
              { letter: 'C', text: 'A.pop(20)' },
              { letter: 'D', text: 'A.remove(20)' },
            ]
          ),
          ...makeMcQuestionParagraphs(
            4,
            'VDC',
            'Cho danh sách A = [1, 2, 3, 4, 5, 6]. Biểu thức tạo danh sách mới gồm bình phương các số chẵn từ A là?',
            [
              { letter: 'A', text: '[x*2 for x in A if x % 2 == 0]' },
              { letter: 'B', text: '[x**2 for x in A if x % 2 == 1]' },
              { letter: 'C', text: '[x**2 for x in A if x % 2 == 0]', isCorrect: true },
              { letter: 'D', text: '[x**2 for x in A]' },
            ]
          ),
          new Paragraph({
            spacing: { before: 80, after: 160 },
            children: [
              new TextRun({
                text: '(Lưu ý Phần I: Các câu hỏi đáp án đúng là gạch chân chữ A hoặc B hoặc C hoặc D)',
                italics: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),

          // PHẦN II
          new Paragraph({
            spacing: { before: 160, after: 60 },
            children: [
              new TextRun({
                text: 'PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI (4,0 điểm)',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'Câu hỏi có 4 ý a, b, c, d , thí sinh chọn Đúng hoặc Sai.',
                italics: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({
                text: 'Câu 1. ',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Cho danh sách ds = [10, 20, 30, 40] trong ngôn ngữ lập trình Python.',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'a)[1.NB] Phần tử đầu tiên ds[0] có giá trị là 10.',
                underline: { type: UnderlineType.SINGLE },
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'b)[2.TH] Lệnh len(ds) trả về kết quả là 3.',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'c) [2.VD] Sau khi thực hiện lệnh ds.append(50), danh sách ds có 5 phần tử.',
                underline: { type: UnderlineType.SINGLE },
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'd) [2.VDC] Biểu thức (25 in ds) and (ds[-1] == 40) trả về giá trị True.',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: '(Lưu ý Phần II: Tất cả đáp án Đúng thì gạch chân, đáp án Sai không gạch chân)',
                italics: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),

          // PHẦN III
          new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [
              new TextRun({
                text: 'PHẦN III. Câu trắc nghiệm trả lời ngắn.',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: 'Câu 1 [VD]: ',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Trong ngôn ngữ lập trình Python, kết quả của phép chia lấy phần nguyên 29 // 5 bằng bao nhiêu?',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: '.nội dung trả lời: 5',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: 'Câu 2 [VDC]: ',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Cho xâu kí tự s = "THPT Thanh Hoa". Lệnh len(s.split()) trả về giá trị bằng bao nhiêu?',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: '.nội dung trả lời: 3',
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Mau_Cau_Hoi_Word_3_Phan_THPT_Thanh_Hoa.docx';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Extracts text from a .docx file while preserving <u>...</u> underline tags
 * so underlined answers in Phần I (A/B/C/D) and Phần II (a/b/c/d) are detected accurately.
 */
export async function extractTextFromWordFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml(
    { arrayBuffer },
    { styleMap: ['u => u'] }
  );

  if (htmlResult.value) {
    const withLineBreaks = htmlResult.value
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // Keep only <u> and </u> tags, strip all other HTML tags
      .replace(/<(?!\/?u\b)[^>]+>/gi, '')
      // Decode common HTML entities
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

    return withLineBreaks
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n');
  }

  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  return rawResult.value || '';
}

function parseShortCognitiveCode(rawCode: string): CognitiveLevel | null {
  const clean = rawCode.trim().toUpperCase();
  if (clean.includes('VDC') || clean.includes('VẬN DỤNG CAO')) return 'Vận dụng cao';
  if (clean.includes('VD') || clean.includes('VẬN DỤNG')) return 'Vận dụng';
  if (clean.includes('TH') || clean.includes('THÔNG HIỂU')) return 'Thông hiểu';
  if (clean.includes('NB') || clean.includes('NHẬN BIẾT')) return 'Nhận biết';
  return null;
}

export function parseQuestionsFromWordText(
  rawText: string,
  defaultGrade: GradeLevel = '10',
  defaultTopic = 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính'
): Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  let currentGrade: GradeLevel = defaultGrade;
  let currentTopic: string = defaultTopic;
  let currentSectionType: QuestionType | null = null;

  const parsedQuestions: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[] = [];

  interface RawBlock {
    grade: GradeLevel;
    topic: string;
    sectionType: QuestionType | null;
    headerLine: string;
    bodyLines: string[];
  }

  const blocks: RawBlock[] = [];
  let activeBlock: RawBlock | null = null;

  for (const rawLine of lines) {
    if (!rawLine) continue;
    const plainLine = rawLine.replace(/<\/?u>/gi, '').trim();

    // Detect [KHỐI: ...] and [CHỦ ĐỀ: ...]
    const gradeMatch = plainLine.match(/^\[KHỐI:\s*(10|11|12)\]/i);
    if (gradeMatch) {
      currentGrade = gradeMatch[1] as GradeLevel;
      continue;
    }

    const topicMatch = plainLine.match(/^\[CHỦ ĐỀ:\s*(.+?)\]/i);
    if (topicMatch) {
      currentTopic = topicMatch[1].trim();
      continue;
    }

    // Detect Section Headers: PHẦN I / PHẦN II / PHẦN III
    if (/^PHẦN\s+(I|1)\b/i.test(plainLine)) {
      if (activeBlock) {
        blocks.push(activeBlock);
        activeBlock = null;
      }
      currentSectionType = 'multiple_choice';
      continue;
    }
    if (/^PHẦN\s+(II|2)\b/i.test(plainLine)) {
      if (activeBlock) {
        blocks.push(activeBlock);
        activeBlock = null;
      }
      currentSectionType = 'true_false';
      continue;
    }
    if (/^PHẦN\s+(III|3)\b/i.test(plainLine)) {
      if (activeBlock) {
        blocks.push(activeBlock);
        activeBlock = null;
      }
      currentSectionType = 'short_answer';
      continue;
    }

    // Skip template instruction lines
    if (
      /^(các câu hỏi đáp án đúng là gạch chân|tất cả đáp án đúng thì gạch chân|câu hỏi có 4 ý a,\s*b,\s*c,\s*d|\(lưu ý phần)/i.test(
        plainLine
      )
    ) {
      continue;
    }

    // Match question start:
    // Examples:
    // "Câu 1 [NB]. Nội dung câu hỏi?"
    // "Câu 2 [TH]. Nội dung câu hỏi?"
    // "Câu 1. Nội dung câu hỏi"
    // "Câu 1: nội dung câu hỏi"
    if (/^Câu\s+\d+\b/i.test(plainLine)) {
      if (activeBlock) blocks.push(activeBlock);
      activeBlock = {
        grade: currentGrade,
        topic: currentTopic,
        sectionType: currentSectionType,
        headerLine: plainLine,
        bodyLines: [],
      };
    } else if (activeBlock) {
      activeBlock.bodyLines.push(rawLine);
    }
  }
  if (activeBlock) blocks.push(activeBlock);

  blocks.forEach((block, idx) => {
    // Parse header line: e.g. "Câu 1 [NB]. Nội dung câu hỏi?" or "Câu 1: nội dung"
    let cognitiveLevel: CognitiveLevel = 'Thông hiểu';
    let headerRest = block.headerLine.replace(/^Câu\s+\d+\s*/i, '').trim();

    // Check bracket right after Câu <n>: e.g. [NB], [TH], [VD], [VDC], [1.NB], etc.
    const leadingBracket = headerRest.match(/^\[([^\]:]+)\]\s*[:.]?\s*(.*)$/);
    if (leadingBracket) {
      const detectedLv = parseShortCognitiveCode(leadingBracket[1]);
      if (detectedLv) {
        cognitiveLevel = detectedLv;
        headerRest = leadingBracket[2].trim();
      }
    } else {
      headerRest = headerRest.replace(/^[:.]\s*/, '').trim();
    }

    // Also support legacy [MỨC ĐỘ: ...] tag
    const levelMatch = headerRest.match(/\[MỨC ĐỘ:\s*([^\]]+)\]/i);
    if (levelMatch) {
      const detectedLv = parseShortCognitiveCode(levelMatch[1]);
      if (detectedLv) cognitiveLevel = detectedLv;
    }

    let questionType: QuestionType | null = block.sectionType;
    const typeMatch = headerRest.match(/\[LOẠI:\s*([^\]]+)\]/i);
    if (typeMatch) {
      const rawType = typeMatch[1].trim().toUpperCase();
      if (rawType === 'TN' || rawType.includes('TRẮC NGHIỆM')) questionType = 'multiple_choice';
      else if (rawType === 'DS' || rawType.includes('ĐÚNG')) questionType = 'true_false';
      else if (rawType === 'TLN' || rawType.includes('TRẢ LỜI NGẮN'))
        questionType = 'short_answer';
      else if (rawType === 'TL' || rawType.includes('TỰ LUẬN')) questionType = 'essay';
    }

    let points = 0.25;
    const ptsMatch = headerRest.match(/\[ĐIỂM:\s*([\d.,]+)\]/i);
    if (ptsMatch) {
      points = parseFloat(ptsMatch[1].replace(',', '.')) || 0.25;
    }

    let knowledgeUnit = block.topic;
    const unitMatch = headerRest.match(/\[ĐƠN VỊ:\s*([^\]]+)\]/i);
    if (unitMatch) {
      knowledgeUnit = unitMatch[1].trim();
    }

    const cleanHeaderContent = headerRest
      .replace(/\[(MỨC ĐỘ|LOẠI|ĐIỂM|ĐƠN VỊ|CHỦ ĐỀ|KHỐI):[^\]]+\]/gi, '')
      .replace(/^\[(NB|TH|VD|VDC)\]\s*[:.]?\s*/i, '')
      .trim();

    const contentLines: string[] = cleanHeaderContent ? [cleanHeaderContent] : [];
    const codeLines: string[] = [];
    let inCode = false;

    const options: string[] = [];
    let detectedCorrectLetter = '';
    const subItems: TrueFalseSubItem[] = [];
    let explicitAnswer = '';
    let explanation = '';
    let gradingGuide = '';

    for (const rawLine of block.bodyLines) {
      const hasUnderline = /<u>[\s\S]*?<\/u>/i.test(rawLine);
      const line = rawLine.replace(/<\/?u>/gi, '').trim();
      if (!line) continue;

      if (/^\[CODE(:[^\]]+)?\]$/i.test(line)) {
        inCode = true;
        continue;
      }
      if (/^\[\/CODE\]$/i.test(line)) {
        inCode = false;
        continue;
      }
      if (inCode) {
        codeLines.push(line);
        continue;
      }

      // Check PHẦN III ".nội dung trả lời:..." or "Đáp án: ..."
      const shortAnsMatch = line.match(
        /^\.?\s*(nội dung trả lời|đáp án|trả lời)\s*[:.]\s*(.*)$/i
      );
      if (shortAnsMatch) {
        // Strip placeholder dots "........"
        const candidateAns = shortAnsMatch[2].replace(/\.{2,}/g, '').trim();
        if (candidateAns) {
          explicitAnswer = candidateAns;
        }
        if (!questionType) questionType = 'short_answer';
        continue;
      }

      const expMatch = line.match(/^(Giải thích|Lời giải)\s*[:.]\s*(.+)$/i);
      if (expMatch) {
        explanation = expMatch[2].trim();
        continue;
      }

      const guideMatch = line.match(/^(Hướng dẫn chấm|Biểu điểm)\s*[:.]\s*(.+)$/i);
      if (guideMatch) {
        gradingGuide = guideMatch[2].trim();
        continue;
      }

      // Check PHẦN I Multiple choice option:
      // Supports "A. nội dung", "C.nội dung" (with or without space after dot), "*B. nội dung", or underlined letter/line
      const mcMatch = line.match(/^(\*)?([A-D])[.)]\s*(.+)$/);
      if (mcMatch) {
        const isStarred = Boolean(mcMatch[1]);
        const letter = mcMatch[2].toUpperCase();
        const optText = mcMatch[3].trim();
        options.push(optText);
        if (isStarred || hasUnderline) {
          detectedCorrectLetter = letter;
        }
        continue;
      }

      // Check PHẦN II True/False subItem:
      // Supports:
      // "a)[1.NB] nội dung ý a"
      // "b)[2.TH] nội dung ý b"
      // "c) [2.VD nội dung ý c" (even if closing ']' is missing!)
      // "d) [2.VDC] nội dung ý d"
      const tfMatch = line.match(/^(\*)?([a-d])[.)]\s*(.+)$/i);
      if (tfMatch) {
        const isStarred = Boolean(tfMatch[1]);
        const subId = tfMatch[2].toLowerCase();
        let rawSubText = tfMatch[3].trim();
        let subCognitiveLevel: CognitiveLevel | undefined = undefined;

        // Parse optional [1.NB], [2.TH], [2.VD], [2.VDC] or [2.VD (without closing bracket)
        const subLvBracket = rawSubText.match(
          /^\[\s*(?:\d+\s*[.:-]?\s*)?(VDC|VD|TH|NB|Nhận biết|Thông hiểu|Vận dụng cao|Vận dụng)\s*\]?\s*(.*)$/i
        );
        if (subLvBracket) {
          const parsedLv = parseShortCognitiveCode(subLvBracket[1]);
          if (parsedLv) subCognitiveLevel = parsedLv;
          rawSubText = subLvBracket[2].trim();
        }

        // Determine True/False:
        // By default in the new template: Underlined = Đúng (True), Not underlined = Sai (False).
        // Also support explicit [Đ]/[S] badge at the end if provided.
        let isTrue = hasUnderline || isStarred;
        const badgeMatch = rawSubText.match(/\[(Đ|Đúng|S|Sai|True|False)\]\s*$/i);
        if (badgeMatch) {
          const val = badgeMatch[1].toUpperCase();
          isTrue = val === 'Đ' || val === 'ĐÚNG' || val === 'TRUE';
          rawSubText = rawSubText.replace(/\[(Đ|Đúng|S|Sai|True|False)\]\s*$/i, '').trim();
        }

        const subItemObj: TrueFalseSubItem = {
          id: subId,
          text: rawSubText,
          isTrue,
        };
        if (subCognitiveLevel) {
          subItemObj.cognitiveLevel = subCognitiveLevel;
        }
        subItems.push(subItemObj);
        continue;
      }

      contentLines.push(line);
    }

    // Auto-detect questionType if not set by PHẦN I / II / III
    if (!questionType) {
      if (subItems.length > 0) questionType = 'true_false';
      else if (options.length >= 2) questionType = 'multiple_choice';
      else if (
        gradingGuide ||
        contentLines.join(' ').toLowerCase().includes('viết hàm') ||
        contentLines.join(' ').toLowerCase().includes('viết chương trình')
      )
        questionType = 'essay';
      else questionType = 'short_answer';
    }

    // For True/False, if the main question didn't specify a cognitiveLevel, derive the highest level from its subItems
    if (questionType === 'true_false' && subItems.length > 0) {
      const levelsInSub = subItems.map((s) => s.cognitiveLevel).filter(Boolean);
      if (levelsInSub.includes('Vận dụng cao')) cognitiveLevel = 'Vận dụng cao';
      else if (levelsInSub.includes('Vận dụng')) cognitiveLevel = 'Vận dụng';
      else if (levelsInSub.includes('Thông hiểu')) cognitiveLevel = 'Thông hiểu';
    }

    if (!ptsMatch) {
      if (questionType === 'multiple_choice') points = 0.25;
      else if (questionType === 'true_false') points = 1.0;
      else if (questionType === 'short_answer') points = 0.5;
      else points = 1.0;
    }

    let finalCorrectAnswer = explicitAnswer;
    if (questionType === 'multiple_choice') {
      finalCorrectAnswer =
        (detectedCorrectLetter || explicitAnswer || 'A')
          .replace(/[^A-D]/gi, '')
          .toUpperCase()
          .slice(0, 1) || 'A';
      while (options.length < 4) {
        options.push(`Phương án ${['A', 'B', 'C', 'D'][options.length]}`);
      }
    } else if (questionType === 'true_false') {
      while (subItems.length < 4) {
        const nextId = ['a', 'b', 'c', 'd'][subItems.length];
        subItems.push({ id: nextId, text: `Mệnh đề ${nextId}`, isTrue: false });
      }
      finalCorrectAnswer = subItems.map((s) => `${s.id}:${s.isTrue ? 'Đ' : 'S'}`).join(',');
    }

    parsedQuestions.push({
      code: `WORD-TH${block.grade}-${Date.now().toString().slice(-3)}${idx + 1}`,
      grade: block.grade,
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: block.topic,
      lesson: knowledgeUnit,
      knowledgeUnit,
      cognitiveLevel,
      questionType,
      content: contentLines.join('\n').trim() || `Câu hỏi số ${idx + 1}`,
      codeSnippet: codeLines.join('\n').trim(),
      imageUrl: '',
      options: questionType === 'multiple_choice' ? options.slice(0, 4) : [],
      subItems: questionType === 'true_false' ? subItems.slice(0, 4) : [],
      correctAnswer: finalCorrectAnswer,
      explanation,
      gradingGuide,
      points,
      tags: [`Tin học ${block.grade}`, 'Mẫu Word 3 Phần'],
      isApproved: true,
      isDemo: false,
    });
  });

  return parsedQuestions;
}

/**
 * 3. EXPORT FULL EXAM + MATRIX + SPECIFICATION + ANSWER KEY TO WORD (.DOCX)
 */
const QUESTION_TYPE_VN: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm 4 lựa chọn',
  true_false: 'Trắc nghiệm Đúng/Sai (4 ý)',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận',
};

export async function exportExamWithMatrixToWord(exam: Exam, answerKey?: ExamAnswerKey) {
  const matrixRows = exam.matrixRows || [];
  const questions = exam.questionsSanitized || [];

  const borderConfig = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
  };

  const makeCell = (text: string, bold = false) =>
    new TableCell({
      borders: borderConfig,
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        }),
      ],
    });

  // Table 1: Matrix & Specification Table
  const matrixTableRows: TableRow[] = [
    new TableRow({
      children: [
        makeCell('TT', true),
        makeCell('Chủ đề / Chương', true),
        makeCell('Nội dung / Đơn vị kiến thức', true),
        makeCell('Bản đặc tả yêu cầu cần đạt', true),
        makeCell('Mức độ nhận thức', true),
        makeCell('Dạng thức câu hỏi', true),
        makeCell('Số câu', true),
        makeCell('Tổng điểm', true),
        makeCell('Tỷ lệ %', true),
      ],
    }),
    ...matrixRows.map(
      (r, idx) =>
        new TableRow({
          children: [
            makeCell(String(idx + 1)),
            makeCell(r.topic || ''),
            makeCell(r.knowledgeUnit || ''),
            makeCell(
              r.specification ||
                `${r.cognitiveLevel}: Đánh giá năng lực Tin học chủ đề ${r.knowledgeUnit || r.topic}`
            ),
            makeCell(r.cognitiveLevel),
            makeCell(QUESTION_TYPE_VN[r.questionType] || r.questionType),
            makeCell(String(r.questionCount)),
            makeCell(String(r.totalPoints)),
            makeCell(`${r.percentage}%`),
          ],
        })
    ),
  ];

  // Question paragraphs grouped by PHẦN I, PHẦN II, PHẦN III
  const questionParagraphs: Paragraph[] = [];
  const mcQuestions = questions.filter((q) => q.questionType === 'multiple_choice');
  const tfQuestions = questions.filter((q) => q.questionType === 'true_false');
  const saQuestions = questions.filter((q) => q.questionType === 'short_answer');
  const essayQuestions = questions.filter((q) => q.questionType === 'essay');

  const levelShortCode: Record<CognitiveLevel, string> = {
    'Nhận biết': 'NB',
    'Thông hiểu': 'TH',
    'Vận dụng': 'VD',
    'Vận dụng cao': 'VDC',
  };

  if (mcQuestions.length > 0) {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: 'PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN',
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      })
    );
    mcQuestions.forEach((q, idx) => {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `Câu ${idx + 1} [${levelShortCode[q.cognitiveLevel]}]. `,
              bold: true,
              size: 24,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: q.content,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      );
      if (q.codeSnippet) {
        q.codeSnippet.split('\n').forEach((cLine) => {
          questionParagraphs.push(
            new Paragraph({
              indent: { left: 400 },
              children: [new TextRun({ text: cLine, font: 'Courier New', size: 20 })],
            })
          );
        });
      }
      (q.options || []).forEach((opt, oIdx) => {
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({
                text: `${['A', 'B', 'C', 'D'][oIdx]}. `,
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: opt,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      });
    });
  }

  if (tfQuestions.length > 0) {
    const tfTotalPts =
      Math.round(tfQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0) * 100) / 100;
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({
            text: `PHẦN II. TRẮC NGHIỆM ĐÚNG / SAI (${tfTotalPts} điểm)`,
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: 'Câu hỏi có 4 ý a, b, c, d , thí sinh chọn Đúng hoặc Sai.',
            italics: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      })
    );
    tfQuestions.forEach((q, idx) => {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `Câu ${idx + 1}. `,
              bold: true,
              size: 24,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: q.content,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      );
      (q.subItems || []).forEach((sub, sIdx) => {
        const subLv = sub.cognitiveLevel ? `[${sIdx + 1}.${levelShortCode[sub.cognitiveLevel]}] ` : '';
        questionParagraphs.push(
          new Paragraph({
            indent: { left: 360 },
            children: [
              new TextRun({
                text: `${sub.id}) ${subLv}`,
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `${sub.text}   [ Đúng / Sai ]`,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          })
        );
      });
    });
  }

  if (saQuestions.length > 0) {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: 'PHẦN III. Câu trắc nghiệm trả lời ngắn.',
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      })
    );
    saQuestions.forEach((q, idx) => {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: `Câu ${idx + 1}: `,
              bold: true,
              size: 24,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: q.content,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: '.nội dung trả lời:........................',
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  if (essayQuestions.length > 0) {
    questionParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: 'PHẦN IV. TỰ LUẬN',
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      })
    );
    essayQuestions.forEach((q, idx) => {
      questionParagraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: `Câu ${idx + 1} (${q.points} điểm): `,
              bold: true,
              size: 24,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: q.content,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  // Answer Key section
  const answerParagraphs: Paragraph[] = [];
  if (answerKey) {
    questions.forEach((q, idx) => {
      const ans = answerKey.answersMap?.[q.id] || '';
      const exp = answerKey.explanationsMap?.[q.id] || '';
      answerParagraphs.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({
              text: `Câu ${idx + 1} (${q.code}): `,
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
            new TextRun({
              text: `Đáp án: ${ans}`,
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
            exp
              ? new TextRun({
                  text: ` — Giải thích / Hướng dẫn chấm: ${exp}`,
                  size: 22,
                  font: 'Times New Roman',
                })
              : new TextRun({ text: '' }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐỒNG NAI — TRƯỜNG THPT THANH HÒA',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `HỒ SƠ MA TRẬN, BẢN ĐẶC TẢ VÀ ĐỀ KIỂM TRA: ${exam.title.toUpperCase()}`,
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: `Môn: Tin học - Khối ${exam.grade} | Mã đề: ${exam.code} | Thời gian: ${exam.durationMinutes} phút | GV: Nguyễn Tiến Dương`,
                italics: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: 'PHẦN I. KHUNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: matrixTableRows,
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: 'PHẦN II. ĐỀ KIỂM TRA CHÍNH THỨC',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          ...questionParagraphs,
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: 'PHẦN III. ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT',
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),
          ...answerParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ho_So_De_Va_Ma_Tran_${exam.code}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
