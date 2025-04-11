const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { JSDOM } = require("jsdom");

const app = express();

app.use("/", createProxyMiddleware({
  target: "https://app.loykey.com",
  changeOrigin: true,
  selfHandleResponse: true,
  onProxyRes: async (proxyRes, req, res) => {
    let body = Buffer.from([]);
    proxyRes.on("data", chunk => {
      body = Buffer.concat([body, chunk]);
    });

    proxyRes.on("end", () => {
      const contentType = proxyRes.headers["content-type"];
      if (contentType && contentType.includes("text/html")) {
        const html = body.toString("utf8");
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Elimina el enlace de registro
        const regLink = document.querySelector('a[href="/registration"]');
        if (regLink) regLink.remove();

        res.setHeader("content-type", "text/html");
        res.end(dom.serialize());
      } else {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        res.end(body);
      }
    });
  }
}));

app.listen(3000, () => {
  console.log("Proxy running on port 3000");
});
