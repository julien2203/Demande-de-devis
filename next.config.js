/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permettre l'embed dans des iframes (pour Webflow)
  // Note: Ne pas définir X-Frame-Options permet l'embed depuis n'importe quel domaine
  // Si vous voulez restreindre, utilisez Content-Security-Policy avec frame-ancestors
  async headers() {
    return [
      {
        source: "/simulateur",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;", // Permet l'embed depuis n'importe quel domaine
          },
        ],
      },
      {
        source: "/resultat",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
