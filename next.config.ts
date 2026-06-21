import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iszdahyvlkigezumpeki.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  /**
   * Disable response buffering on Nginx and similar reverse proxies.
   * Without this, chunked Transfer-Encoding responses are buffered before
   * being forwarded to the client, negating the benefits of React streaming.
   */
  async headers() {
    return [
      {
        source: "/:path*{/}?",
        headers: [
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
