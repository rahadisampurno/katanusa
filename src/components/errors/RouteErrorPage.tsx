import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import {
  isChunkLoadError,
  recoverFromStaleChunk,
  retryCurrentPage,
} from '../../libs/chunkRecovery';

interface RouteErrorPageProps {
  notFound?: boolean;
}

const RouteErrorPage = ({ notFound: forcedNotFound = false }: RouteErrorPageProps) => {
  const error = useRouteError();
  const [isRecovering, setIsRecovering] = useState(false);
  const staleAsset = isChunkLoadError(error);

  useEffect(() => {
    if (recoverFromStaleChunk(error)) {
      setIsRecovering(true);
    }
  }, [error]);

  if (isRecovering) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] px-5 text-center">
        <div role="status" className="space-y-3">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#d71920]" />
          <p className="text-sm font-semibold text-slate-700">Memuat versi terbaru KataNusa…</p>
        </div>
      </main>
    );
  }

  const status = isRouteErrorResponse(error) ? error.status : null;
  const notFound = forcedNotFound || status === 404;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f8fafc] px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-[#d71920]">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#b42318]">
          {notFound ? 'Halaman tidak ditemukan' : 'Halaman belum dapat dibuka'}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {staleAsset ? 'KataNusa baru saja diperbarui' : 'Maaf, terjadi kendala sementara'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {staleAsset
            ? 'Browser belum berhasil mengambil versi terbaru. Muat ulang halaman untuk melanjutkan.'
            : 'Coba muat ulang halaman. Jika kendala berlanjut, kembali ke beranda dan coba beberapa saat lagi.'}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={retryCurrentPage}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#d71920] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#b81218]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Muat Ulang
          </button>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
};

export default RouteErrorPage;
