/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@streamforge/shared"],
  output: "standalone",
};

module.exports = nextConfig;
