import type { MetadataRoute } from "next";

/** Lets parents "Add to Home Screen" and open the app full-screen with its icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "School Lost & Found",
    short_name: "Lost & Found",
    description: "Report lost and found items at school, privately.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#f5f5f7",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
