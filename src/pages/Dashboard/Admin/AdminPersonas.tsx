import type React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Headphones,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import network from '../../../libs/network';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

interface PersonaItem {
  id: string;
  slug: string;
  public_name: string;
  title: string | null;
  bio: string | null;
  image_url: string | null;
  community: string | null;
  region: string | null;
  domains: unknown;
  status: string;
  is_published: boolean;
  is_ai: boolean;
  governance_id: string | null;
  governance_status: string | null;
  persona_version: string | null;
  configuration: PersonaConfiguration;
  voice_preview_text?: string;
  active_bindings_count: string;
  active_knowledge_count: string;
  pending_bindings_count: string;
}

interface PersonaConfiguration {
  personality?: string;
  preferredLanguage?: string;
  languageStyle?: string;
  responseLength?: 'singkat' | 'sedang' | 'mendalam';
  emojiPolicy?: 'tanpa_emoji' | 'jarang' | 'wajar';
  vocabulary?: string[];
  voiceName?: string;
  ttsModel?: 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts';
  speakingStyle?: string;
  pitchDescriptor?: string;
  speakingRate?: number;
  vocalMaturity?: 'muda' | 'dewasa' | 'matang';
  timbreDescriptor?: string;
  energyLevel?: 'rendah' | 'sedang' | 'tinggi';
  articulationStyle?: string;
  pauseStyle?: string;
  dialectRegion?: string;
  accentIntensity?: number;
  pronunciationGuide?: Array<{ term: string; pronunciation: string }>;
  voiceValidationStatus?: 'draft' | 'reviewed' | 'approved';
  voiceValidator?: string;
  voiceValidationNotes?: string;
  empathyStyle?: string;
  humorStyle?: string;
  boundaries?: string[];
}

type PersonaForm = {
  publicName: string;
  title: string;
  bio: string;
  personaVersion: string;
  personality: string;
  preferredLanguage: string;
  languageStyle: string;
  responseLength: 'singkat' | 'sedang' | 'mendalam';
  emojiPolicy: 'tanpa_emoji' | 'jarang' | 'wajar';
  vocabulary: string;
  voiceName: string;
  ttsModel: 'gemini-3.8-flash-tts' | 'gemini-3.8-flash-lite-tts';
  speakingStyle: string;
  pitchDescriptor: string;
  speakingRate: number;
  vocalMaturity: 'muda' | 'dewasa' | 'matang';
  timbreDescriptor: string;
  energyLevel: 'rendah' | 'sedang' | 'tinggi';
  articulationStyle: string;
  pauseStyle: string;
  dialectRegion: string;
  accentIntensity: number;
  pronunciationGuide: string;
  voiceValidationStatus: 'draft' | 'reviewed' | 'approved';
  voiceValidator: string;
  voiceValidationNotes: string;
  empathyStyle: string;
  humorStyle: string;
  boundaries: string;
};

type PersonaFilter = 'all' | 'active' | 'attention';

const voiceOptions = [
  { value: 'Zephyr', label: 'Zephyr — cerah' },
  { value: 'Kore', label: 'Kore — tenang & tegas' },
  { value: 'Puck', label: 'Puck — ceria & hidup' },
  { value: 'Aoede', label: 'Aoede — ringan & hangat' },
  { value: 'Charon', label: 'Charon — informatif' },
  { value: 'Fenrir', label: 'Fenrir — ekspresif' },
  { value: 'Leda', label: 'Leda — muda & lembut' },
  { value: 'Orus', label: 'Orus — tegas' },
  { value: 'Callirrhoe', label: 'Callirrhoe — santai' },
  { value: 'Autonoe', label: 'Autonoe — cerah' },
  { value: 'Enceladus', label: 'Enceladus — berdesah lembut' },
  { value: 'Iapetus', label: 'Iapetus — jernih' },
  { value: 'Umbriel', label: 'Umbriel — santai' },
  { value: 'Algieba', label: 'Algieba — halus' },
  { value: 'Despina', label: 'Despina — halus' },
  { value: 'Erinome', label: 'Erinome — jernih' },
  { value: 'Algenib', label: 'Algenib — serak' },
  { value: 'Rasalgethi', label: 'Rasalgethi — informatif' },
  { value: 'Laomedeia', label: 'Laomedeia — penuh semangat' },
  { value: 'Achernar', label: 'Achernar — lembut' },
  { value: 'Alnilam', label: 'Alnilam — tegas' },
  { value: 'Schedar', label: 'Schedar — stabil' },
  { value: 'Gacrux', label: 'Gacrux — matang & berwibawa' },
  { value: 'Pulcherrima', label: 'Pulcherrima — lugas' },
  { value: 'Sulafat', label: 'Sulafat — hangat' },
  { value: 'Vindemiatrix', label: 'Vindemiatrix — lembut' },
  { value: 'Achird', label: 'Achird — ramah' },
  { value: 'Zubenelgenubi', label: 'Zubenelgenubi — kasual' },
  { value: 'Sadachbia', label: 'Sadachbia — hidup' },
  { value: 'Sadaltager', label: 'Sadaltager — berwawasan' },
];

type VoicePreviewScenario = 'greeting' | 'culture' | 'pronunciation' | 'empathy';
type PersonaFormSection = 'identity' | 'language' | 'voice' | 'validation';
const personaFormSections: PersonaFormSection[] = ['identity', 'language', 'voice', 'validation'];

const pronunciationTextFromConfig = (
  guide: PersonaConfiguration['pronunciationGuide'],
): string => (guide ?? [])
  .map((entry) => `${entry.term} = ${entry.pronunciation}`)
  .join('\n');

const parsePronunciationGuide = (
  value: string,
): Array<{ term: string; pronunciation: string }> => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [term, ...pronunciationParts] = line.split(/\s*(?:=|→)\s*/);
    return {
      term: term?.trim() ?? '',
      pronunciation: pronunciationParts.join(' = ').trim(),
    };
  })
  .filter((entry) => entry.term && entry.pronunciation);

const formFromPersona = (persona: PersonaItem): PersonaForm => {
  const config = persona.configuration || {};
  return {
    publicName: persona.public_name,
    title: persona.title || 'Persona Budaya',
    bio: persona.bio || '',
    personaVersion: persona.persona_version || 'v1.0',
    personality: config.personality || '',
    preferredLanguage: config.preferredLanguage || 'Bahasa Indonesia',
    languageStyle: config.languageStyle || '',
    responseLength: config.responseLength || 'singkat',
    emojiPolicy: config.emojiPolicy || 'jarang',
    vocabulary: (config.vocabulary || []).join(', '),
    voiceName: config.voiceName || 'Kore',
    ttsModel: config.ttsModel || 'gemini-3.8-flash-tts',
    speakingStyle: config.speakingStyle || '',
    pitchDescriptor: config.pitchDescriptor || '',
    speakingRate: config.speakingRate || 1,
    vocalMaturity: config.vocalMaturity || 'dewasa',
    timbreDescriptor: config.timbreDescriptor || 'natural, jernih, dan hangat',
    energyLevel: config.energyLevel || 'sedang',
    articulationStyle: config.articulationStyle || 'jelas dan tidak dibuat-buat',
    pauseStyle: config.pauseStyle || 'jeda alami antarkalimat',
    dialectRegion: config.dialectRegion || persona.region || persona.community || '',
    accentIntensity: config.accentIntensity ?? 35,
    pronunciationGuide: pronunciationTextFromConfig(config.pronunciationGuide),
    voiceValidationStatus: config.voiceValidationStatus || 'draft',
    voiceValidator: config.voiceValidator || '',
    voiceValidationNotes: config.voiceValidationNotes || '',
    empathyStyle: config.empathyStyle || '',
    humorStyle: config.humorStyle || '',
    boundaries: (config.boundaries || []).join('\n'),
  };
};

const requestErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    if (
      responseData
      && typeof responseData === 'object'
      && !(responseData instanceof Blob)
      && 'message' in responseData
      && typeof responseData.message === 'string'
    ) {
      return responseData.message;
    }
    if (status === 401) return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
    if (status === 403) return 'Akses ditolak. Pastikan akun Super Admin dan verifikasi dua langkah Anda masih aktif.';
    if (status === 429) return 'Batas preview suara sementara tercapai. Tunggu sebentar lalu coba kembali.';
    if (status && status >= 500) return 'Layanan suara sedang mengalami gangguan. Silakan coba kembali.';
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const configurationFromForm = (form: PersonaForm): PersonaConfiguration => ({
  personality: form.personality,
  preferredLanguage: form.preferredLanguage,
  languageStyle: form.languageStyle,
  responseLength: form.responseLength,
  emojiPolicy: form.emojiPolicy,
  vocabulary: form.vocabulary.split(',').map((item) => item.trim()).filter(Boolean),
  voiceName: form.voiceName,
  ttsModel: form.ttsModel,
  speakingStyle: form.speakingStyle,
  pitchDescriptor: form.pitchDescriptor,
  speakingRate: form.speakingRate,
  vocalMaturity: form.vocalMaturity,
  timbreDescriptor: form.timbreDescriptor,
  energyLevel: form.energyLevel,
  articulationStyle: form.articulationStyle,
  pauseStyle: form.pauseStyle,
  dialectRegion: form.dialectRegion,
  accentIntensity: form.accentIntensity,
  pronunciationGuide: parsePronunciationGuide(form.pronunciationGuide),
  voiceValidationStatus: form.voiceValidationStatus,
  voiceValidator: form.voiceValidator,
  voiceValidationNotes: form.voiceValidationNotes,
  empathyStyle: form.empathyStyle,
  humorStyle: form.humorStyle,
  boundaries: form.boundaries.split('\n').map((item) => item.trim()).filter(Boolean),
});

const buildVoicePreviewText = (
  scenario: VoicePreviewScenario,
  persona: PersonaItem,
  form: PersonaForm,
): string => {
  const vocabulary = form.vocabulary
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (scenario === 'culture') {
    return `Saya ${form.publicName}. Mari memahami ${persona.community || 'budaya Nusantara'} dengan tenang, jernih, dan tetap menghormati keragaman setiap wilayah.`;
  }
  if (scenario === 'pronunciation') {
    return vocabulary.length > 0
      ? `Mari kita ucapkan beberapa istilah penting dengan tepat: ${vocabulary.join(', ')}.`
      : `Mari kita mengucapkan nama tradisi, tempat, dan istilah budaya dengan jelas serta penuh kehati-hatian.`;
  }
  if (scenario === 'empathy') {
    return `Terima kasih sudah bertanya. Tidak apa-apa jika hal ini terasa rumit; saya akan menjelaskannya perlahan agar mudah dipahami.`;
  }
  return persona.voice_preview_text
    || `Salam budaya. Saya ${form.publicName}. Mari mengenal budaya Nusantara bersama-sama.`;
};

interface PersonaBindingItem {
  id: string;
  persona_profile_id: string;
  source_version_id: string;
  status: string;
  scope_notes: string;
  effective_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  source_title: string;
  version: number;
  cultural_classification: string;
  author_name: string;
  author_slug: string;
  requested_by_name: string | null;
  cultural_approved_by_name: string | null;
  published_by_name: string | null;
}

export const AdminPersonas: React.FC = () => {
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PersonaFilter>('all');

  // Selected Persona for Bindings Management
  const [selectedPersona, setSelectedPersona] = useState<PersonaItem | null>(null);
  const [personaForm, setPersonaForm] = useState<PersonaForm | null>(null);
  const [initialPersonaForm, setInitialPersonaForm] = useState<PersonaForm | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState<'primary' | 'comparison' | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewModel, setPreviewModel] = useState<string | null>(null);
  const [comparisonVoice, setComparisonVoice] = useState('Aoede');
  const [comparisonAudioUrl, setComparisonAudioUrl] = useState<string | null>(null);
  const [comparisonModel, setComparisonModel] = useState<string | null>(null);
  const [previewScenario, setPreviewScenario] = useState<VoicePreviewScenario>('greeting');
  const [activeFormSection, setActiveFormSection] = useState<PersonaFormSection>('identity');
  const [isAdvancedVoiceOpen, setIsAdvancedVoiceOpen] = useState(false);
  const [bindings, setBindings] = useState<PersonaBindingItem[]>([]);
  const [loadingBindings, setLoadingBindings] = useState(false);
  const [bindingsError, setBindingsError] = useState<string | null>(null);

  // Suspend modal state
  const [suspendBindingId, setSuspendBindingId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  // Notice
  const [notice, setNotice] = useState<string | null>(null);

  const fetchPersonas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await network.get<{ personas: PersonaItem[] }>('/admin/personas');
      setPersonas(res.data.personas || []);
    } catch (err: unknown) {
      setError(requestErrorMessage(err, 'Gagal memuat persona AI.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBindings = async (personaId: string) => {
    setLoadingBindings(true);
    setBindingsError(null);
    try {
      const res = await network.get<{ bindings: PersonaBindingItem[] }>(
        `/admin/personas/${personaId}/bindings`
      );
      setBindings(res.data.bindings || []);
    } catch (err: unknown) {
      setBindingsError(requestErrorMessage(err, 'Gagal memuat binding pengetahuan.'));
    } finally {
      setLoadingBindings(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const clearVoicePreviews = () => {
    if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
    if (comparisonAudioUrl) URL.revokeObjectURL(comparisonAudioUrl);
    setPreviewAudioUrl(null);
    setPreviewModel(null);
    setComparisonAudioUrl(null);
    setComparisonModel(null);
  };

  useEffect(() => {
    if (!selectedPersona) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPersona]);

  const handleSelectPersona = (persona: PersonaItem) => {
    const form = formFromPersona(persona);
    setSelectedPersona(persona);
    setPersonaForm(form);
    setInitialPersonaForm(form);
    setFormError(null);
    setFormSuccess(null);
    clearVoicePreviews();
    setComparisonVoice(form.voiceName === 'Aoede' ? 'Sulafat' : 'Aoede');
    setPreviewScenario('greeting');
    setActiveFormSection('identity');
    setIsAdvancedVoiceOpen(false);
    fetchBindings(persona.id);
  };

  const hasUnsavedChanges = Boolean(
    personaForm && initialPersonaForm
    && JSON.stringify(personaForm) !== JSON.stringify(initialPersonaForm),
  );

  const closePersonaPanel = () => {
    if (hasUnsavedChanges && !window.confirm('Perubahan belum disimpan. Tutup tanpa menyimpan?')) return;
    clearVoicePreviews();
    setSelectedPersona(null);
    setPersonaForm(null);
    setInitialPersonaForm(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const updateForm = <K extends keyof PersonaForm>(key: K, value: PersonaForm[K]) => {
    setFormSuccess(null);
    clearVoicePreviews();
    setPersonaForm((current) => current ? { ...current, [key]: value } : current);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedPersona || !personaForm) return;
    if (!personaForm.publicName.trim() || !personaForm.title.trim() || !personaForm.bio.trim()) {
      setFormError('Nama, peran, dan biografi persona wajib diisi.');
      setActiveFormSection('identity');
      return;
    }
    if (!/^v?\d+\.\d+(?:\.\d+)?$/.test(personaForm.personaVersion)) {
      setFormError('Versi harus menggunakan format seperti v1.0 atau v1.2.0.');
      setActiveFormSection('identity');
      return;
    }
    const pronunciationLines = personaForm.pronunciationGuide
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (pronunciationLines.some((line) => !/\s*(?:=|→)\s*/.test(line))) {
      setFormError('Panduan pelafalan harus memakai format “istilah = cara baca”, satu istilah per baris.');
      setActiveFormSection('voice');
      setIsAdvancedVoiceOpen(true);
      return;
    }
    if (personaForm.voiceValidationStatus === 'approved' && !personaForm.voiceValidator.trim()) {
      setFormError('Nama validator wajib diisi sebelum suara dinyatakan disetujui narasumber.');
      setActiveFormSection('validation');
      return;
    }
    setFormError(null);
    setSavingConfig(true);
    try {
      await network.patch(`/admin/personas/${selectedPersona.id}/configuration`, {
        publicName: personaForm.publicName,
        title: personaForm.title,
        bio: personaForm.bio,
        personaVersion: personaForm.personaVersion,
        configuration: configurationFromForm(personaForm),
      });
      setNotice('Konfigurasi persona berhasil disimpan dan langsung digunakan oleh chat serta suara Gemini.');
      setFormSuccess('Tersimpan. Konfigurasi ini langsung dipakai oleh chat DeepSeek dan suara Gemini berikutnya.');
      setInitialPersonaForm({ ...personaForm });
      setPersonas((current) => current.map((persona) => persona.id === selectedPersona.id
        ? {
            ...persona,
            public_name: personaForm.publicName,
            title: personaForm.title,
            bio: personaForm.bio,
            persona_version: personaForm.personaVersion,
            configuration: configurationFromForm(personaForm),
          }
        : persona));
      await fetchPersonas();
      setTimeout(() => setNotice(null), 5000);
    } catch (err: unknown) {
      alert(requestErrorMessage(err, 'Gagal menyimpan konfigurasi persona.'));
    } finally {
      setSavingConfig(false);
    }
  };

  const handlePreviewVoice = async (mode: 'primary' | 'comparison') => {
    if (!selectedPersona || !personaForm) return;
    setPreviewingVoice(mode);
    setFormError(null);
    try {
      const configuration = configurationFromForm(personaForm);
      if (mode === 'comparison') configuration.voiceName = comparisonVoice;
      const response = await network.post<Blob>(
        `/admin/personas/${selectedPersona.id}/voice-preview`,
        {
          text: buildVoicePreviewText(previewScenario, selectedPersona, personaForm),
          configuration,
        },
        { responseType: 'blob', headers: { Accept: 'audio/wav, audio/mpeg, audio/*' } },
      );
      const audioUrl = URL.createObjectURL(response.data);
      const model = String(response.headers['x-ai-voice-model'] || personaForm.ttsModel);
      if (mode === 'comparison') {
        if (comparisonAudioUrl) URL.revokeObjectURL(comparisonAudioUrl);
        setComparisonAudioUrl(audioUrl);
        setComparisonModel(model);
      } else {
        if (previewAudioUrl) URL.revokeObjectURL(previewAudioUrl);
        setPreviewAudioUrl(audioUrl);
        setPreviewModel(model);
      }
    } catch (err: unknown) {
      setFormError(requestErrorMessage(err, 'Gagal membuat preview suara.'));
    } finally {
      setPreviewingVoice(null);
    }
  };

  const handleActivateBinding = async (bindingId: string) => {
    if (!selectedPersona) return;
    try {
      await network.post(
        `/admin/personas/${selectedPersona.id}/bindings/${bindingId}/activate`
      );
      setNotice('Binding pengetahuan berhasil dipublikasikan dan aktif untuk rujukan Persona AI.');
      fetchBindings(selectedPersona.id);
      fetchPersonas();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(requestErrorMessage(err, 'Gagal mengaktifkan binding.'));
    }
  };

  const handleSuspendBindingSubmit = async () => {
    if (!selectedPersona || !suspendBindingId) return;
    if (suspendReason.trim().length < 5) {
      alert('Alasan penangguhan wajib diisi minimal 5 karakter.');
      return;
    }
    setSuspending(true);
    try {
      await network.post(
        `/admin/personas/${selectedPersona.id}/bindings/${suspendBindingId}/suspend`,
        { reason: suspendReason.trim() }
      );
      setNotice('Binding pengetahuan berhasil disuspend dari rujukan Persona AI.');
      setSuspendBindingId(null);
      setSuspendReason('');
      fetchBindings(selectedPersona.id);
      fetchPersonas();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(requestErrorMessage(err, 'Gagal menangguhkan binding.'));
    } finally {
      setSuspending(false);
    }
  };

  const [deletingPersona, setDeletingPersona] = useState(false);

  const handleDeletePersona = async () => {
    if (!selectedPersona) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus data Persona "${selectedPersona.public_name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmDelete) return;

    setDeletingPersona(true);
    try {
      await network.delete(`/admin/personas/${selectedPersona.id}`);
      setNotice(`Persona "${selectedPersona.public_name}" berhasil dihapus.`);
      closePersonaPanel();
      await fetchPersonas();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(requestErrorMessage(err, 'Gagal menghapus persona.'));
    } finally {
      setDeletingPersona(false);
    }
  };

  const filteredPersonas = personas.filter((p) => {
    const matchesSearch = p.public_name.toLowerCase().includes(search.toLowerCase())
      || (p.community && p.community.toLowerCase().includes(search.toLowerCase()))
      || (p.title && p.title.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all'
      || (filter === 'active' && p.governance_status === 'active' && p.is_published)
      || (filter === 'attention' && (p.governance_status !== 'active' || !p.is_published || Number(p.pending_bindings_count) > 0));
    return matchesSearch && matchesFilter;
  });
  const activeFormSectionIndex = personaFormSections.indexOf(activeFormSection);

  const getBindingStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Menunggu Kurator Adat
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Disetujui Adat (Siap Publikasi)</span>
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sparkles className="h-3 w-3" />
            <span>Aktif Dirujuk AI</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="h-3 w-3" />
            <span>Ditangguhkan (Suspended)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-600">
            {status}
          </span>
        );
    }
  };

  return (
    <Sidebar title="AI Persona">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2e2620]">Pusat Konfigurasi AI Persona</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Atur identitas, gaya percakapan, suara Gemini, batasan karakter, dan sumber pengetahuan setiap persona.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPersonas}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#ebdccc] hover:bg-[#fffbf7] text-xs font-bold text-[#2e2620] shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className="text-emerald-900 font-bold">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-bold">Daftar persona gagal dimuat</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>
            </div>
            <button type="button" onClick={fetchPersonas} className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm">Coba Lagi</button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[#ebdccc] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Total persona</p>
            <p className="mt-1 text-2xl font-bold text-[#2e2620]">{personas.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Aktif & publik</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">
              {personas.filter((persona) => persona.governance_status === 'active' && persona.is_published).length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Perlu perhatian</p>
            <p className="mt-1 text-2xl font-bold text-amber-800">
              {personas.filter((persona) => persona.governance_status !== 'active' || !persona.is_published || Number(persona.pending_bindings_count) > 0).length}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Rujukan aktif</p>
            <p className="mt-1 text-2xl font-bold text-blue-800">
              {personas.reduce((total, persona) => total + Number(persona.active_knowledge_count), 0)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-[#ebdccc] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block flex-1 sm:max-w-lg">
            <span className="sr-only">Cari persona</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, daerah, atau keahlian persona..."
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#d71920]/10"
            />
          </label>
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1" aria-label="Filter persona">
            {([
              ['all', 'Semua'],
              ['active', 'Aktif'],
              ['attention', 'Perlu perhatian'],
            ] as Array<[PersonaFilter, string]>).map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${filter === value ? 'bg-white text-[#d71920] shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-neutral-500">{filteredPersonas.length} ditampilkan</span>
        </div>

        {/* Personas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-xs text-neutral-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#d71920] mb-2" />
              <span>Memuat daftar persona AI...</span>
            </div>
          ) : filteredPersonas.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-neutral-500">
              <Sparkles className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
              <p className="font-medium text-neutral-700">
                {search || filter !== 'all' ? 'Tidak ada persona yang cocok dengan pencarian atau filter.' : 'Belum ada persona AI yang dikonfigurasi.'}
              </p>
              {(search || filter !== 'all') && (
                <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-3 font-bold text-[#d71920]">Reset pencarian</button>
              )}
            </div>
          ) : (
            filteredPersonas.map((persona) => {
              const isSelected = selectedPersona?.id === persona.id;

              return (
                <button
                  type="button"
                  key={persona.id}
                  onClick={() => handleSelectPersona(persona)}
                  aria-label={`Konfigurasi ${persona.public_name}`}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                    isSelected
                      ? 'border-[#d71920] bg-[#fffbf7] shadow-md ring-2 ring-[#d71920]/20'
                      : 'border-[#ebdccc] bg-white hover:border-[#d71920]/60 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      {persona.image_url ? (
                        <img src={persona.image_url} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white shadow-sm" />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#832729] to-[#d71920] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          <Sparkles className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-mono">
                          {persona.persona_version || 'v1.0'}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${persona.governance_status === 'active' && persona.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${persona.governance_status === 'active' && persona.is_published ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {persona.governance_status === 'active' && persona.is_published ? 'Aktif' : 'Perlu ditinjau'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#2e2620]">{persona.public_name}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">{persona.title || 'Persona Budaya'}</p>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">/{persona.slug}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-neutral-100 text-xs flex justify-between">
                      <span className="text-neutral-500">Sumber RAG:</span>
                      <span className="font-bold text-emerald-700">
                        {persona.active_knowledge_count} aktif
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-600">
                      {persona.pending_bindings_count} menunggu kurasi
                    </span>
                    <span className="font-bold text-[#d71920] inline-flex items-center gap-1">
                      <span>Konfigurasi</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Persona Bindings Workspace */}
        {selectedPersona && personaForm && createPortal((
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1f2937]/60 p-3 backdrop-blur-sm sm:p-6" role="presentation">
            <div className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-[#ebdccc] bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200" role="dialog" aria-modal="true" aria-labelledby="persona-dialog-title">
            <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-neutral-100 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                {selectedPersona.image_url ? (
                  <img src={selectedPersona.image_url} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d71920] text-white"><Sparkles className="h-5 w-5" /></div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono">
                    Target Persona
                  </span>
                  <span className="text-xs font-bold text-[#d71920]">
                    {selectedPersona.public_name}
                  </span>
                  {hasUnsavedChanges && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Perubahan belum disimpan</span>}
                  </div>
                  <h2 id="persona-dialog-title" className="mt-1 text-lg font-bold text-[#2e2620]">
                    Konfigurasi AI Persona
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closePersonaPanel}
                aria-label="Tutup konfigurasi persona"
                className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800 sm:static"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
            {formError && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800" role="alert">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800" role="status">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <nav className="sticky top-[81px] z-[9] -mx-5 overflow-x-auto border-y border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6" aria-label="Bagian konfigurasi persona">
              <div className="mx-auto flex min-w-max max-w-4xl gap-2">
                {([
                  ['identity', '1', 'Identitas', 'Nama, peran, dan kepribadian'],
                  ['language', '2', 'Bahasa & Perilaku', 'Bahasa, respons, dan batasan'],
                  ['voice', '3', 'Suara & Preview', 'Karakter suara dan kalibrasi'],
                  ['validation', '4', 'Validasi', 'Persetujuan perwakilan budaya'],
                ] as const).map(([section, number, label, description]) => {
                  const isActive = activeFormSection === section;
                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveFormSection(section)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${isActive ? 'border-[#d71920]/30 bg-red-50 text-[#b9151b]' : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-[#d71920] text-white' : 'bg-neutral-100 text-neutral-500'}`}>{number}</span>
                      <span>
                        <span className="block text-xs font-bold">{label}</span>
                        <span className="hidden text-[10px] font-normal opacity-70 lg:block">{description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5">
              {(activeFormSection === 'identity' || activeFormSection === 'language') && (
              <section className="rounded-2xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-[#d71920]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#2e2620]">
                      {activeFormSection === 'identity' ? 'Identitas Persona' : 'Bahasa & Perilaku'}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      {activeFormSection === 'identity'
                        ? 'Tetapkan siapa persona ini dan bagaimana karakternya.'
                        : 'Atur cara persona menyampaikan jawaban kepada pengguna.'}
                    </p>
                  </div>
                </div>
                {activeFormSection === 'identity' && (
                  <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-700">Nama Persona
                    <input value={personaForm.publicName} onChange={(e) => updateForm('publicName', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Versi
                    <input value={personaForm.personaVersion} onChange={(e) => updateForm('personaVersion', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                </div>
                <label className="text-xs font-semibold text-neutral-700 block">Peran
                  <input value={personaForm.title} onChange={(e) => updateForm('title', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <label className="text-xs font-semibold text-neutral-700 block">Biografi
                  <textarea rows={3} value={personaForm.bio} onChange={(e) => updateForm('bio', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <label className="text-xs font-semibold text-neutral-700 block">Kepribadian
                  <textarea rows={2} value={personaForm.personality} onChange={(e) => updateForm('personality', e.target.value)} placeholder="Hangat, bijaksana, mengayomi..." className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                  </>
                )}
                {activeFormSection === 'language' && (
                  <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-700">Bahasa Utama
                    <input value={personaForm.preferredLanguage} onChange={(e) => updateForm('preferredLanguage', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Panjang Jawaban
                    <select value={personaForm.responseLength} onChange={(e) => updateForm('responseLength', e.target.value as PersonaForm['responseLength'])} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal">
                      <option value="singkat">Singkat</option><option value="sedang">Sedang</option><option value="mendalam">Mendalam</option>
                    </select>
                  </label>
                </div>
                <label className="text-xs font-semibold text-neutral-700 block">Gaya Bahasa
                  <textarea rows={2} value={personaForm.languageStyle} onChange={(e) => updateForm('languageStyle', e.target.value)} placeholder="Bahasa Sunda alami dan sopan..." className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <label className="text-xs font-semibold text-neutral-700 block">Kosakata Khas <span className="font-normal text-neutral-400">(pisahkan dengan koma)</span>
                  <input value={personaForm.vocabulary} onChange={(e) => updateForm('vocabulary', e.target.value)} placeholder="sampurasun, punten, mangga" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <label className="text-xs font-semibold text-neutral-700 block">Sikap & Empati
                  <textarea rows={2} value={personaForm.empathyStyle} onChange={(e) => updateForm('empathyStyle', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-700">Gaya Humor
                    <input value={personaForm.humorStyle} onChange={(e) => updateForm('humorStyle', e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Emoji
                    <select value={personaForm.emojiPolicy} onChange={(e) => updateForm('emojiPolicy', e.target.value as PersonaForm['emojiPolicy'])} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal">
                      <option value="tanpa_emoji">Tanpa emoji</option><option value="jarang">Jarang</option><option value="wajar">Wajar</option>
                    </select>
                  </label>
                </div>
                <label className="text-xs font-semibold text-neutral-700 block">Batasan Persona <span className="font-normal text-neutral-400">(satu per baris)</span>
                  <textarea rows={4} value={personaForm.boundaries} onChange={(e) => updateForm('boundaries', e.target.value)} placeholder={'Jangan mengaku manusia\nJangan mengarang tradisi'} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                  </>
                )}
              </section>
              )}

              {(activeFormSection === 'voice' || activeFormSection === 'validation') && (
              <section className="rounded-2xl border border-neutral-200 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#d71920]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#2e2620]">
                      {activeFormSection === 'voice' ? 'Suara & Kalibrasi' : 'Validasi Perwakilan Budaya'}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      {activeFormSection === 'voice'
                        ? 'Pilih karakter suara, atur pembawaan, lalu bandingkan hasil preview.'
                        : 'Simpan hasil peninjauan suara oleh narasumber atau kurator budaya.'}
                    </p>
                  </div>
                </div>
                {activeFormSection === 'voice' && (
                  <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-700">Suara Gemini
                    <select value={personaForm.voiceName} onChange={(e) => {
                      const nextVoice = e.target.value;
                      updateForm('voiceName', nextVoice);
                      if (comparisonVoice === nextVoice) {
                        setComparisonVoice(nextVoice === 'Aoede' ? 'Sulafat' : 'Aoede');
                      }
                    }} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal">
                      {voiceOptions.map((voice) => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Model TTS
                    <select value={personaForm.ttsModel} onChange={(e) => updateForm('ttsModel', e.target.value as PersonaForm['ttsModel'])} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal">
                      <option value="gemini-3.8-flash-tts">3.8 Flash — kualitas</option><option value="gemini-3.8-flash-lite-tts">3.8 Flash-Lite — hemat</option>
                    </select>
                  </label>
                </div>
                <label className="text-xs font-semibold text-neutral-700 block">Gaya Suara
                  <textarea rows={3} value={personaForm.speakingStyle} onChange={(e) => updateForm('speakingStyle', e.target.value)} placeholder="Hangat, lembut, santun, dengan jeda napas alami..." className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-700">Pitch / Intonasi
                    <input value={personaForm.pitchDescriptor} onChange={(e) => updateForm('pitchDescriptor', e.target.value)} placeholder="Sedang, lembut" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Tempo ({personaForm.speakingRate.toFixed(2)}×)
                    <input type="range" min="0.7" max="1.3" step="0.01" value={personaForm.speakingRate} onChange={(e) => updateForm('speakingRate', Number(e.target.value))} className="mt-3 w-full accent-[#d71920]" />
                  </label>
                </div>
                <details
                  open={isAdvancedVoiceOpen}
                  onToggle={(event) => setIsAdvancedVoiceOpen(event.currentTarget.open)}
                  className="group rounded-2xl border border-neutral-200 bg-neutral-50/60"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <span>
                      <span className="block text-xs font-bold text-[#2e2620]">Kalibrasi Suara Lanjutan</span>
                      <span className="mt-0.5 block text-[10px] font-normal text-neutral-500">Dialek, timbre, artikulasi, jeda, dan pelafalan khusus.</span>
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-neutral-500 shadow-sm group-open:bg-[#1E315A] group-open:text-white">
                      <span className="group-open:hidden">Buka pengaturan</span>
                      <span className="hidden group-open:inline">Tutup pengaturan</span>
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-neutral-200 bg-white px-4 py-4">
                    <p className="text-[11px] leading-relaxed text-neutral-500">
                      Gunakan pengaturan ini setelah suara dasar dipilih. Hindari penguatan dialek yang berlebihan atau karikatural.
                    </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-neutral-700">Dialek / Wilayah
                    <input value={personaForm.dialectRegion} onChange={(e) => updateForm('dialectRegion', e.target.value)} placeholder="Contoh: Sunda Priangan" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Kematangan Vokal
                    <select value={personaForm.vocalMaturity} onChange={(e) => updateForm('vocalMaturity', e.target.value as PersonaForm['vocalMaturity'])} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal">
                      <option value="muda">Muda</option><option value="dewasa">Dewasa</option><option value="matang">Matang</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Warna Suara / Timbre
                    <input value={personaForm.timbreDescriptor} onChange={(e) => updateForm('timbreDescriptor', e.target.value)} placeholder="Hangat, jernih, sedikit rendah" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Energi
                    <select value={personaForm.energyLevel} onChange={(e) => updateForm('energyLevel', e.target.value as PersonaForm['energyLevel'])} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal">
                      <option value="rendah">Tenang</option><option value="sedang">Seimbang</option><option value="tinggi">Ekspresif</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Artikulasi
                    <input value={personaForm.articulationStyle} onChange={(e) => updateForm('articulationStyle', e.target.value)} placeholder="Jelas, lembut, konsonan tidak berlebihan" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="text-xs font-semibold text-neutral-700">Pola Jeda
                    <input value={personaForm.pauseStyle} onChange={(e) => updateForm('pauseStyle', e.target.value)} placeholder="Jeda reflektif antarkalimat" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  </label>
                </div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Intensitas Nuansa Dialek ({personaForm.accentIntensity}%)
                  <input type="range" min="0" max="100" step="5" value={personaForm.accentIntensity} onChange={(e) => updateForm('accentIntensity', Number(e.target.value))} className="mt-2 w-full accent-[#d71920]" />
                  <span className="mt-1 flex justify-between text-[10px] font-normal text-neutral-400"><span>Netral</span><span>Ringan</span><span>Lebih terasa</span></span>
                </label>
                <label className="block text-xs font-semibold text-neutral-700">Panduan Pelafalan
                  <textarea rows={3} value={personaForm.pronunciationGuide} onChange={(e) => updateForm('pronunciationGuide', e.target.value)} placeholder={'sampurasun = sam-pu-ra-sun\nPangeusi = pa-ngeu-si'} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" />
                  <span className="mt-1 block text-[10px] font-normal text-neutral-400">Satu istilah per baris dengan format: istilah = cara baca.</span>
                </label>
                  </div>
                </details>
                  </>
                )}
                {activeFormSection === 'validation' && (
                  <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Suara</p>
                    <p className="mt-1 text-xs font-bold text-neutral-800">{personaForm.voiceName}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Dialek</p>
                    <p className="mt-1 truncate text-xs font-bold text-neutral-800">{personaForm.dialectRegion || 'Belum diatur'}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Pelafalan</p>
                    <p className="mt-1 text-xs font-bold text-neutral-800">{parsePronunciationGuide(personaForm.pronunciationGuide).length} istilah</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-amber-900">Validasi Perwakilan Budaya</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-amber-800/70">Catat hasil peninjauan pembawaan dan pelafalan oleh narasumber yang relevan.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-neutral-700">Status
                      <select value={personaForm.voiceValidationStatus} onChange={(e) => updateForm('voiceValidationStatus', e.target.value as PersonaForm['voiceValidationStatus'])} className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 font-normal">
                        <option value="draft">Belum dikalibrasi</option><option value="reviewed">Sudah direview</option><option value="approved">Disetujui narasumber</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-neutral-700">Nama Validator
                      <input value={personaForm.voiceValidator} onChange={(e) => updateForm('voiceValidator', e.target.value)} placeholder="Nama narasumber / kurator" className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 font-normal" />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-neutral-700">Catatan Validasi
                    <textarea rows={2} value={personaForm.voiceValidationNotes} onChange={(e) => updateForm('voiceValidationNotes', e.target.value)} placeholder="Catatan pelafalan, intonasi, atau bagian yang perlu diperbaiki..." className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 font-normal" />
                  </label>
                </div>
                  </>
                )}
                {activeFormSection === 'voice' && (
                  <>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3 text-[11px] leading-relaxed text-blue-800">
                  <strong>Suara Gemini</strong> menentukan warna suara dasar. Gaya suara, pitch, tempo, dan kosakata mengatur pembawaan persona; ini bukan cloning suara manusia tertentu.
                </div>
                <div className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-semibold text-neutral-700">Skenario Preview
                      <select value={previewScenario} onChange={(e) => {
                        clearVoicePreviews();
                        setPreviewScenario(e.target.value as VoicePreviewScenario);
                      }} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-normal">
                        <option value="greeting">Sapaan khas</option><option value="culture">Penjelasan budaya</option><option value="pronunciation">Istilah daerah</option><option value="empathy">Respons empatik</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-neutral-700">Suara Pembanding
                      <select value={comparisonVoice} onChange={(e) => {
                        if (comparisonAudioUrl) URL.revokeObjectURL(comparisonAudioUrl);
                        setComparisonAudioUrl(null);
                        setComparisonModel(null);
                        setComparisonVoice(e.target.value);
                      }} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 font-normal">
                        {voiceOptions.filter((voice) => voice.value !== personaForm.voiceName).map((voice) => <option key={voice.value} value={voice.value}>{voice.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <p className="rounded-xl bg-white px-3 py-2 text-[11px] leading-relaxed text-neutral-600">
                    {buildVoicePreviewText(previewScenario, selectedPersona, personaForm)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
                      <p className="text-[11px] font-bold text-neutral-700">A · {personaForm.voiceName}</p>
                      <button type="button" onClick={() => void handlePreviewVoice('primary')} disabled={previewingVoice !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d71920]/30 bg-red-50 px-3 py-2 text-xs font-bold text-[#b9151b] transition hover:bg-red-100 disabled:opacity-50">
                        {previewingVoice === 'primary' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                        {previewingVoice === 'primary' ? 'Membuat...' : 'Preview Utama'}
                      </button>
                      {previewAudioUrl && <audio src={previewAudioUrl} controls className="h-9 w-full" aria-label={`Preview suara ${personaForm.voiceName}`} />}
                      {previewModel && <p className="text-[10px] text-neutral-500">Model: <span className="font-mono">{previewModel}</span>{previewModel !== personaForm.ttsModel && <span className="font-semibold text-amber-700"> · fallback</span>}</p>}
                    </div>
                    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
                      <p className="text-[11px] font-bold text-neutral-700">B · {comparisonVoice}</p>
                      <button type="button" onClick={() => void handlePreviewVoice('comparison')} disabled={previewingVoice !== null} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E315A]/20 bg-[#1E315A]/5 px-3 py-2 text-xs font-bold text-[#1E315A] transition hover:bg-[#1E315A]/10 disabled:opacity-50">
                        {previewingVoice === 'comparison' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                        {previewingVoice === 'comparison' ? 'Membuat...' : 'Preview Pembanding'}
                      </button>
                      {comparisonAudioUrl && <audio src={comparisonAudioUrl} controls className="h-9 w-full" aria-label={`Preview suara ${comparisonVoice}`} />}
                      {comparisonModel && <p className="text-[10px] text-neutral-500">Model: <span className="font-mono">{comparisonModel}</span>{comparisonModel !== personaForm.ttsModel && <span className="font-semibold text-amber-700"> · fallback</span>}</p>}
                    </div>
                  </div>
                </div>
                  </>
                )}
              </section>
              )}
            </div>

            <div className="sticky bottom-0 z-[8] -mx-5 flex flex-col-reverse justify-between gap-3 border-t border-neutral-100 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:px-6">
              {activeFormSection === 'validation' ? (
                <button
                  type="button"
                  onClick={handleDeletePersona}
                  disabled={deletingPersona}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingPersona ? 'Menghapus...' : 'Hapus Persona'}
                </button>
              ) : (
                <p className="text-center text-[11px] font-semibold text-neutral-400 sm:text-left">
                  Langkah {activeFormSectionIndex + 1} dari {personaFormSections.length}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={closePersonaPanel} className="rounded-xl px-5 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-100">
                  Tutup
                </button>
                {activeFormSectionIndex > 0 && (
                  <button type="button" onClick={() => setActiveFormSection(personaFormSections[activeFormSectionIndex - 1])} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold text-neutral-600 transition hover:bg-neutral-50">
                    Sebelumnya
                  </button>
                )}
                {activeFormSectionIndex < personaFormSections.length - 1 && (
                  <button type="button" onClick={() => setActiveFormSection(personaFormSections[activeFormSectionIndex + 1])} className="rounded-xl border border-[#1E315A]/15 bg-[#1E315A]/5 px-4 py-2.5 text-xs font-bold text-[#1E315A] transition hover:bg-[#1E315A]/10">
                    Lanjutkan
                  </button>
                )}
                <button type="button" onClick={handleSaveConfiguration} disabled={savingConfig || !hasUnsavedChanges} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d71920] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#b9151b] disabled:cursor-not-allowed disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {savingConfig ? 'Menyimpan...' : hasUnsavedChanges ? 'Simpan Perubahan' : 'Sudah Tersimpan'}
                </button>
              </div>
            </div>

            <div className="pt-5 border-t border-neutral-100">
              <h2 className="text-lg font-bold text-[#2e2620]">Daftar Penautan Pengetahuan</h2>
              <p className="text-xs text-neutral-500">Kelola artikel yang boleh menjadi rujukan persona ini.</p>
            </div>

            {loadingBindings ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                Memuat daftar binding untuk persona ini...
              </div>
            ) : bindings.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                <BookOpen className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                <p className="font-medium text-neutral-700">Belum ada materi pengetahuan yang ditautkan ke persona ini.</p>
                <p className="text-neutral-400 mt-0.5">
                  Pakar kontributor dapat mengajukan penautan materi berstatus approved melalui dashboard mereka.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 uppercase font-semibold text-[11px]">
                      <th className="py-3 px-3">Materi Pengetahuan</th>
                      <th className="py-3 px-3">Pakar Penulis</th>
                      <th className="py-3 px-3">Klasifikasi Budaya</th>
                      <th className="py-3 px-3">Status Binding</th>
                      <th className="py-3 px-3">Persetujuan Kurator Adat</th>
                      <th className="py-3 px-3 text-right">Tindakan Publikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {bindings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#fffbf7]/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-[#2e2620]">{b.source_title}</div>
                          <div className="text-[11px] text-neutral-500">Versi {b.version}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-medium text-[#2e2620]">{b.author_name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">/{b.author_slug}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-mono text-neutral-600">
                            {b.cultural_classification}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">{getBindingStatusBadge(b.status)}</td>
                        <td className="py-3.5 px-3">
                          {b.cultural_approved_by_name ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{b.cultural_approved_by_name}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic">Belum disetujui kurator</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {b.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleActivateBinding(b.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                              >
                                Aktifkan Publikasi
                              </button>
                            )}

                            {b.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSuspendBindingId(b.id);
                                  setSuspendReason('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all"
                              >
                                Suspend
                              </button>
                            )}

                            {b.status === 'requested' && (
                              <span className="text-[11px] text-neutral-400 italic">
                                Menunggu persetujuan adat
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
            </div>
          </div>
        ), document.body)}

        {/* Suspend Binding Modal */}
        {suspendBindingId && selectedPersona && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#2e2620]">Penangguhan Penautan Persona</h3>
                </div>
                <button
                  onClick={() => setSuspendBindingId(null)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <p className="text-neutral-600 leading-relaxed">
                  Menangguhkan penautan ini akan seketika mengecualikan artikel dari rujukan Persona{' '}
                  <span className="font-bold">{selectedPersona.public_name}</span> pada kueri berikutnya.
                </p>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">
                    Alasan Penangguhan (Wajib, min. 5 karakter)
                  </label>
                  <textarea
                    rows={3}
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Contoh: Penyelarasan ulang narasi adat..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs text-[#2e2620] focus:outline-none focus:border-[#d71920]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSuspendBindingId(null)}
                  className="px-3.5 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSuspendBindingSubmit}
                  disabled={suspending || suspendReason.trim().length < 5}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm disabled:opacity-50"
                >
                  {suspending ? 'Memproses...' : 'Tangguhkan Binding'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminPersonas;
