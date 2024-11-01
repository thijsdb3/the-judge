export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/", // Disallow the entire site
      },
    ],
    sitemap: "https://acme.com/sitemap.xml", // Optional: you can remove this if not needed
  };
}
