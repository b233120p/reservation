require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth");
const reservationsRouter = require("./routes/reservations");
const schedulesRouter = require("./routes/schedules");
require("./scheduler");
const slotsRouter = require("./routes/slots");
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/slots", slotsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});