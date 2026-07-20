const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

// 스캔 결과 공유용 사진(raw/와 별도 prefix). 등록 사진과 달리 CLIP 벡터화 대상이
// 아니라 "그 순간 A가 본 화면 그대로"를 B에게 보여주기 위한 용도라 분리해둠.
async function uploadShareImage(shareId, buffer, contentType) {
  const key = `shares/${shareId}.${extensionFor(contentType)}`;
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

// 버킷이 퍼블릭 접근 전면 차단이라, 공유 페이지를 열 때마다 그 순간에만
// 유효한 서명된 URL을 새로 발급해서 내려준다 (shareId 자체의 7일 만료와는 별개).
async function getPresignedShareImageUrl(key, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

module.exports = { uploadRawImage, deleteRawImage, uploadShareImage, getPresignedShareImageUrl };
