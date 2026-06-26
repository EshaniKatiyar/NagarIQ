/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com', 'res.cloudinary.com'] },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
export default nextConfig
