import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '2mb' }));

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Check AI Connection Status without exposing any secrets
app.get('/api/ai/status', (_req, res) => {
  const client = getGeminiClient();
  res.json({
    connected: Boolean(client),
    model: 'gemini-3.8-flash',
    message: client
      ? 'Dịch vụ Trợ lý AI Tin học THPT (Máy chủ) đã sẵn sàng.'
      : 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Các phân hệ quản lý học sinh, ngân hàng câu hỏi, kiểm tra và báo cáo vẫn hoạt động bình thường.',
  });
});

// Generate Informatics Questions for Teacher Review
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Chức năng Trợ lý AI chưa được kết nối khóa API trên máy chủ (GEMINI_API_KEY). Giáo viên vẫn có thể tạo câu hỏi thủ công hoặc nhập từ tệp mẫu.',
      });
      return;
    }

    const {
      grade = '10',
      topic = 'Máy tính và xã hội tri thức',
      lesson = '',
      cognitiveLevel = 'Thông hiểu',
      questionType = 'multiple_choice',
      count = 3,
      sourceMaterial = '',
      customPrompt = '',
    } = req.body || {};

    const safeCount = Math.min(Math.max(Number(count) || 2, 1), 10);

    const prompt = `Bạn là chuyên gia biên soạn câu hỏi môn Tin học THPT theo Chương trình Giáo dục phổ thông 2018 (Bộ sách Kết nối tri thức với cuộc sống) hỗ trợ thầy Nguyễn Tiến Dương tại Trường THPT Thanh Hòa.
Hãy đề xuất ${safeCount} câu hỏi môn Tin học Khối ${grade}.
- Chủ đề: ${topic}
- Bài học: ${lesson || 'Theo chương trình chuẩn'}
- Mức độ nhận thức: ${cognitiveLevel}
- Dạng câu hỏi yêu cầu: ${questionType} (multiple_choice: Trắc nghiệm 4 lựa chọn A/B/C/D; true_false: Đúng/Sai 4 mệnh đề a,b,c,d; short_answer: Trả lời ngắn; essay: Tự luận)
${customPrompt ? `- Yêu cầu bổ sung của giáo viên: ${customPrompt}` : ''}
${sourceMaterial ? `- Ngữ liệu / Tài liệu tham khảo: ${sourceMaterial}` : ''}

Lưu ý quan trọng:
- Với multiple_choice: cung cấp mảng options gồm đúng 4 phương án rõ ràng (không cần tiền tố A., B. vì hệ thống tự đánh), và correctAnswer là "A", "B", "C" hoặc "D".
- Với true_false: cung cấp mảng subItems gồm 4 mệnh đề (id: "a", "b", "c", "d", text: nội dung mệnh đề, isTrue: true/false) và correctAnswer mô tả ngắn gọn như "a-Đ, b-S, c-Đ, d-Đ".
- Với short_answer: correctAnswer là đáp án ngắn gọn chính xác.
- Với essay: gradingGuide là hướng dẫn chấm chi tiết kèm thang điểm tham khảo.
- Tất cả câu hỏi chỉ là bản đề xuất để giáo viên kiểm duyệt trước khi lưu vào ngân hàng.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING, description: 'Nội dung câu hỏi' },
              codeSnippet: { type: Type.STRING, description: 'Đoạn mã Python/SQL/HTML nếu có, hoặc chuỗi rỗng' },
              questionType: { type: Type.STRING, description: 'multiple_choice, true_false, short_answer, hoặc essay' },
              cognitiveLevel: { type: Type.STRING, description: 'Nhận biết, Thông hiểu, Vận dụng, hoặc Vận dụng cao' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 phương án trả lời nếu là multiple_choice',
              },
              subItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isTrue: { type: Type.BOOLEAN },
                  },
                  required: ['id', 'text', 'isTrue'],
                },
                description: 'Các ý a, b, c, d nếu là câu hỏi true_false',
              },
              correctAnswer: { type: Type.STRING, description: 'Đáp án đúng (A/B/C/D hoặc nội dung đáp án)' },
              explanation: { type: Type.STRING, description: 'Lời giải chi tiết và giải thích kiến thức' },
              gradingGuide: { type: Type.STRING, description: 'Hướng dẫn chấm và biểu điểm cho câu tự luận' },
              points: { type: Type.NUMBER, description: 'Điểm số đề xuất (ví dụ 0.25, 1.0, 2.0)' },
              knowledgeUnit: { type: Type.STRING, description: 'Đơn vị kiến thức trọng tâm' },
            },
            required: ['content', 'questionType', 'cognitiveLevel', 'correctAnswer', 'explanation', 'points'],
          },
        },
      },
    });

    const rawText = response.text || '[]';
    const parsed = JSON.parse(rawText.trim());
    res.json({ questions: Array.isArray(parsed) ? parsed : [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định khi gọi AI';
    res.status(500).json({ error: `Không thể tạo câu hỏi từ AI: ${message}` });
  }
});

// Teacher AI Assistant Endpoint
app.post('/api/ai/assistant', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Chức năng Trợ lý AI chưa được kết nối khóa API trên máy chủ (GEMINI_API_KEY).',
      });
      return;
    }

    const { taskType = 'general', grade = '10', topic = '', prompt = '', contextSummary = '' } = req.body || {};

    const systemInstruction = `Bạn là Trợ lý AI chuyên môn môn Tin học THPT tại Trường THPT Thanh Hòa (xã Thiện Hưng, TP. Đồng Nai), hỗ trợ trực tiếp cho giáo viên Nguyễn Tiến Dương.
Nguyên tắc hoạt động bắt buộc:
1. Chỉ đóng vai trò tư vấn, soạn thảo dự thảo câu hỏi, đề cương ôn tập, hướng dẫn giải, phân tích thống kê tổng hợp và đề xuất kế hoạch ôn tập.
2. KHÔNG tự khẳng định nội dung sinh ra là tuyệt đối chính xác; luôn nhắc giáo viên kiểm tra và phê duyệt trước khi áp dụng.
3. KHÔNG tự ý sửa điểm, thay đổi kết quả học sinh hoặc phát hành đề kiểm tra.
4. Bảo mật dữ liệu cá nhân của học sinh, chỉ phân tích trên số liệu thống kê ẩn danh.
5. Trình bày rõ ràng, chuẩn thuật ngữ Tin học THPT Chương trình GDPT 2018 (Python, Thuật toán, Cơ sở dữ liệu SQL, Mạng máy tính, AI, HTML/CSS).`;

    const fullPrompt = `Nhiệm vụ hỗ trợ: ${taskType}
Khối lớp: Khối ${grade}
${topic ? `Chủ đề trọng tâm: ${topic}` : ''}
${contextSummary ? `Dữ liệu thống kê tổng hợp (ẩn danh): ${contextSummary}` : ''}
Yêu cầu chi tiết của giáo viên Nguyễn Tiến Dương:
${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      reply: response.text || 'Trợ lý AI không phản hồi nội dung.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi kết nối dịch vụ AI';
    res.status(500).json({ error: `Lỗi xử lý từ Trợ lý AI: ${message}` });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`TIN HỌC THPT THANH HÒA Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
