/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env:{
 SERVER_URL: "http://localhost:8747",
 SOLANA_PUBKEY: "EVeEgzJBUb7CZohdeqFRe43hEC9grLyaGksQV7C5sKVb"
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
