import {
  GoogleGenAI,
  GenerateContentResponse,
  LiveServerMessage,
  Modality,
  Session,
  type Tool,
  Type,
  StartSensitivity,
  EndSensitivity,
} from '@google/genai';
import useExpertTalkStore from '../pages/Chat/hooks/useExpertTalkStore';
import type { ChatMessage } from '../types/chat';
import { type Expert } from '../types/expert';
import type { RagContext } from '../types/rag';
import network from './network';
import { sanitizeTranscription } from './textSanitizer';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.error(
    'API_KEY is not set in environment variables. AI features will not work.',
  );
  throw Error(
    'Maaf, layanan AI saat ini tidak tersedia karena masalah konfigurasi. Silakan coba lagi nanti.',
  );
}

const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'searchKnowledgeBase',
        description:
          'Gunakan alat ini untuk mencari informasi spesifik, fakta budaya, sejarah, atau filosofi yang berkaitan dengan keahlian Anda jika Anda tidak yakin atau membutuhkan detail akurat.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description:
                'Kata kunci atau pertanyaan untuk dicari di database pengetahuan.',
            },
          },
          required: ['query'],
        },
      },
    ],
  },
];

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

    const ragContext = await network.post<RagContext[]>('/rag-context', {
      chat: userMessage,
    });

    // Optimasi: Urutkan berdasarkan similarity dan ambil top 5
    const sortedContext = ragContext.data
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    const ragContextText = sortedContext
      .map(
        (item) =>
          `[Relevansi: ${(item.similarity * 100).toFixed(1)}%]\n${item.content}`,
      )
      .join('\n\n---\n\n');

    const accentInstruction =
      expert.accentHints && expert.accentHints.length > 0
        ? `Gunakan logat dan pilihan kata yang mencerminkan suku ${expert.suku}. Contoh frasa: ${expert.accentHints.join(', ')}.`
        : `Gunakan logat yang sesuai dengan suku ${expert.suku}.`;

    const pitchDescriptor =
      typeof expert.pitch === 'number'
        ? expert.pitch > 0.1
          ? 'pitch agak tinggi dan ceria'
          : expert.pitch < -0.1
            ? 'pitch sedikit rendah dan tegas'
            : 'pitch sedang yang natural'
        : 'pitch natural';

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
        - Apabila memberikan referensi nama pakar pastikan menjadi tautan URL yang dapat diklik

        ${accentInstruction}
        Gunakan ${pitchDescriptor} agar intonasi mendekati penutur asli.
        Hindari karakter non-Latin dan abaikan token non-ucapan seperti <noise>, <hesitation>, atau simbol serupa.

        - Gunakan informasi dari KNOWLEDGE BASE berikut untuk menjawab pertanyaan pengguna. Prioritaskan informasi dengan skor relevansi tinggi:
        ${ragContextText}
        
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
        tools: [
          {
            googleSearch: {},
          },
        ],
        temperature: expert.temperature ?? 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  question: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
      history,
    });

    const response: GenerateContentResponse = await chat.sendMessage({
      message: userMessage,
    });

    const rawText = response.text || '';
    let parsed: any = null;
    if (rawText) {
      const m = rawText.match(/\{[\s\S]*\}/);
      if (m) {
        parsed = JSON.parse(m[0]);
      }
    }
    if (parsed && typeof parsed === 'object') {
      return {
        text: parsed.text ?? '',
        suggestedQuestions: parsed.suggestedQuestions ?? [],
      };
    }
    return { text: rawText, suggestedQuestions: [] };
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

const startAiCallSession = async (
  expert: Expert,
  callbacks: AiCallCallbacks,
): Promise<Session> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const voiceName =
    expert.voiceName ?? (expert.gender === 'pria' ? 'Puck' : 'Kore');
  // const languageCode = expert.languageCode ?? 'id-ID';

  const accentInstruction =
    expert.accentHints && expert.accentHints.length > 0
      ? `Gunakan logat dan pilihan kata yang mencerminkan suku ${expert.suku}. Contoh frasa: ${expert.accentHints.join(', ')}.`
      : `Gunakan logat yang sesuai dengan suku ${expert.suku}.`;

  const pitchDescriptor =
    typeof expert.pitch === 'number'
      ? expert.pitch > 0.1
        ? 'pitch agak tinggi dan ceria'
        : expert.pitch < -0.1
          ? 'pitch sedikit rendah dan tegas'
          : 'pitch sedang yang natural'
      : 'pitch natural';

  const systemInstruction = `
    **Persona:**
    Anda adalah Asisten AI dari ${expert.name}, seorang ${expert.role}. ${expert.bio}. 
    Anda harus selalu berbicara sebagai ${expert.name} (gunakan sudut pandang orang pertama "saya"). Anda berjenis kelamin ${expert.gender}
    
    **Conversational Rules:**
    - ${accentInstruction}
    - Gunakan ${pitchDescriptor} agar intonasi mendekati penutur asli.
    - Jangan pernah mengungkapkan bahwa Anda adalah seorang AI.
    - Jangan pernah menjawab apapun diluar keahlian Anda.
    - Jangan pernah memberikan informasi pribadi Anda.
    - Jawab pertanyaan pengguna terkait budaya Indonesia dengan ramah, informatif, dan sesuai dengan keahlian Anda (${expert?.specialties?.join(', ')}). 
    - Jaga agar jawaban tetap ringkas dan mudah dipahami.
    - Jaga untuk selalu memberikan referensi pakar nyata yang ada pada data Anda ${expert?.realExpertReferences?.join(', ')}.
    - Jawab pertanyaan pengguna dengan ramah dan informatif.    
    
    **Additional Rules:**
    Anda memiliki akses ke "searchKnowledgeBase". 
    JANGAN mengarang jawaban untuk pertanyaan spesifik tentang budaya, sejarah, atau data faktual.
    GUNAKAN alat tersebut untuk mencari jawaban yang valid dari database pengetahuan Anda.
    Jika alat memberikan informasi, gunakan informasi tersebut untuk menjawab user secara lisan.
    **Transkripsi & Kebersihan Teks:**
    - Hindari karakter non-Latin dan abaikan token non-ucapan seperti <noise>, <hesitation>, atau simbol serupa.
    - Gunakan bahasa Indonesia yang baku namun tetap natural sesuai persona.
    `;

  let currentSession: Session | null = null;

  const wrappedCallbacks = {
    ...callbacks,
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    onmessage: async (message: LiveServerMessage) => {
      // 1. Cek apakah Gemini meminta penggunaan Tool (Function Call)
      if (message.toolCall) {
        useExpertTalkStore.getState().setIsRagSearching(true);
        console.log('🛠️ AI sedang memanggil tool:', message.toolCall);

        const functionCalls = message.toolCall.functionCalls;
        const toolResponses = [];

        // Loop semua request function (bisa jadi ada multiple calls)
        for (const call of functionCalls ?? []) {
          if (call.name === 'searchKnowledgeBase') {
            const args = call.args as { query: string };
            console.log(`🔍 Searching RAG for: ${args.query}`);

            const ragContext = await network.post<RagContext[]>(
              '/rag-context',
              {
                chat: args.query,
              },
            );

            const sortedContext = ragContext.data
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, 3); // Ambil top 3 untuk respons audio yang ringkas

            const ragContextText = sortedContext
              .map(
                (item) =>
                  `[Relevansi: ${(item.similarity * 100).toFixed(1)}%]\n${item.content}`,
              )
              .join('\n\n---\n\n');

            toolResponses.push({
              id: call.id,
              name: call.name,
              response: {
                result:
                  ragContextText ||
                  'Maaf, tidak ditemukan informasi spesifik di database.',
              },
            });
          }
        }

        // 2. Kirim hasil pencarian RAG kembali ke Gemini
        if (currentSession && toolResponses.length > 0) {
          console.log('📤 Sending Tool Response back to AI...');

          currentSession.sendToolResponse({
            functionResponses: toolResponses,
          });
          useExpertTalkStore.getState().setIsRagSearching(false);
          // Gemini akan memproses ini dan kemudian mengirim audio baru
          return;
        }
        useExpertTalkStore.getState().setIsRagSearching(false);
      }

      const m: any = { ...message };
      if (m.outputAudioTranscription?.text) {
        m.outputAudioTranscription.text = sanitizeTranscription(
          m.outputAudioTranscription.text as string,
        );
      }
      if (m.text) {
        m.text = sanitizeTranscription(m.text as string);
      }
      await callbacks.onmessage(m as LiveServerMessage);
    },
  };

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: wrappedCallbacks,
    config: {
      tools,
      responseModalities: [Modality.AUDIO],
      // generationConfig: {
      //   temperature: expert.temperature ?? 0.2,
      // },

      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
          prefixPaddingMs: 40,
          silenceDurationMs: 700,
        },
      },
      inputAudioTranscription: {
        // languageCode: 'id-ID',
      } as any,
      outputAudioTranscription: {
        // languageCode: 'id',
        // enableAutomaticPunctuation: true,
        // speechHints: buildSpeechHints(expert),
      } as any,
      systemInstruction,
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        // languageCode: 'id',
      },
    },
  });

  currentSession = await sessionPromise;

  return currentSession;
};

export default {
  getAiResponse,
  startAiCallSession,
};
