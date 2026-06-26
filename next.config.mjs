/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { 
    domains: [
      'firebasestorage.googleapis.com', 
      'lh3.googleusercontent.com', 
      'res.cloudinary.com'
    ] 
  }
}
export default nextConfig