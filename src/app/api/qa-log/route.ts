import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const logPath = "qa/history.json";
  const body = await req.json();

  const dirPath = path.dirname(logPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const arr = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, "utf-8"))
    : [];

  arr.push(body);
  fs.writeFileSync(logPath, JSON.stringify(arr, null, 2));

  return Response.json({ ok: true });
}

