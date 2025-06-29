import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable source maps for debugging in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Use the recommended source map setting for Next.js
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
  
  // Better debugging support
  productionBrowserSourceMaps: false, // Set to true if you want source maps in production
  
  // External packages for server components
  serverExternalPackages: [],
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
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
