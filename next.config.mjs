/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pg tem require dinamico — mantem como pacote externo do servidor (nao bundla).
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
};

export default nextConfig;
