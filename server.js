const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "nexora-sdk-core",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("✅ Nexora SDK Core is running on Render!");
});

app.listen(PORT, () => {
  console.log(`Nexora SDK Core running on port ${PORT}`);
});
