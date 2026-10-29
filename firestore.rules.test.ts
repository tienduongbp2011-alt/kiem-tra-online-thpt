/**
 * Firestore Security Rules Test Suite (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unverified Admin Email Spoof on Question Bank',
    collection: 'question_bank',
    docId: 'q_spoof_1',
    operation: 'create',
    auth: { uid: 'attacker_1', email: 'tienduongbp2011@gmail.com', email_verified: false },
    payload: {
      code: 'TH10-01',
      grade: '10',
      textbook: 'Kết nối tri thức',
      topic: 'Chủ đề 1',
      cognitiveLevel: 'Nhận biết',
      questionType: 'multiple_choice',
      content: 'Câu hỏi test',
      points: 0.25,
      isApproved: true,
      isDemo: false,
      ownerId: 'attacker_1',
      createdAt: '2026-10-23T08:00:00.000Z',
      updatedAt: '2026-10-23T08:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Self-Assigned Admin Role on User Profile Creation',
    collection: 'users',
    docId: 'student_uid_1',
    operation: 'create',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    payload: {
      uid: 'student_uid_1',
      displayName: 'Nguyễn Văn A',
      role: 'admin',
      status: 'active',
      createdAt: '2026-10-23T08:00:00.000Z',
      updatedAt: '2026-10-23T08:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Class Creation',
    collection: 'classes',
    docId: 'class_10A1',
    operation: 'create',
    auth: { uid: 'teacher_uid', email: 'tienduongbp2011@gmail.com', email_verified: true },
    payload: {
      code: '10A1',
      name: 'Lớp 10A1',
      grade: '10',
      academicYear: '2026-2027',
      studentCount: 40,
      isDemo: false,
      ownerId: 'teacher_uid',
      createdAt: '2026-10-23T08:00:00.000Z',
      updatedAt: '2026-10-23T08:00:00.000Z',
      ghostField: 'injected',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Student Reading Confidential Answer Key',
    collection: 'exam_answer_keys',
    docId: 'exam_1',
    operation: 'get',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Student Reading Another Student Submission',
    collection: 'submissions',
    docId: 'sub_student_2',
    operation: 'get',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Student Modifying Submitted Exam Answers (Terminal State Lock)',
    collection: 'submissions',
    docId: 'sub_student_1',
    operation: 'update',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    payload: {
      answersMap: { q1: 'A' },
      updatedAt: '2026-10-23T09:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Student Self-Grading Attack During Exam',
    collection: 'submissions',
    docId: 'sub_student_1',
    operation: 'update',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    payload: {
      totalScore: 10,
      objectiveScore: 10,
      updatedAt: '2026-10-23T09:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'ID Poisoning Attack with Invalid Characters',
    collection: 'classes',
    docId: 'invalid id with spaces and $!',
    operation: 'create',
    auth: { uid: 'teacher_uid', email: 'tienduongbp2011@gmail.com', email_verified: true },
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Value Poisoning Over-Length Title on Exam',
    collection: 'exams',
    docId: 'exam_1',
    operation: 'update',
    auth: { uid: 'teacher_uid', email: 'tienduongbp2011@gmail.com', email_verified: true },
    payload: {
      title: 'A'.repeat(1000),
      updatedAt: '2026-10-23T09:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Identity Spoofing on Submission Creation',
    collection: 'submissions',
    docId: 'sub_spoof',
    operation: 'create',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    payload: {
      studentUid: 'student_uid_2',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Immutable Field Mutation on Exam Update',
    collection: 'exams',
    docId: 'exam_1',
    operation: 'update',
    auth: { uid: 'teacher_uid', email: 'tienduongbp2011@gmail.com', email_verified: true },
    payload: {
      createdAt: '2099-01-01T00:00:00.000Z',
      ownerId: 'someone_else',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Blanket Unfiltered List Scraping on Question Bank by Student',
    collection: 'question_bank',
    docId: '*',
    operation: 'list',
    auth: { uid: 'student_uid_1', email: 'hs1@thanhhoa.edu.vn', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];
