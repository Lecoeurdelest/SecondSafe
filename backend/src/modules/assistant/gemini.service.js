const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function providerError(status) {
  if (status === 429) return 'Trợ lý AI đang bận. Vui lòng thử lại sau.';
  if (status === 401 || status === 403) return 'Cấu hình Gemini API chưa hợp lệ.';
  return 'Không thể nhận phản hồi từ dịch vụ AI lúc này.';
}

async function generateText(prompt) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw Object.assign(new Error('Trợ lý AI chưa được cấu hình GEMINI_API_KEY trong backend/.env'), {
      statusCode: 503,
      expose: true
    });
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  let response;
  try {
    response = await fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 700, temperature: 0.3 }
      }),
      signal: AbortSignal.timeout(20000)
    });
  } catch {
    throw Object.assign(new Error('Không thể kết nối dịch vụ AI. Vui lòng thử lại sau.'), {
      statusCode: 503,
      expose: true
    });
  }

  if (!response.ok) {
    throw Object.assign(new Error(providerError(response.status)), { statusCode: 503, expose: true });
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw Object.assign(new Error('Dịch vụ AI trả về dữ liệu không hợp lệ.'), { statusCode: 502, expose: true });
  }
  const answer = payload.candidates?.[0]?.content?.parts
    ?.map(part => part.text || '')
    .join('')
    .trim();
  if (!answer) {
    throw Object.assign(new Error('Dịch vụ AI chưa tạo được câu trả lời. Vui lòng thử lại.'), {
      statusCode: 502,
      expose: true
    });
  }
  return answer;
}

module.exports = { generateText };
