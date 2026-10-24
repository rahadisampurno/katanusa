import {
  Camera,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import network from '../../libs/network';

export interface PhotoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  shape?: 'circle' | 'portrait' | 'rounded';
  className?: string;
  disabled?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  value,
  onChange,
  label = 'Foto Profil / Potret Budaya',
  hint = 'Unggah foto resmi atau potret adat (format JPG, PNG, WebP maks. 5 MB).',
  shape = 'portrait',
  className = '',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync internal preview if external value changes
  useEffect(() => {
    if (value !== undefined) {
      setPreviewUrl(value);
    }
  }, [value]);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validasi tipe berkas
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!validTypes.includes(file.type) && (!ext || !validExts.includes(ext))) {
      setError('Format berkas tidak didukung. Harap pilih gambar JPG, PNG, atau WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validasi ukuran (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto melebihi batas 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Tampilkan pratinjau instan di browser
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Jangan tetapkan Content-Type secara manual agar Axios/browser otomatis menyertakan multipart boundary
      const res = await network.post<{
        success: boolean;
        url: string;
        filename: string;
        message?: string;
      }>('/upload/photo', formData);

      if (res.data?.url) {
        setPreviewUrl(res.data.url);
        onChange(res.data.url);
      } else {
        throw new Error('Gagal menerima URL foto dari server.');
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Gagal mengunggah foto. Pastikan koneksi server aktif.';
      setError(msg);
      // Revert preview jika gagal
      setPreviewUrl(value || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onChange(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const shapeClass =
    shape === 'circle'
      ? 'w-28 h-28 rounded-full'
      : shape === 'rounded'
        ? 'w-32 h-32 rounded-2xl'
        : 'w-36 h-48 rounded-2xl'; // portrait ratio

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#b91c1c]" />
            <span>{label}</span>
          </label>
          {previewUrl && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex min-h-11 items-center gap-1 text-[11px] font-medium text-red-600 transition-colors hover:text-red-700 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Foto</span>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Pratinjau Foto / Dropzone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (!disabled && !isUploading) fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group cursor-pointer overflow-hidden border-2 transition-all flex items-center justify-center shrink-0 ${shapeClass} ${
            isDragOver
              ? 'border-[#b91c1c] bg-red-50/40 scale-102 ring-4 ring-red-100'
              : previewUrl
                ? 'border-gray-200 bg-gray-100 shadow-sm'
                : 'border-dashed border-gray-300 bg-gray-50/80 hover:border-[#b91c1c] hover:bg-red-50/20'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Foto Profil"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {!disabled && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-2 text-center">
                  <Camera className="w-5 h-5 text-amber-300" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Ganti Foto
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-3 text-center text-gray-400 group-hover:text-[#b91c1c] transition-colors">
              <UploadCloud className="w-7 h-7 mb-1 text-gray-400 group-hover:text-[#b91c1c] group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-gray-700 leading-tight">
                Pilih Foto
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5">atau seret ke sini</span>
            </div>
          )}

          {/* Overlay Loading Spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-[#b91c1c] z-20">
              <Loader2 className="w-6 h-6 animate-spin text-[#b91c1c]" />
              <span className="text-[10px] font-semibold text-gray-700">Mengunggah...</span>
            </div>
          )}
        </div>

        {/* Info & Tombol Aksi Manual */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <p className="text-xs text-gray-500 leading-relaxed">{hint}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>{previewUrl ? 'Ganti Berkas Foto' : 'Unggah Potret'}</span>
            </button>

            {previewUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Foto Siap Digunakan</span>
              </span>
            )}
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5 mt-2">
              <X className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default PhotoUpload;
