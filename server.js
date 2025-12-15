import express from "express";
import cors from "cors";

const app = express();

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
