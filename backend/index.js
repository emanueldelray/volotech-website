import express from "express";
import cors from "cors";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: allow the React dev server
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// optional JSON parsing for future routes
app.use(express.json());

// -------- Multer setup (file uploads) ----------
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// -------- Email transport (nodemailer) ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // use true only if you use port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// -------- RFQ endpoint ----------
app.post("/api/rfq", upload.single("file"), async (req, res) => {
  try {
    const { name, email, company, phone, message } = req.body;
    const file = req.file;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const receiver = process.env.RFQ_RECEIVER || process.env.SMTP_USER;

    let text = `New RFQ received:\n\n`;
    text += `Name: ${name}\n`;
    text += `Email: ${email}\n`;
    text += `Company: ${company || "-"}\n`;
    text += `Phone: ${phone || "-"}\n\n`;
    text += `Message:\n${message}\n\n`;

    if (file) {
      text += `File uploaded: ${file.filename} (${file.originalname})\nPath: ${file.path}\n`;
    } else {
      text += `No file attached.\n`;
    }

    const mailOptions = {
      from: `"CNC Website RFQ" <${process.env.SMTP_USER}>`,
      to: receiver,
      subject: `New RFQ from ${name}`,
      text,
      attachments: file
        ? [
            {
              filename: file.originalname,
              path: file.path,
            },
          ]
        : [],
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "RFQ received." });
  } catch (err) {
    console.error("RFQ error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// -------- Start server ----------
app.listen(PORT, () => {
  console.log(`RFQ backend running on http://localhost:${PORT}`);
});
