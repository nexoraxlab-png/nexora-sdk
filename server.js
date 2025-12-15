import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ----- CONFIG -----
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.base_url || `http://localhost:${PORT}`;

// استخدمي Disk في Render وركّبيه مثلاً على /var/data
const STORAGE_DIR = process.env.STORAGE_DIR || "/var/data/videos";

// حماية بسيطة (اختيارية)
const X_API_KEY = process.env["x-api-key"] || "";

// ----- INIT -----
ffmpeg.setFfmpegPath(ffmpegPath);

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve generated videos
app.use("/videos", express.static(STORAGE_DIR));

const jobs = new Map(); // in-memory for now (OK for MVP)

// ----- HELPERS -----
function requireApiKey(req) {
  if (!X_API_KEY) return true; // إذا ما حطيتي مفتاح، ما نطلبه
  return req.headers["x-api-key"] === X_API_KEY;
}

function makeJobId() {
  return `job_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function renderSimpleVideo({ job_id, duration_sec = 6, title = "Nexora Video" }) {
  const outName = `${job_id}.mp4`;
  const outPath = path.join(STORAGE_DIR, outName);

  // فيديو بسيط: خلفية لون + نص (بدون صور/صوت) => يثبت أن التوليد يعمل
  // drawtext يحتاج خط. على Linux غالباً DejaVu موجود. إذا فشل سنغيره لاحقاً.
  const fontPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`color=c=black:s=1280x720:d=${duration_sec}`)
      .inputFormat("lavfi")
      .outputOptions([
        "-pix_fmt yuv420p",
        "-r 30",
        `-vf drawtext=fontfile=${fontPath}:text='${title.replace(/:/g, " ")}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`,
      ])
      .on("end", () => resolve({ outPath, outName }))
      .on("error", (err) => reject(err))
      .save(outPath);
  });
}

// ----- ROUTES -----
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "nexora-sdk-core",
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

// 1) Create job (POST)
app.post("/api/generate-video", async (req, res) => {
  if (!requireApiKey(req)) {
    return res.status(401).json({ success: false, error: "UNAUTHORIZED" });
  }

  const { duration_sec = 6, title = "Nexora Video" } = req.body || {};
  const job_id = makeJobId();

  jobs.set(job_id, {
    job_id,
    status: "queued",
    created_at: new Date().toISOString(),
    duration_sec,
    title,
    video_url: null,
    error: null,
  });

  // تشغيل التوليد async
  setImmediate(async () => {
    try {
      const job = jobs.get(job_id);
      if (!job) return;
      job.status = "processing";
      jobs.set(job_id, job);

      const { outName } = await renderSimpleVideo({ job_id, duration_sec, title });

      job.status = "done";
      job.video_url = `${BASE_URL}/videos/${outName}`;
      jobs.set(job_id, job);
    } catch (e) {
      const job = jobs.get(job_id);
      if (!job) return;
      job.status = "failed";
      job.error = String(e?.message || e);
      jobs.set(job_id, job);
    }
  });

  return res.status(200).json({
    success: true,
    status: "queued",
    job_id,
    received: { duration_sec, title },
    check_url: `${BASE_URL}/api/job/${job_id}`,
  });
});

// 2) Check job (GET)  ✅ هذا الذي كان ناقص عندك
app.get("/api/job/:job_id", (req, res) => {
  const { job_id } = req.params;
  if (!jobs.has(job_id)) {
    return res.status(404).json({ success: false, error: "JOB_NOT_FOUND" });
  }
  return res.json({ success: true, job: jobs.get(job_id) });
});

app.listen(PORT, () => {
  console.log(`✅ nexora-sdk-core running on port ${PORT}`);
});
