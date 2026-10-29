import {
  Assignment,
  ClassRoom,
  Exam,
  ExamAnswerKey,
  LearningPlan,
  LearningResource,
  Question,
  SanitizedQuestion,
  Student,
  Submission,
  SystemSetting,
} from '../types';

export const DEFAULT_SYSTEM_SETTINGS: SystemSetting = {
  id: 'default_settings',
  websiteName: 'Tin học THPT Thanh Hòa',
  schoolName: 'Trường THPT Thanh Hòa',
  address: 'Xã Thiện Hưng - TP. Đồng Nai',
  teacherName: 'Nguyễn Tiến Dương',
  subjectName: 'Tin học',
  academicYear: '2026 - 2027',
  gradingScale: 10,
  defaultDurationMinutes: 45,
  defaultReleaseMode: 'immediate',
  language: 'Tiếng Việt',
  timezone: 'Asia/Ho_Chi_Minh',
  dateFormat: 'dd/MM/yyyy',
  fontFamily: 'Times New Roman',
  ownerId: 'system_default',
  createdAt: '2026-09-05T07:00:00.000Z',
  updatedAt: '2026-10-23T08:00:00.000Z',
};

export function createDemoClasses(ownerId: string): ClassRoom[] {
  const now = '2026-09-05T07:30:00.000Z';
  return [
    {
      id: 'demo_class_10A1',
      code: 'DEMO-10A1',
      name: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      academicYear: '2026 - 2027',
      homeroomTeacher: 'Nguyễn Tiến Dương',
      studentCount: 3,
      description: 'Lớp Tin học 10 định hướng Khoa học máy tính (Dữ liệu mẫu trình diễn)',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_class_11A1',
      code: 'DEMO-11A1',
      name: '11A1 [DỮ LIỆU DEMO]',
      grade: '11',
      academicYear: '2026 - 2027',
      homeroomTeacher: 'Trần Thị Minh',
      studentCount: 2,
      description: 'Lớp Tin học 11 - Cơ sở dữ liệu & Lập trình Python (Dữ liệu mẫu trình diễn)',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_class_12A1',
      code: 'DEMO-12A1',
      name: '12A1 [DỮ LIỆU DEMO]',
      grade: '12',
      academicYear: '2026 - 2027',
      homeroomTeacher: 'Lê Hoàng Nam',
      studentCount: 2,
      description: 'Lớp Ôn thi Tốt nghiệp THPT môn Tin học 12 (Dữ liệu mẫu trình diễn)',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createDemoStudents(ownerId: string): Student[] {
  const now = '2026-09-06T08:00:00.000Z';
  return [
    {
      id: 'demo_hs_1001',
      studentCode: 'DEMO-HS1001',
      fullName: 'Nguyễn Minh An (DEMO)',
      birthDate: '12/05/2011',
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      accountStatus: 'active',
      loginCode: 'hs1001',
      studentUid: ownerId,
      avgScore: 8.75,
      completedExamsCount: 2,
      weakTopics: 'Biểu diễn thông tin nhị phân',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_hs_1002',
      studentCode: 'DEMO-HS1002',
      fullName: 'Trần Gia Bảo (DEMO)',
      birthDate: '24/08/2011',
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      accountStatus: 'active',
      loginCode: 'hs1002',
      studentUid: ownerId,
      avgScore: 7.25,
      completedExamsCount: 2,
      weakTopics: 'Vòng lặp for và while trong Python',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_hs_1003',
      studentCode: 'DEMO-HS1003',
      fullName: 'Lê Ngọc Châu (DEMO)',
      birthDate: '03/11/2011',
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      accountStatus: 'active',
      loginCode: 'hs1003',
      studentUid: ownerId,
      avgScore: 9.25,
      completedExamsCount: 2,
      weakTopics: 'Chưa phát hiện nội dung yếu',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_hs_1101',
      studentCode: 'DEMO-HS1101',
      fullName: 'Phạm Quốc Đạt (DEMO)',
      birthDate: '19/02/2010',
      classId: 'demo_class_11A1',
      className: '11A1 [DỮ LIỆU DEMO]',
      grade: '11',
      accountStatus: 'active',
      loginCode: 'hs1101',
      studentUid: ownerId,
      avgScore: 8.0,
      completedExamsCount: 1,
      weakTopics: 'Truy vấn SQL JOIN nhiều bảng',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_hs_1102',
      studentCode: 'DEMO-HS1102',
      fullName: 'Võ Thị Hà Vy (DEMO)',
      birthDate: '28/07/2010',
      classId: 'demo_class_11A1',
      className: '11A1 [DỮ LIỆU DEMO]',
      grade: '11',
      accountStatus: 'active',
      loginCode: 'hs1102',
      studentUid: ownerId,
      avgScore: 6.5,
      completedExamsCount: 1,
      weakTopics: 'Độ phức tạp thuật toán tìm kiếm nhị phân',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_hs_1201',
      studentCode: 'DEMO-HS1201',
      fullName: 'Đặng Hoàng Khôi (DEMO)',
      birthDate: '15/01/2009',
      classId: 'demo_class_12A1',
      className: '12A1 [DỮ LIỆU DEMO]',
      grade: '12',
      accountStatus: 'active',
      loginCode: 'hs1201',
      studentUid: ownerId,
      avgScore: 9.0,
      completedExamsCount: 1,
      weakTopics: 'CSS Flexbox và Box Model',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_hs_1202',
      studentCode: 'DEMO-HS1202',
      fullName: 'Bùi Thanh Thảo (DEMO)',
      birthDate: '09/09/2009',
      classId: 'demo_class_12A1',
      className: '12A1 [DỮ LIỆU DEMO]',
      grade: '12',
      accountStatus: 'active',
      loginCode: 'hs1202',
      studentUid: ownerId,
      avgScore: 7.75,
      completedExamsCount: 1,
      weakTopics: 'Giao thức mạng TCP/IP và định tuyến',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createDemoQuestions(ownerId: string): Question[] {
  const now = '2026-09-10T09:00:00.000Z';
  return [
    {
      id: 'demo_q_10_1',
      code: 'DEMO-TH10-001',
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 1: Máy tính và xã hội tri thức',
      lesson: 'Bài 2: Sự ưu việt của máy tính và những thành tựu của Tin học',
      knowledgeUnit: 'Đơn vị đo dung lượng thông tin',
      cognitiveLevel: 'Nhận biết',
      questionType: 'multiple_choice',
      content: 'Trong hệ thống đơn vị đo lượng thông tin số, 1 Gigabyte (GB) bằng bao nhiêu Megabyte (MB) theo chuẩn nhị phân truyền thống?',
      options: ['1000 MB', '1024 MB', '512 MB', '2048 MB'],
      correctAnswer: 'B',
      explanation: 'Theo hệ nhị phân cơ số 2, 1 GB = 2^10 MB = 1024 MB.',
      points: 2.0,
      tags: ['Tin học 10', 'Dữ liệu', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_10_2',
      code: 'DEMO-TH10-002',
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 19: Câu lệnh lặp for trong Python',
      knowledgeUnit: 'Vòng lặp for và hàm range()',
      cognitiveLevel: 'Thông hiểu',
      questionType: 'multiple_choice',
      content: 'Cho đoạn chương trình Python sau. Kết quả in ra màn hình sau khi thực hiện đoạn lệnh là bao nhiêu?',
      codeSnippet: `s = 0\nfor i in range(1, 6):\n    if i % 2 == 1:\n        s = s + i\nprint(s)`,
      options: ['6', '9', '15', '10'],
      correctAnswer: 'B',
      explanation: 'range(1, 6) tạo dãy 1, 2, 3, 4, 5. Các số lẻ (i % 2 == 1) là 1, 3, 5. Tổng s = 1 + 3 + 5 = 9.',
      points: 2.0,
      tags: ['Python', 'Vòng lặp', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_10_3',
      code: 'DEMO-TH10-003',
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 22: Kiểu dữ liệu danh sách (list)',
      knowledgeUnit: 'Thao tác trên danh sách Python',
      cognitiveLevel: 'Vận dụng',
      questionType: 'true_false',
      content: 'Cho danh sách A = [10, 25, 30, 45, 50] trong ngôn ngữ lập trình Python. Xét tính Đúng/Sai của các phát biểu sau:',
      subItems: [
        { id: 'a', text: 'Giá trị của phần tử A[0] là 10.', isTrue: true, cognitiveLevel: 'Nhận biết' },
        { id: 'b', text: 'Lệnh len(A) trả về giá trị bằng 4.', isTrue: false, cognitiveLevel: 'Thông hiểu' },
        { id: 'c', text: 'Sau khi thực hiện lệnh A.append(60), danh sách A có 6 phần tử.', isTrue: true, cognitiveLevel: 'Vận dụng' },
        { id: 'd', text: 'Chỉ số của phần tử cuối cùng trong danh sách A có thể truy cập bằng A[-1].', isTrue: true, cognitiveLevel: 'Vận dụng cao' },
      ],
      correctAnswer: 'a:Đ,b:S,c:Đ,d:Đ',
      explanation: 'a) Đúng vì chỉ số bắt đầu từ 0. b) Sai vì len(A) = 5. c) Đúng vì append thêm 1 phần tử vào cuối. d) Đúng vì A[-1] truy cập phần tử cuối.',
      points: 4.0,
      tags: ['Python', 'List', 'Đúng/Sai', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_10_4',
      code: 'DEMO-TH10-004',
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 24: Xâu kí tự trong Python',
      knowledgeUnit: 'Hàm và phương thức xử lý xâu',
      cognitiveLevel: 'Vận dụng cao',
      questionType: 'essay',
      content: 'Viết hàm Python `dem_nguyen_am(s)` nhận vào một xâu kí tự `s` và trả về số lượng nguyên âm tiếng Anh (a, e, i, o, u không phân biệt hoa thường) xuất hiện trong xâu `s`. Cho ví dụ minh họa.',
      correctAnswer: 'def dem_nguyen_am(s): return sum(1 for ch in s.lower() if ch in "aeiou")',
      explanation: 'Duyệt từng kí tự trong xâu đã chuyển về chữ thường s.lower() và kiểm tra thuộc tập nguyên âm "aeiou".',
      gradingGuide: '- Viết đúng cú pháp định nghĩa hàm def dem_nguyen_am(s): 0.5 điểm.\n- Xử lý không phân biệt chữ hoa/thường bằng .lower(): 0.5 điểm.\n- Đếm đúng các nguyên âm a, e, i, o, u và trả về kết quả: 1.0 điểm.',
      points: 2.0,
      tags: ['Python', 'Hàm', 'Tự luận', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_10_5',
      code: 'DEMO-TH10-005',
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 22: Kiểu dữ liệu danh sách (list)',
      knowledgeUnit: 'Phương thức danh sách Python',
      cognitiveLevel: 'Vận dụng',
      questionType: 'multiple_choice',
      content: 'Để thêm phần tử số 100 vào vị trí cuối cùng của danh sách L trong ngôn ngữ lập trình Python, ta sử dụng câu lệnh nào sau đây?',
      options: ['L.append(100)', 'L.insert(0, 100)', 'L.pop(100)', 'L.remove(100)'],
      correctAnswer: 'A',
      explanation: 'Phương thức append(x) dùng để thêm phần tử x vào cuối danh sách.',
      points: 0.25,
      tags: ['Python', 'List', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_10_6',
      code: 'DEMO-TH10-006',
      grade: '10',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 16: Ngôn ngữ lập trình bậc cao và Python',
      knowledgeUnit: 'Các phép toán số học trong Python',
      cognitiveLevel: 'Vận dụng',
      questionType: 'short_answer',
      content: 'Trong ngôn ngữ lập trình Python, biểu thức `29 // 5 + 29 % 5` có giá trị kết quả bằng bao nhiêu?',
      correctAnswer: '9',
      explanation: '29 // 5 = 5 (chia lấy phần nguyên) và 29 % 5 = 4 (chia lấy phần dư). Tổng 5 + 4 = 9.',
      points: 0.5,
      tags: ['Python', 'Trả lời ngắn', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_11_1',
      code: 'DEMO-TH11-001',
      grade: '11',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 6: Thực hành tạo và khai thác cơ sở dữ liệu',
      lesson: 'Bài 20: Thực hành tạo lập cơ sở dữ liệu và các bảng',
      knowledgeUnit: 'Ngôn ngữ truy vấn SQL',
      cognitiveLevel: 'Thông hiểu',
      questionType: 'short_answer',
      content: 'Trong ngôn ngữ truy vấn SQL, từ khóa nào được sử dụng kết hợp với câu lệnh SELECT để loại bỏ các dòng dữ liệu trùng lặp trong tập kết quả?',
      correctAnswer: 'DISTINCT',
      explanation: 'Từ khóa SELECT DISTINCT dùng để chỉ trả về các giá trị khác biệt (không trùng lặp).',
      points: 2.0,
      tags: ['Tin học 11', 'SQL', 'CSDL', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_q_12_1',
      code: 'DEMO-TH12-001',
      grade: '12',
      textbook: 'Kết nối tri thức với cuộc sống',
      topic: 'Chủ đề 1: Máy tính và xã hội tri thức (Trí tuệ nhân tạo)',
      lesson: 'Bài 1: Giới thiệu về Trí tuệ nhân tạo',
      knowledgeUnit: 'Khái niệm và ứng dụng AI',
      cognitiveLevel: 'Nhận biết',
      questionType: 'multiple_choice',
      content: 'Phương pháp kiểm thử nào do nhà toán học Alan Turing đề xuất năm 1950 nhằm đánh giá khả năng suy nghĩ và giao tiếp giống con người của một hệ thống máy tính?',
      options: ['Kiểm thử hộp đen (Black-box Test)', 'Phép thử Turing (Turing Test)', 'Kiểm thử đơn vị (Unit Test)', 'Thuật toán Dijkstra'],
      correctAnswer: 'B',
      explanation: 'Năm 1950, Alan Turing đề xuất Phép thử Turing (Turing Test) để đánh giá trí thông minh của máy tính.',
      points: 2.0,
      tags: ['Tin học 12', 'AI', 'DEMO'],
      isApproved: true,
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function sanitizeQuestionsForStudent(questions: Question[]): SanitizedQuestion[] {
  return questions.map((q) => {
    const item: SanitizedQuestion = {
      id: q.id,
      code: q.code,
      topic: q.topic,
      cognitiveLevel: q.cognitiveLevel,
      questionType: q.questionType,
      content: q.content,
      points: Number(q.points) || 0.25,
    };
    if (q.codeSnippet) item.codeSnippet = q.codeSnippet;
    if (q.imageUrl) item.imageUrl = q.imageUrl;
    if (q.options && q.options.length > 0) item.options = [...q.options];
    if (q.subItems && q.subItems.length > 0) {
      item.subItems = q.subItems.map((sub) => {
        const s: { id: string; text: string; cognitiveLevel?: typeof q.cognitiveLevel } = {
          id: sub.id,
          text: sub.text,
        };
        if (sub.cognitiveLevel) s.cognitiveLevel = sub.cognitiveLevel;
        return s;
      });
    }
    return item;
  });
}

export function buildAnswerKeyFromQuestions(
  examId: string,
  questions: Question[],
  ownerId: string
): ExamAnswerKey {
  const answersMap: Record<string, string> = {};
  const explanationsMap: Record<string, string> = {};
  for (const q of questions) {
    if (q.questionType === 'true_false' && q.subItems) {
      answersMap[q.id] = q.subItems
        .map((s) => `${s.id}:${s.isTrue ? 'Đ' : 'S'}`)
        .join(',');
    } else {
      answersMap[q.id] = q.correctAnswer || '';
    }
    explanationsMap[q.id] =
      q.questionType === 'essay'
        ? `${q.explanation || ''}\nHướng dẫn chấm: ${q.gradingGuide || ''}`.trim()
        : q.explanation || '';
  }
  const now = new Date().toISOString();
  return {
    examId,
    answersMap,
    explanationsMap,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDemoExams(ownerId: string, demoQuestions: Question[]): {
  exams: Exam[];
  answerKeys: ExamAnswerKey[];
} {
  const now = '2026-10-01T08:00:00.000Z';
  const g10Questions = demoQuestions.filter((q) => q.grade === '10').slice(0, 4);
  const sanitizedG10 = sanitizeQuestionsForStudent(g10Questions);
  const examId = 'demo_exam_10_gk1';

  const exam: Exam = {
    id: examId,
    code: 'DEMO-DE10-GK1',
    title: 'Đề Kiểm tra Giữa kỳ I - Tin học 10 (Python & Dữ liệu) [DEMO]',
    category: 'Kiểm tra giữa kỳ',
    grade: '10',
    topic: 'Biểu diễn dữ liệu & Lập trình Python cơ bản',
    durationMinutes: 45,
    totalPoints: 10,
    status: 'open',
    matrixRows: [
      {
        id: 'm1',
        topic: 'Chủ đề 1: Máy tính và xã hội tri thức',
        knowledgeUnit: 'Đơn vị đo dung lượng thông tin',
        cognitiveLevel: 'Nhận biết',
        questionType: 'multiple_choice',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
        percentage: 20,
      },
      {
        id: 'm2',
        topic: 'Chủ đề 5: Giải quyết vấn đề với máy tính',
        knowledgeUnit: 'Vòng lặp for và hàm range()',
        cognitiveLevel: 'Thông hiểu',
        questionType: 'multiple_choice',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
        percentage: 20,
      },
      {
        id: 'm3',
        topic: 'Chủ đề 5: Giải quyết vấn đề với máy tính',
        knowledgeUnit: 'Thao tác trên danh sách Python',
        cognitiveLevel: 'Vận dụng',
        questionType: 'true_false',
        questionCount: 1,
        pointsPerQuestion: 4.0,
        totalPoints: 4.0,
        percentage: 40,
      },
      {
        id: 'm4',
        topic: 'Chủ đề 5: Giải quyết vấn đề với máy tính',
        knowledgeUnit: 'Hàm và xử lý xâu kí tự',
        cognitiveLevel: 'Vận dụng cao',
        questionType: 'essay',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
        percentage: 20,
      },
    ],
    questionsSanitized: sanitizedG10,
    questionCount: sanitizedG10.length,
    isDemo: true,
    ownerId,
    createdAt: now,
    updatedAt: now,
  };

  const key = buildAnswerKeyFromQuestions(examId, g10Questions, ownerId);
  return { exams: [exam], answerKeys: [key] };
}

export function createDemoAssignments(ownerId: string, demoExams: Exam[]): Assignment[] {
  const exam = demoExams[0];
  if (!exam) return [];
  return [
    {
      id: 'demo_assign_10A1_gk1',
      examId: exam.id,
      examTitle: exam.title,
      examCategory: exam.category,
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      startTime: '2026-10-15T07:00',
      dueTime: '2026-12-31T23:59',
      durationMinutes: 45,
      maxAttempts: 2,
      resultReleaseMode: 'immediate',
      showAnswersAfterSubmit: true,
      status: 'open',
      questionsSnapshot: exam.questionsSanitized,
      isDemo: true,
      ownerId,
      createdAt: '2026-10-15T07:00:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
    },
  ];
}

export function createDemoSubmissions(ownerId: string): Submission[] {
  return [
    {
      id: 'demo_sub_1001',
      assignmentId: 'demo_assign_10A1_gk1',
      examId: 'demo_exam_10_gk1',
      examTitle: 'Đề Kiểm tra Giữa kỳ I - Tin học 10 (Python & Dữ liệu) [DEMO]',
      studentId: 'demo_hs_1001',
      studentCode: 'DEMO-HS1001',
      studentName: 'Nguyễn Minh An (DEMO)',
      studentUid: ownerId,
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      attemptNumber: 1,
      startedAt: '2026-10-20T08:00:00.000Z',
      submittedAt: '2026-10-20T08:32:00.000Z',
      status: 'Đã chấm',
      gradingStatus: 'graded',
      answersMap: {
        demo_q_10_1: 'B',
        demo_q_10_2: 'B',
        demo_q_10_3: 'a:Đ,b:S,c:Đ,d:Đ',
        demo_q_10_4: 'def dem_nguyen_am(s):\n    dem = 0\n    for c in s.lower():\n        if c in "aeiou":\n            dem += 1\n    return dem',
      },
      objectiveScore: 8.0,
      essayScore: 1.75,
      totalScore: 9.75,
      teacherFeedback: 'Bài làm nắm vững kiến thức danh sách và vòng lặp Python. Trình bày hàm rõ ràng.',
      gradeHistory: [
        {
          timestamp: '2026-10-20T09:15:00.000Z',
          actorName: 'Nguyễn Tiến Dương',
          previousScore: 8.0,
          newScore: 9.75,
          reason: 'Chấm điểm câu tự luận số 4 (+1.75 điểm)',
        },
      ],
      isDemo: true,
      ownerId,
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T09:15:00.000Z',
    },
    {
      id: 'demo_sub_1002',
      assignmentId: 'demo_assign_10A1_gk1',
      examId: 'demo_exam_10_gk1',
      examTitle: 'Đề Kiểm tra Giữa kỳ I - Tin học 10 (Python & Dữ liệu) [DEMO]',
      studentId: 'demo_hs_1002',
      studentCode: 'DEMO-HS1002',
      studentName: 'Trần Gia Bảo (DEMO)',
      studentUid: ownerId,
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      grade: '10',
      attemptNumber: 1,
      startedAt: '2026-10-21T14:00:00.000Z',
      submittedAt: '2026-10-21T14:38:00.000Z',
      status: 'Chờ chấm',
      gradingStatus: 'waiting_essay',
      answersMap: {
        demo_q_10_1: 'B',
        demo_q_10_2: 'A',
        demo_q_10_3: 'a:Đ,b:S,c:Đ,d:S',
        demo_q_10_4: 'def dem_nguyen_am(s):\n    count = 0\n    for x in s:\n        if x in "aeiou": count += 1\n    return count',
      },
      objectiveScore: 5.0,
      essayScore: 0,
      totalScore: 5.0,
      teacherFeedback: '',
      gradeHistory: [],
      isDemo: true,
      ownerId,
      createdAt: '2026-10-21T14:00:00.000Z',
      updatedAt: '2026-10-21T14:38:00.000Z',
    },
  ];
}

export function createDemoLearningPlans(ownerId: string): LearningPlan[] {
  const now = '2026-10-10T08:00:00.000Z';
  return [
    {
      id: 'demo_plan_10_python',
      title: 'Kế hoạch Ôn tập Giữa kỳ I - Lập trình Python Cơ bản [DEMO]',
      grade: '10',
      topic: 'Chủ đề 5: Giải quyết vấn đề với sự trợ giúp của máy tính',
      lesson: 'Bài 19 - Bài 24: Câu lệnh lặp, Danh sách và Xâu kí tự',
      objective: 'Củng cố kỹ năng đọc hiểu vòng lặp for/while, thao tác list và viết hàm xử lý xâu kí tự.',
      mode: 'Luyện tập',
      classId: 'demo_class_10A1',
      className: '10A1 [DỮ LIỆU DEMO]',
      dueDate: '2026-11-15',
      questionIds: ['demo_q_10_1', 'demo_q_10_2', 'demo_q_10_3'],
      completedCount: 2,
      totalStudents: 3,
      status: 'active',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_plan_12_tn',
      title: 'Chuyên đề Luyện thi Tốt nghiệp THPT: Trí tuệ nhân tạo & Mạng máy tính [DEMO]',
      grade: '12',
      topic: 'Chủ đề A & B: Máy tính và xã hội tri thức, Mạng máy tính',
      lesson: 'Tổng ôn câu hỏi trắc nghiệm nhiều lựa chọn và Đúng/Sai',
      objective: 'Đạt tối thiểu 8.0 điểm phần câu hỏi nhận biết và thông hiểu trong cấu trúc đề thi tốt nghiệp mới.',
      mode: 'Kiểm tra',
      classId: 'demo_class_12A1',
      className: '12A1 [DỮ LIỆU DEMO]',
      dueDate: '2026-11-30',
      questionIds: ['demo_q_12_1'],
      completedCount: 1,
      totalStudents: 2,
      status: 'active',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createDemoResources(ownerId: string): LearningResource[] {
  const now = '2026-09-12T08:00:00.000Z';
  return [
    {
      id: 'demo_res_1',
      title: 'Đề cương Ôn tập Tin học 10 - Học kỳ I (Kết nối tri thức) [DEMO]',
      category: 'Tệp PDF',
      grade: '10',
      topic: 'Tổng hợp Chủ đề 1 đến Chủ đề 5',
      description: 'Tóm tắt lý thuyết trọng tâm, bảng mã nhị phân và 50 bài tập Python có hướng dẫn giải.',
      resourceType: 'document',
      externalUrl: 'https://hanhtrangso.nxbgd.vn',
      fileStatus: 'Đã gắn liên kết tài liệu trực tuyến (Chưa tích hợp máy chủ lưu trữ tệp vật lý)',
      accessLevel: 'public_students',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_res_2',
      title: 'Tài liệu Thực hành Truy vấn SQL Cơ sở dữ liệu Quan hệ - Tin học 11 [DEMO]',
      category: 'Tài liệu thực hành',
      grade: '11',
      topic: 'Chủ đề 6: Thực hành tạo và khai thác CSDL',
      description: 'Hướng dẫn cài đặt HeidiSQL / SQLite và các bài tập truy vấn SELECT, WHERE, JOIN, GROUP BY.',
      resourceType: 'document',
      externalUrl: 'https://www.sqlite.org/index.html',
      fileStatus: 'Liên kết tài nguyên thực hành trực tuyến',
      accessLevel: 'public_students',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo_res_3',
      title: 'Hướng dẫn sử dụng Hệ thống Kiểm tra Trực tuyến Tin học THPT Thanh Hòa',
      category: 'Hướng dẫn sử dụng',
      grade: 'ALL',
      topic: 'Hướng dẫn dành cho Giáo viên và Học sinh',
      description: 'Quy trình đăng nhập, nhận đề kiểm tra, lưu bài tự động, nộp bài và xem báo cáo kết quả học tập.',
      resourceType: 'guide',
      externalUrl: '#huong-dan',
      fileStatus: 'Tài liệu hướng dẫn nội bộ trên hệ thống',
      accessLevel: 'public_students',
      isDemo: true,
      ownerId,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export const SAMPLE_STUDENT_CSV_TEMPLATE = `MaHocSinh,HoVaTen,NgaySinh,MaLop,Khoi,MaDangNhap
HS10A1-01,Nguyễn Văn An,15/04/2011,10A1,10,hs10a101
HS10A1-02,Trần Thị Bích Ngọc,22/09/2011,10A1,10,hs10a102
HS11A1-01,Lê Minh Khang,08/11/2010,11A1,11,hs11a101`;

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function gradeObjectiveSubmission(
  questions: SanitizedQuestion[],
  answersMap: Record<string, string>,
  secretKeyMap: Record<string, string>
): {
  objectiveScore: number;
  hasEssay: boolean;
  perQuestionEarned: Record<string, number>;
} {
  let objectiveScore = 0;
  let hasEssay = false;
  const perQuestionEarned: Record<string, number> = {};

  for (const q of questions) {
    if (q.questionType === 'essay') {
      hasEssay = true;
      perQuestionEarned[q.id] = 0;
      continue;
    }

    const rawStudentAns = (answersMap[q.id] || '').trim();
    const rawKey = (secretKeyMap[q.id] || '').trim();

    if (!rawKey) {
      perQuestionEarned[q.id] = 0;
      continue;
    }

    if (q.questionType === 'multiple_choice' || q.questionType === 'short_answer') {
      const isCorrect = rawStudentAns.toLowerCase() === rawKey.toLowerCase();
      const earned = isCorrect ? Number(q.points) || 0 : 0;
      perQuestionEarned[q.id] = earned;
      objectiveScore += earned;
    } else if (q.questionType === 'true_false') {
      // Format: "a:Đ,b:S,c:Đ,d:Đ"
      const parsePairs = (str: string) => {
        const map: Record<string, string> = {};
        str.split(',').forEach((part) => {
          const [k, v] = part.split(':').map((s) => s.trim());
          if (k && v) map[k.toLowerCase()] = v.toUpperCase();
        });
        return map;
      };
      const studentPairs = parsePairs(rawStudentAns);
      const keyPairs = parsePairs(rawKey);
      const keys = Object.keys(keyPairs);
      if (keys.length === 0) {
        perQuestionEarned[q.id] = 0;
        continue;
      }
      let correctCount = 0;
      keys.forEach((k) => {
        if (studentPairs[k] && studentPairs[k] === keyPairs[k]) {
          correctCount += 1;
        }
      });
      // Standard Vietnamese THPT 2025/2026 True/False grading scale when 4 items:
      // 1 item: 10%, 2 items: 25%, 3 items: 50%, 4 items: 100% of question points
      let ratio = correctCount / keys.length;
      if (keys.length === 4) {
        if (correctCount === 0) ratio = 0;
        else if (correctCount === 1) ratio = 0.1;
        else if (correctCount === 2) ratio = 0.25;
        else if (correctCount === 3) ratio = 0.5;
        else ratio = 1.0;
      }
      const earned = Math.round((Number(q.points) || 0) * ratio * 100) / 100;
      perQuestionEarned[q.id] = earned;
      objectiveScore += earned;
    }
  }

  return {
    objectiveScore: Math.round(objectiveScore * 100) / 100,
    hasEssay,
    perQuestionEarned,
  };
}
