import express from "express";
import cors from "cors";

const app = express();
const jobs = new Map();
/* =======================
   BASIC MIDDLEWARE
======================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* =======================
   HEALTH CHECK
======================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "nexora-sdk-core",
    status: "alive",
    timestamp: new Date().toISOString()
  });
});app.get("/api/job/:job_id", (req, res) => {
  const { job_id } = req.params;

  if (!jobs.has(job_id)) {
    return res.status(404).json({
      success: false,
      error: "JOB_NOT_FOUND"
    });
  }
app.post("/api/generate-video", (req, res) => {
  const job_id = "job_" + Date.now();

  jobs.set(job_id, {
    status: "queued",
    created_at: new Date().toISOString(),
    input: req.body,
    video_url: null
  });

  return res.json({
    success: true,
    status: "queued",
    job_id
  });
});
  return res.json({
    success: true,
    job: jobs.get(job_id)
  });
});
// ====== JOB STORE (in-memory) ======
const jobs = new Map(); // job_id -> { status, video_url, error, created_at, updated_at }

// Helper
function now() { return new Date().toISOString(); }

// ====== GET JOB STATUS ======
app.get('/api/job/:job_id', (req, res) => {
  const jobId = req.params.job_id;
  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'job_not_found', job_id: jobId });
  }
  return res.json({ success: true, job_id: jobId, ...job });
});
/* =======================
   GENERATE VIDEO (CORE)
   FINAL – NO N8N – NO WEBHOOK
======================= */
app.post("/api/generate-video", async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "EMPTY_REQUEST_BODY"
      });
    }

    // Job ID ثابت وواضح
    const job_id = `job_${Date.now()}`;

    /**
     * IMPORTANT:
     * - Core لا يصنع الفيديو
     * - Core لا ينادي أي webhook
     * - Core لا يستعمل GPT
     * - Core فقط يستقبل الطلب ويرجع Job
     */

    return res.status(200).json({
      success: true,
      status: "queued",
      job_id: job_id,
      received: payload
    });

  } catch (error) {
    console.error("GENERATE VIDEO ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR"
    });
  }
});

/* =======================
   SERVER START
======================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`✅ Nexora Core running on port ${PORT}`);
});
const jobId = `job_${Date.now()}`;

jobs.set(jobId, {
  status: 'queued',
  video_url: null,
  error: null,
  created_at: now(),
  updated_at: now(),
});

// رجّعي job_id للمستخدم
res.json({
  success: true,
  status: 'queued',
  job_id: jobId,
  received: req.body
});

// وبعدها كمّلي عملية التوليد في الخلفية (ضروري تكون async)
setImmediate(async () => {
  try {
    jobs.set(jobId, { ...jobs.get(jobId), status: 'processing', updated_at: now() });

    // TODO: هنا مكان كود صناعة الفيديو الحقيقي
    // لما يجهز الفيديو حطي الرابط هنا:
    const videoUrl = "PUT_FINAL_VIDEO_URL_HERE";

    jobs.set(jobId, { ...jobs.get(jobId), status: 'ready', video_url: videoUrl, updated_at: now() });
  } catch (e) {
    jobs.set(jobId, { ...jobs.get(jobId), status: 'failed', error: String(e?.message || e), updated_at: now() });
  }
});
