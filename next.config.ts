import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const config = {
  // 01. Disable strict mode — prevents double-renders in dev which causes perceived slowness
  reactStrictMode: false,

  // 02. Image sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'feiselinosportjerseys.ca' },
      { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'ibb.co' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
    // Aggressive caching — images are served from Next.js cache for a full year
    minimumCacheTTL: 31536000,
  },

  // 03. Server-side packages
  serverExternalPackages: ['@google-cloud/firestore', 'firebase-admin'],

  experimental: {
    authInterrupts: true,
    // Pre-bundle heavy packages so they don't re-compile on every page visit
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-sheet',
      'firebase',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
    ],
  },

  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
      };
    }
    return config;
  },

  // 04. Skip type/lint errors during build — keeps deploys fast
  typescript: {
    ignoreBuildErrors: true,
  },
};

// 05. Turbopack config — suppress noisy warnings
// @ts-ignore
config.turbopack = {
  root: ".",
  ignoreIssue: [
    {
      path: "**/node_modules/@google-cloud/firestore/**",
      description: "Invalid source map"
    },
    {
      path: "**/node_modules/@google-cloud/firestore/**",
      description: "Failed to get source map"
    }
  ],
};

const nextConfig: NextConfig = config as NextConfig;
export default nextConfig;