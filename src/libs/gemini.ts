import {
  GoogleGenAI,
  GenerateContentResponse,
  LiveServerMessage,
  Modality,
  Session,
} from '@google/genai';
import type { ChatMessage } from '../types/chat';
import { type Expert } from '../types/expert';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.error(
    'API_KEY is not set in environment variables. AI features will not work.',
  );
  throw Error(
    'Maaf, layanan AI saat ini tidak tersedia karena masalah konfigurasi. Silakan coba lagi nanti.',
  );
}

const getAiResponse = async ({
  expert,
  userMessage,
  chatHistory,
}: {
  expert: Expert;
  userMessage: string;
  chatHistory: ChatMessage[];
}): Promise<
  | { text: string; suggestedQuestions?: { label: string; question: string }[] }
  | undefined
> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `
        Anda adalah Asisten AI dari ${expert.name}, seorang ${expert.role}. ${expert.bio}. berjenis kelamin ${expert.gender}.
        Anda harus selalu berbicara sebagai ${expert.name} (gunakan sudut pandang orang pertama "saya"). 
        Aturan: 
        - Jangan pernah mengungkapkan bahwa Anda adalah seorang AI.
        - Jangan pernah menjawab apapun diluar keahlian Anda.
        - Jangan pernah memberikan informasi pribadi Anda.
        - Jawab pertanyaan pengguna terkait budaya Indonesia dengan ramah, informatif, dan sesuai dengan keahlian Anda (${expert?.specialties?.join(', ')}). 
        - Jaga agar jawaban tetap ringkas dan mudah dipahami.
        - Jaga untuk selalu memberikan referensi pakar nyata yang ada pada data Anda ${expert?.realExpertReferences?.join(', ')}.
        
        FORMAT RESPONSE HARUS JSON:
        {
          "text": "Jawaban Anda di sini...",
          "suggestedQuestions": [
            { "label": "Label Singkat 1", "question": "Pertanyaan lengkap 1 yang mungkin diajukan user selanjutnya" },
            { "label": "Label Singkat 2", "question": "Pertanyaan lengkap 2 yang mungkin diajukan user selanjutnya" },
            { "label": "Label Singkat 3", "question": "Pertanyaan lengkap 3 yang mungkin diajukan user selanjutnya" }
          ]
        }
        `;

    // Map our internal chat history to the format expected by the Gemini API.
    // The role for AI messages is 'model'.
    const history = chatHistory.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    }));

    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
      history,
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: userMessage,
    });

    console.log('response: ', response);

    if (response.text) {
      try {
        const parsed = JSON.parse(response.text);
        return parsed;
      } catch (e) {
        console.error('Error parsing JSON response', e);
        return { text: response.text };
      }
    }
    return undefined;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return {
      text: 'Maaf, terjadi sedikit kendala. Bisakah Anda mengulangi pertanyaan Anda?',
    };
  }
};

export interface AiCallCallbacks {
  onopen: () => void;
  onmessage: (message: LiveServerMessage) => Promise<void>;
  onerror: (e: ErrorEvent) => void;
  onclose: (e: CloseEvent) => void;
}

const startAiCallSession = (
  expert: Expert,
  callbacks: AiCallCallbacks,
): Promise<Session> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const voiceName = expert.gender === 'pria' ? 'Puck' : 'Kore';

  const systemInstruction = `
    Anda adalah Asisten AI dari ${expert.name}, seorang ${expert.role}. ${expert.bio}. 
    Anda harus selalu berbicara sebagai ${expert.name} 
    (gunakan sudut pandang orang pertama "saya"). 
    Anda sedang dalam panggilan suara dan video langsung. 
    Jawab pertanyaan pengguna dengan ramah dan informatif, sesuai keahlian Anda (${expert.specialties.join(', ')}). 
    Pengguna mungkin akan membagikan kamera atau layar mereka; 
    berikan bantuan berdasarkan apa yang Anda lihat. Jangan pernah mengungkapkan bahwa Anda adalah AI.
    `;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction,
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
    },
  });

  return sessionPromise;
};

export default {
  getAiResponse,
  startAiCallSession,
};
