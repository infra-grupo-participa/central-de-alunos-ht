/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // As paginas HTML nao devem ser cacheadas a longo prazo (senao um deploy novo
  // fica preso atras do cache da CDN/navegador por ate 1 ano). Os assets em
  // /_next/static/ continuam com cache imutavel (tem hash no nome, sao seguros).
  async headers() {
    const noCache = [
      { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
    ];
    return [
      { source: '/', headers: noCache },
      { source: '/login', headers: noCache },
      { source: '/trocar-senha', headers: noCache },
      { source: '/bem-vindo', headers: noCache },
    ];
  },
};

export default nextConfig;
