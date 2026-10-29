# Security Specification - TIN HỌC THPT THANH HÒA

## 1. Data Invariants

1. **Identity & Email Verification**: All standard write operations require an authenticated user with `request.auth.token.email_verified == true`.
2. **Role & Privilege Isolation**: Only the verified teacher (`tienduongbp2011@gmail.com` with `email_verified == true`) or a document in `/admins/{uid}` has administrative/teacher privileges. Standard users creating a `/users/{userId}` profile can only assign `role == 'student'` and `uid == request.auth.uid`.
3. **Confidential Answer Key Isolation**: `/question_bank/{questionId}` and `/exam_answer_keys/{examId}` are strictly restricted to the verified teacher/admin. Students can never read or list raw question bank items or exam answer keys before or during an exam.
4. **Student Submission Ownership & Privacy**: A student can only `get` or `list` `/submissions/{submissionId}` where `resource.data.studentUid == request.auth.uid`. Students cannot read other students' submissions or grades.
5. **Terminal State Locking on Submissions**: Once a student submission reaches `status in ['Đã nộp', 'Chờ chấm', 'Đã chấm', 'Quá hạn']`, the student cannot modify `answersMap` or re-open the submission; only the teacher/admin can update scores and grading status.
6. **Strict Schema & Size Boundaries**: Every string field enforces `.size() <= MAX` and every list enforces `.size() <= MAX`. Document IDs must match `^[a-zA-Z0-9_\-]+$`.
7. **No Blanket List Queries**: Every `allow list` rule evaluates `isVerifiedTeacher()` (zero DB lookups) or checks `resource.data` ownership/visibility fields directly without `get()`/`exists()` inside `list`.

## 2. The "Dirty Dozen" Payloads

1. **Unverified Admin Email Spoof**: User with `email: "tienduongbp2011@gmail.com"` but `email_verified: false` attempting to create a document in `/question_bank/q1`.
2. **Self-Assigned Admin Role**: Authenticated student attempting to create `/users/student1` with `role: "admin"`.
3. **Shadow Field Injection on Class Creation**: Teacher attempting to create `/classes/10A1` with an undeclared field `"isSuperClass": true`.
4. **Student Reading Confidential Answer Key**: Authenticated student attempting `get` on `/exam_answer_keys/exam1`.
5. **Student Reading Another Student's Submission**: Authenticated student `uid_A` attempting `get` on `/submissions/sub_B` where `studentUid == "uid_B"`.
6. **Student Modifying Submitted Exam Answers (Terminal State Bypass)**: Authenticated student attempting `update` on `/submissions/sub_A` when `existing().status == "Đã nộp"`.
7. **Student Self-Grading Attack**: Authenticated student attempting `update` on `/submissions/sub_A` modifying `totalScore: 10` while `status == "Đang làm bài"`.
8. **ID Poisoning Attack**: Attempting to create `/classes/invalid id with spaces!` or >128 char ID.
9. **Value Poisoning / 1MB String Attack**: Attempting to update `title` in `/exams/exam1` with a 10,000-character string (`maxLength: 200`).
10. **Identity Spoofing on Submission Creation**: Authenticated student `uid_A` attempting to create `/submissions/sub1` with `studentUid: "uid_B"`.
11. **Immutable Field Mutation**: Attempting to update `createdAt` or `ownerId` on `/exams/exam1`.
12. **Blanket Unfiltered List Scraping**: Authenticated student attempting an unfiltered `list` on `/students` or `/question_bank`.
