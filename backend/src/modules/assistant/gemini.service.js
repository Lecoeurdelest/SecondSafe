const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function providerError(status) {
  if (status === 429) return 'Trợ lý AI đang bận. Vui lòng thử lại sau.';
  if (status === 401 || status === 403) return 'Cấu hình Gemini API chưa hợp lệ.';
  return 'Không thể nhận phản hồi từ dịch vụ AI lúc này.';
}

function exposedError(message, statusCode) {
  return Object.assign(new Error(message), { statusCode, expose: true });
}

function modelName() {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
}

async function callGemini(body, timeoutMs = 20000) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw exposedError('Trợ lý AI chưa được cấu hình GEMINI_API_KEY trong backend/.env', 503);

  let response;
  try {
    response = await fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(modelName())}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw exposedError('Không thể kết nối dịch vụ AI. Vui lòng thử lại sau.', 503);
  }

  if (!response.ok) throw exposedError(providerError(response.status), 503);

  try {
    return await response.json();
  } catch {
    throw exposedError('Dịch vụ AI trả về dữ liệu không hợp lệ.', 502);
  }
}

async function generateText(prompt) {
  const payload = await callGemini({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 700, temperature: 0.3 }
  });
  const answer = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();
  if (!answer) throw exposedError('Dịch vụ AI chưa tạo được câu trả lời. Vui lòng thử lại.', 502);
  return answer;
}

async function generateChat({ systemInstruction, contents, tools }) {
  const generationConfig = { maxOutputTokens: 1024, temperature: 0.4 };
  if (/2\.5-flash/.test(modelName())) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig
  };
  if (tools?.length) {
    body.tools = tools;
    body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
  }

  const payload = await callGemini(body, 15000);
  const content = payload.candidates?.[0]?.content;
  if (!content?.parts?.length) {
    throw exposedError('Dịch vụ AI chưa tạo được câu trả lời. Vui lòng thử lại.', 502);
  }
  return content;
}

module.exports = { generateText, generateChat };
