const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({ region: "ap-northeast-2" });
const BUCKET = "k-mecca-325144789320";

async function uploadRawImage(barcode, index, buffer, contentType) {
  const key = `raw/${barcode}/${index}.jpg`;
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

module.exports = { uploadRawImage };
