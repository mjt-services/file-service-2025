import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import mime from "mime-types";
import type { Router } from "../type/Router";
import { getEnv } from "../getEnv";

const ROOT_DIR = path.resolve("/files");
const PREFIX = "/file";

export const fileRoute: Router = (app) => {
  app.get(`${PREFIX}/*`, async (c) => {
    // --- AUTH CHECK ---
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.text("Unauthorized", 401);
    }
    const token = authHeader.slice("Bearer ".length).trim();
    if (token !== getEnv().NATS_AUTH_TOKEN) {
      return c.text("Invalid token", 403);
    }

    const basePath = c.req.path.slice(PREFIX.length); // keep the raw URL path after /file
    const decodedPath = decodeURIComponent(basePath || "/");

    // Clean and resolve final path on disk
    const safeRelPath = path
      .normalize(decodedPath)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.join(ROOT_DIR, safeRelPath);

    try {
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(fullPath);
        const list = files
          .map((name) => {
            const encodedName = encodeURIComponent(name);
            const href = `${PREFIX}${
              decodedPath.endsWith("/") ? decodedPath : decodedPath + "/"
            }${encodedName}`;
            return `<li><a href="${href}">${name}</a></li>`;
          })
          .join("");
        return c.html(`<h1>Index of ${decodedPath}</h1><ul>${list}</ul>`);
      }

      if (stat.isFile()) {
        const contentType = mime.lookup(fullPath) || "application/octet-stream";
        const stream = createReadStream(fullPath);

        return new Response(stream as any, {
          headers: {
            "Content-Type": contentType,
            "Content-Length": stat.size.toString(),
          },
        });
      }
    } catch (err) {
      console.error(err);
      return c.text("Not Found", 404);
    }

    return c.notFound();
  });
};
