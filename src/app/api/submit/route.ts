import { spawn } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const move = formData.get("move") as string;

    if (!file || !move) {
      return NextResponse.json(
        { error: "Thiếu video hoặc tên động tác" },
        { status: 400 }
      );
    }


    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }


    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const studentPath = path.join(uploadDir, file.name);
    await writeFile(studentPath, buffer);

    const samplePath = path.join(process.cwd(), "samples", `${move}.mp4`);

    const scriptPath = path.join(process.cwd(), "python", "analyze.py");
    console.log("Running:", [scriptPath, studentPath, samplePath]);

    const result = await new Promise<unknown>((resolve, reject) => {
      const py = spawn("python3.10", [scriptPath, studentPath, samplePath]);

      let output = "";
      let errorOutput = "";

      py.stdout.on("data", (data) => {
        console.log("[Python stdout]:", data.toString());
        output += data.toString();
      });

      py.stderr.on("data", (data) => {
        console.error("[Python stderr]:", data.toString());
        errorOutput += data.toString();
      });

      py.on("close", (code) => {
        console.log("Python process exited with code:", code);
        if (code === 0) {
          try {
            resolve(JSON.parse(output)); // Parse success
          } catch {
            console.log("cannot parse")
            resolve(output); // Cannot parse
          }
        } else {
          reject(new Error(errorOutput || "Python script error"));
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}