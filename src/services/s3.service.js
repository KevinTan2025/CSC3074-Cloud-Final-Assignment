const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const uploadFile = async (file) => {
  // Generate a unique file name
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExtension}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // Return the Key (filename) instead of the full URL
  return fileName;
};

const getFileSignedUrl = async (key) => {
  // If it's a full URL (e.g. placeholder), return it as is
  if (key.startsWith('http')) return key;

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  // Generate a signed URL valid for 1 hour (3600 seconds)
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

const deleteFile = async (key) => {
  // If it's a full URL, try to extract the key, otherwise assume it is the key
  let fileKey = key;
  if (key.startsWith('http')) {
      const urlParts = key.split('/');
      fileKey = urlParts[urlParts.length - 1];
  }

  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey
  };

  await s3Client.send(new DeleteObjectCommand(deleteParams));
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileSignedUrl
};
