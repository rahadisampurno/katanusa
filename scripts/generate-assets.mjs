import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const pakarVirtualDir = path.resolve('public/assets/pakar-virtual');
const pakarNyataDir = path.resolve('public/assets/pakar-nyata');

if (!fs.existsSync(pakarVirtualDir)) fs.mkdirSync(pakarVirtualDir, { recursive: true });
if (!fs.existsSync(pakarNyataDir)) fs.mkdirSync(pakarNyataDir, { recursive: true });

const virtualPersonas = [
  {
    filenames: ['10-teungku-meurah.png', 'teungku-meurah.png', '10-teungku-meurah.webp'],
    name: 'Teungku Meurah',
    role: 'Pakar Budaya Aceh',
    suku: 'Aceh',
    initials: 'TM',
    bgStart: '#0f382c',
    bgEnd: '#1b4332',
    accent: '#e0a96d',
    symbolText: 'ACEH',
    badgeText: 'Rencong & Hikayat',
  },
  {
    filenames: ['11-bli-komang.png', 'bli-komang.png', '11-bli-komang.webp'],
    name: 'Bli Komang',
    role: 'Pakar Budaya Bali',
    suku: 'Bali',
    initials: 'BK',
    bgStart: '#590d22',
    bgEnd: '#800f2f',
    accent: '#ffb703',
    symbolText: 'BALI',
    badgeText: 'Tri Hita Karana',
  },
  {
    filenames: ['12-bung-kapitan.png', 'bung-kapitan.png', '12-bung-kapitan.webp'],
    name: 'Bung Kapitan',
    role: 'Pakar Budaya Maluku',
    suku: 'Maluku',
    initials: 'BK',
    bgStart: '#002855',
    bgEnd: '#034078',
    accent: '#fca311',
    symbolText: 'MALUKU',
    badgeText: 'Pela Gandong',
  },
  {
    filenames: ['13-pace-mambri.png', 'pace-mambri.png', '13-pace-mambri.webp'],
    name: 'Pace Mambri',
    role: 'Pakar Budaya Papua',
    suku: 'Papua',
    initials: 'PM',
    bgStart: '#7f292c',
    bgEnd: '#a23e48',
    accent: '#fefae0',
    symbolText: 'PAPUA',
    badgeText: 'Noken & Asmat',
  },
  {
    filenames: ['ambu-pangeusi.png', 'ambu-pangeusi.webp'],
    name: 'Ambu Pangeusi',
    role: 'Pakar Budaya Sunda',
    suku: 'Sunda',
    initials: 'AP',
    bgStart: '#1b4931',
    bgEnd: '#2d6a4f',
    accent: '#f3c68f',
    symbolText: 'SUNDA',
    badgeText: 'Someah Hade Basa',
  },
  {
    filenames: ['ki-waskita.png', 'ki-waskita.webp'],
    name: 'Ki Waskita',
    role: 'Pakar Budaya Jawa',
    suku: 'Jawa',
    initials: 'KW',
    bgStart: '#3d2616',
    bgEnd: '#583119',
    accent: '#e9c46a',
    symbolText: 'JAWA',
    badgeText: 'Batik & Wayang',
  },
  {
    filenames: ['oppung-hasian.png', 'oppung-hasian.webp'],
    name: 'Oppung Hasian',
    role: 'Pakar Budaya Batak',
    suku: 'Batak',
    initials: 'OH',
    bgStart: '#6a040f',
    bgEnd: '#9d0208',
    accent: '#f6bd60',
    symbolText: 'BATAK',
    badgeText: 'Ulos & Dalihan Na Tolu',
  },
  {
    filenames: ['ra-tretan.webp', 'ra-tretan.png'],
    name: 'Ra Tretan',
    role: 'Pakar Budaya Madura',
    suku: 'Madura',
    initials: 'RT',
    bgStart: '#851414',
    bgEnd: '#1e1e24',
    accent: '#ffb703',
    symbolText: 'MADURA',
    badgeText: 'Odheng & Karapan',
  },
  {
    filenames: ['encang-jago.png', 'encang-jago.webp'],
    name: 'Encang Jago',
    role: 'Pakar Budaya Betawi',
    suku: 'Betawi',
    initials: 'EJ',
    bgStart: '#9a3412',
    bgEnd: '#c2410c',
    accent: '#fde047',
    symbolText: 'BETAWI',
    badgeText: 'Palang Pintu & Pantun',
  },
  {
    filenames: ['bundo-cadiak.webp', 'bundo-cadiak.png'],
    name: 'Bundo Cadiak',
    role: 'Pakar Budaya Minangkabau',
    suku: 'Minang',
    initials: 'BC',
    bgStart: '#701a75',
    bgEnd: '#86198f',
    accent: '#facc15',
    symbolText: 'MINANG',
    badgeText: 'Rumah Gadang & Adat',
  },
  {
    filenames: ['datu-lontara.webp', 'datu-lontara.png'],
    name: 'Datu Lontara',
    role: 'Pakar Budaya Bugis',
    suku: 'Bugis',
    initials: 'DL',
    bgStart: '#4c1d95',
    bgEnd: '#581c87',
    accent: '#fbbf24',
    symbolText: 'BUGIS',
    badgeText: 'Lontara & Pinisi',
  },
  {
    filenames: ['panglima-borneo.webp', 'panglima-borneo.png'],
    name: 'Panglima Borneo',
    role: 'Pakar Budaya Dayak',
    suku: 'Dayak',
    initials: 'PB',
    bgStart: '#14532d',
    bgEnd: '#166534',
    accent: '#fde047',
    symbolText: 'DAYAK',
    badgeText: 'Telabang & Enggang',
  },
  {
    filenames: ['kongco-kasenian.webp', 'kongco-kasenian.png'],
    name: 'Kongco Kesenian',
    role: 'Pakar Akulturasi Tionghoa',
    suku: 'Tionghoa Nusantara',
    initials: 'KK',
    bgStart: '#7f1d1d',
    bgEnd: '#991b1b',
    accent: '#fbbf24',
    symbolText: 'PERANAKAN',
    badgeText: 'Akulturasi Nusantara',
  },
  {
    filenames: ['penyimbang-sai.png', 'penyimbang-sai.webp'],
    name: 'Penyimbang Sai',
    role: 'Pakar Budaya Lampung',
    suku: 'Lampung',
    initials: 'PS',
    bgStart: '#713f12',
    bgEnd: '#854d0e',
    accent: '#fef08a',
    symbolText: 'LAMPUNG',
    badgeText: 'Siger & Piil Pesenggiri',
  },
  {
    filenames: ['opu-motololo.webp', 'opu-motololo.png'],
    name: 'Opu Motololo',
    role: 'Pakar Budaya Gorontalo',
    suku: 'Gorontalo',
    initials: 'OM',
    bgStart: '#4a044e',
    bgEnd: '#701a75',
    accent: '#facc15',
    symbolText: 'GORONTALO',
    badgeText: 'Bantayo & Bili’u',
  },
  {
    filenames: ['si-ula-faulu.png', 'si-ula-faulu.webp'],
    name: 'Si Ulu Fa’ulu',
    role: 'Pakar Budaya Nias',
    suku: 'Nias',
    initials: 'SU',
    bgStart: '#854d0e',
    bgEnd: '#991b1b',
    accent: '#fef08a',
    symbolText: 'NIAS',
    badgeText: 'Fahombo & Omo Hada',
  },
  {
    filenames: ['lakina-kamali.webp', 'lakina-kamali.png'],
    name: 'Lakina Kamali',
    role: 'Pakar Budaya Buton',
    suku: 'Buton',
    initials: 'LK',
    bgStart: '#172554',
    bgEnd: '#1e3a8a',
    accent: '#fde047',
    symbolText: 'BUTON',
    badgeText: 'Keraton Wolio & Posuo',
  },
  {
    filenames: ['nai-veto.webp', 'nai-veto.png'],
    name: 'Nai Feto',
    role: 'Pakar Budaya Atoni Timor',
    suku: 'Atoni',
    initials: 'NF',
    bgStart: '#1e1b4b',
    bgEnd: '#312e81',
    accent: '#f9a8d4',
    symbolText: 'TIMOR',
    badgeText: 'Tenun Ikat & Ume Kbubu',
  },
  {
    filenames: ['magau-vunja.webp', 'magau-vunja.png'],
    name: 'Magau Vunja',
    role: 'Pakar Budaya Kaili',
    suku: 'Kaili',
    initials: 'MV',
    bgStart: '#431407',
    bgEnd: '#7c2d12',
    accent: '#fef08a',
    symbolText: 'KAILI',
    badgeText: 'Vunja & Souraja',
  },
];

const realExpertReferences = [
  { filename: 'lk-ara.png', name: 'L.K. Ara', suku: 'Aceh Gayo', initials: 'LA', bg: '#134e4a' },
  { filename: 'wayan-dibia.png', name: 'Prof. Wayan Dibia', suku: 'Bali', initials: 'WD', bg: '#831843' },
  { filename: 'rudi-fofid.png', name: 'Rudi Fofid', suku: 'Maluku', initials: 'RF', bg: '#0369a1' },
  { filename: 'enrico-kondologit.png', name: 'Enrico Kondologit', suku: 'Papua', initials: 'EK', bg: '#9a3412' },
];

function generateSvg({ name, role, suku, initials, bgStart, bgEnd, accent, symbolText, badgeText }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgStart}"/>
      <stop offset="100%" stop-color="${bgEnd}"/>
    </linearGradient>
    <linearGradient id="glow" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="motif" width="40" height="40" patternUnits="userSpaceOnUse" opacity="0.12">
      <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="${accent}" stroke-width="1.5"/>
      <circle cx="20" cy="20" r="3" fill="${accent}"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="400" height="500" fill="url(#bg)"/>
  <rect width="400" height="500" fill="url(#motif)"/>

  <!-- Top Aura -->
  <circle cx="200" cy="180" r="160" fill="url(#glow)"/>

  <!-- Cultural Frame Border -->
  <rect x="14" y="14" width="372" height="472" rx="18" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.5"/>
  <rect x="20" y="20" width="360" height="460" rx="14" fill="none" stroke="${accent}" stroke-width="1" stroke-opacity="0.25"/>

  <!-- Region / Suku Header -->
  <g transform="translate(200, 48)">
    <rect x="-70" y="-14" width="140" height="28" rx="14" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-opacity="0.6"/>
    <text text-anchor="middle" y="4" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="${accent}" letter-spacing="3">${symbolText}</text>
  </g>

  <!-- Avatar Emblem Graphic -->
  <g transform="translate(200, 195)">
    <!-- Decorative Rings -->
    <circle r="92" fill="none" stroke="${accent}" stroke-width="1" stroke-opacity="0.3" stroke-dasharray="6,4"/>
    <circle r="82" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.8"/>
    <circle r="74" fill="${bgStart}" stroke="${accent}" stroke-width="2" stroke-opacity="0.5"/>

    <!-- Subtle Halo Glow -->
    <circle r="60" fill="${accent}" fill-opacity="0.12"/>

    <!-- Cultural Crown / Headdress Ornament Motif -->
    <path d="M-45 -25 Q0 -65 45 -25 Q25 -15 0 -22 Q-25 -15 -45 -25 Z" fill="${accent}" fill-opacity="0.85"/>
    <polygon points="0,-72 -12,-50 12,-50" fill="${accent}"/>

    <!-- Avatar Initials -->
    <text text-anchor="middle" y="24" font-family="Georgia, serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="1">${initials}</text>
  </g>

  <!-- Badge Capsule -->
  <g transform="translate(200, 326)">
    <rect x="-95" y="-13" width="190" height="26" rx="13" fill="#000000" fill-opacity="0.45" stroke="${accent}" stroke-width="1" stroke-opacity="0.5"/>
    <text text-anchor="middle" y="4" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="${accent}">${badgeText}</text>
  </g>

  <!-- Name & Role Footer Card -->
  <g transform="translate(200, 395)">
    <text text-anchor="middle" y="0" font-family="Georgia, serif" font-size="24" font-weight="bold" fill="#ffffff">${name}</text>
    <text text-anchor="middle" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500" fill="#e2e8f0" fill-opacity="0.9">${role}</text>
    <text text-anchor="middle" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="${accent}">Persona Budaya Virtual • KataNusa</text>
  </g>
</svg>`;
}

console.log('Generating local assets for pakar virtual...');

for (const persona of virtualPersonas) {
  const svgContent = generateSvg(persona);
  const tempSvg = path.join('/tmp', `${persona.filenames[0]}.svg`);
  fs.writeFileSync(tempSvg, svgContent);

  try {
    execSync(`qlmanage -t -s 500 -o /tmp "${tempSvg}" 2>/dev/null`);
    const tempPng = `${tempSvg}.png`;

    for (const filename of persona.filenames) {
      const targetPath = path.join(pakarVirtualDir, filename);
      if (fs.existsSync(tempPng)) {
        fs.copyFileSync(tempPng, targetPath);
      } else {
        // Fallback: write SVG directly
        fs.writeFileSync(targetPath, svgContent);
      }
    }
    console.log(`✓ Generated ${persona.name} -> ${persona.filenames.join(', ')}`);
  } catch (err) {
    console.error(`Error generating ${persona.name}:`, err);
  }
}

// Generate pakar nyata reference placeholders if not present
for (const ref of realExpertReferences) {
  const targetPath = path.join(pakarNyataDir, ref.filename);
  if (!fs.existsSync(targetPath)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${ref.bg}"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="20" fill="url(#bg)"/>
      <circle cx="200" cy="180" r="80" fill="#ffffff" fill-opacity="0.1"/>
      <text x="200" y="200" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-weight="bold" fill="#ffffff">${ref.initials}</text>
      <text x="200" y="310" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#ffffff">${ref.name}</text>
      <text x="200" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">Budayawan ${ref.suku}</text>
    </svg>`;
    const tempSvg = `/tmp/${ref.filename}.svg`;
    fs.writeFileSync(tempSvg, svg);
    execSync(`qlmanage -t -s 400 -o /tmp "${tempSvg}" 2>/dev/null`);
    if (fs.existsSync(`${tempSvg}.png`)) {
      fs.copyFileSync(`${tempSvg}.png`, targetPath);
    } else {
      fs.writeFileSync(targetPath, svg);
    }
    console.log(`✓ Generated reference ${ref.name} -> ${ref.filename}`);
  }
}

console.log('Semua aset pakar virtual & nyata berhasil digenerate ke direktori lokal public/assets!');
