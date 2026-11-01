// Oddiy mock API proxy: faqat /auth/me/ ga muvaffaqiyatli javob qaytaradi.
import http from "http";

const PORT = process.env.PORT || 8001;

const mockUser = {
  id: 1,
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  full_name: "Test User",
  role: "student",
  group: 3,
  group_detail: { id: 3, name: "IELTS-1", slug: "ielts-1", group_type: "ielts" },
  is_blocked: false,
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/auth/me/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(mockUser));
    return;
  }

  // Boshqa endpointlar uchun 200 OK bo'sh obyekt
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({}));
});

server.listen(PORT, () => {
  console.log(`Mock API server listening on http://127.0.0.1:${PORT}`);
});
