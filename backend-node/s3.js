const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION || "ap-northeast-2";
const BUCKET = process.env.S3_BUCKET || "k-mecca-325144789320";
const s3 = new S3Client({ region: REGION });

const EXTENSION_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function extensionFor(contentType) {
  return EXTENSION_BY_MIME[contentType] || "jpg";
}

async function uploadRawImage(barcode, index, buffer, contentType) {
  const key = `raw/${barcode}/${index}.${extensionFor(contentType)}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return key;
}

async function deleteRawImage(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

module.exports = { uploadRawImage, deleteRawImage };
