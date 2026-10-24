# KataNusa Web (Frontend)

Platform digital edukasi dan pelestarian kebudayaan Nusantara interaktif. KataNusa memungkinkan masyarakat berdialog dengan asisten AI berkarakter persona budaya daerah, mengeksplorasi artikel dan kearifan lokal, serta memesan sesi konsultasi daring bersama pakar kebudayaan nyata.

---

## 🚀 Fitur Utama

- **Pakar Budaya Virtual (AI Persona):** Berinteraksi dengan 19 persona AI yang merepresentasikan kebudayaan dari berbagai suku di Indonesia (Sunda, Jawa, Batak, Minang, Bali, Bugis, Papua, Dayak, Lampung, Gorontalo, Nias, Buton, Timor, Kaili, dll.).
- **Konsultasi Pakar Nyata:** Booking sesi privat (diskusi santai, pendalaman materi, workshop) bersama pakar dan budayawan Indonesia.
- **Sistem Pembayaran Terpadu:** Terintegrasi dengan Midtrans Snap untuk transaksi daring aman, serta dukungan fallback mode mock untuk pengujian lokal.
- **Dashboard Manajemen Booking:** Antarmuka bagi pakar dan admin untuk memantau metrik transaksi dan riwayat sesi.
- **Arsitektur Aman:**
  - Token akses standar (`access_token` via Bearer Header).
  - Tidak ada kunci API kecerdasan buatan di bundle browser; seluruh pemanggilan DeepSeek dan RAG dialirkan melalui backend.
  - Route guard otomatis untuk halaman terproteksi (`/booking-history`, `/dashboard`, `/payment/success`).

---

## 🛠️ Tech Stack

- **Framework & Bundler:** [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management & Data Fetching:** [@tanstack/react-query](https://tanstack.com/query/latest), [Zustand](https://github.com/pmndrs/zustand)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Icons & Charts:** [Lucide React](https://lucide.dev/), [Recharts](https://recharts.org/)

---

## ⚙️ Konfigurasi Environment

Salin file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Variabel yang tersedia:

| Variabel | Deskripsi | Default Lokal |
| --- | --- | --- |
| `VITE_API_URL` | URL basis endpoint REST API backend | `http://localhost:8081/api` |
| `VITE_MIDTRANS_CLIENT_KEY` | Client Key publik Midtrans (opsional; kosongkan untuk mode mock) | *(kosong)* |

> **Catatan:** Variabel lingkungan Vite dibundel pada waktu build (`build-time`).

---

## 📦 Menjalankan Proyek Secara Lokal

### 1. Instalasi Dependensi

```bash
pnpm install
# atau
npm install
```

### 2. Mode Pengembangan

```bash
pnpm dev
# atau
npm run dev
```

Aplikasi web dapat diakses pada [http://localhost:5173](http://localhost:5173).

### 3. Build Produksi & Preview

```bash
pnpm build
pnpm preview
```

---

## 🐳 Menjalankan dengan Docker

Frontend dapat dijalankan dalam kontainer Nginx:

```bash
docker compose up -d --build
```

Aplikasi akan berjalan di port `8085` ([http://localhost:8085](http://localhost:8085)).
Variabel `VITE_API_URL` disalurkan melalui `build args` sehingga file statis yang di-build memiliki konfigurasi endpoint yang tepat.
