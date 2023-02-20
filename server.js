const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuid } = require("uuid");
const cors = require("cors");

const app = express();

app.use(cors());

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({ storage }).single("file");

app.post("/upload", upload, async (req, res) => {
  try {
    const file = req.file;
    const ext = file.originalname.split(".").pop();
    const filename = `${uuid()}.${ext}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);

    const response = await s3.send(command);

    res.status(200).send({
      name: file.originalname,
      size: file.size,
      lastModified: file.lastModifiedDate,
      url: `https://${params.Bucket}.s3.${s3.config.region}.amazonaws.com/${params.Key}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

app.listen(3001, () => {
  console.log("Server started on port 3001");
});
