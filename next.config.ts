import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // El modo standalone es esencial para que App Hosting empaquete correctamente el servidor
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Aseguramos que las cabeceras sean compatibles con la infraestructura de Cloud Run
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;