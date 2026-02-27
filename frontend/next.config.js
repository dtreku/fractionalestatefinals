/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config) => {
    // Fix for MetaMask SDK and other Web3 packages
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      encoding: false,
      crypto: false,
      stream: false,
      assert: false,
      http: false,
      https: false,
      os: false,
      url: false,
      zlib: false,
    };
    
    // Ignore React Native modules in browser build
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };
    
    // Externalize problematic modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    return config;
  },
  
  // Suppress specific warnings
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;