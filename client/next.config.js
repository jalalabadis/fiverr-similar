/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env:{
 SERVER_URL: "http://localhost:8747",
 SOLANA_PUBKEY: "BHRZ6PnRQRpWfxYyt3dmqi56F8Kp1CBo7qVjGxiYPvpT"
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8747",
        //pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
