import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pplpouzcpffeynrskcmg.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/carousel/**",
      },
      {
        protocol: "https",
        hostname: "pplpouzcpffeynrskcmg.supabase.co",
        port: "",
        pathname: "/storage/v1/render/image/public/carousel/**",
      },
      {
        protocol: "https",
        hostname: "pplpouzcpffeynrskcmg.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/products/**",
      },
    ],
  },
};

export default nextConfig;
