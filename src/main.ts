import express from "express";
import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { mmToPoints, PDFTextRenderer } from "./utils";

const app = express();

const STATIC_DIR = path.join(__dirname, "../frontend");
const TEMPLATE_DIR = path.resolve(__dirname, "../template");
const PDF_PATH = path.resolve(TEMPLATE_DIR, "resume.pdf");
const FONT_PATH = path.resolve(TEMPLATE_DIR, "ipaexm.ttf");

app.use(express.static(STATIC_DIR));

app.get("/pdf", async (req, res) => {
  const name = req.query.name;
  if (typeof name !== "string") {
    res.setHeader("Content-Type", "text/plain");
    res.status(400).send("name is required");
    return;
  }

  const templateFile = await fs.readFile(PDF_PATH);
  const fontFile = await fs.readFile(FONT_PATH);

  const doc = await PDFDocument.load(templateFile);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(fontFile, { subset: true });
  const page = doc.getPages()[0];
  page.setFont(font);

  const tr = new PDFTextRenderer(page, font);
  tr.renderText(name, {
    x: 100,
    y: 95,
    h: 50,
    w: 240,
    size: mmToPoints(10),
    horizontalAlign: "center",
    verticalAlign: "middle",
  });

  const pdfBytes = await doc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdfBytes));
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
