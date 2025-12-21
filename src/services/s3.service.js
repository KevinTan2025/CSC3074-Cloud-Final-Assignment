const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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
    // ACL: 'public-read' // Optional: depending on bucket settings. 
    // If bucket is private but has policy for public read, this isn't needed.
    // If bucket is strictly private, we might need presigned URLs, but for this project public read is likely intended.
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // Construct the public URL
  // Format: https://<bucket-name>.s3.<region>.amazonaws.com/<key>
  const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  
  return fileUrl;
};

const deleteFile = async (fileUrl) => {
  // Extract key from URL
  // URL: https://<bucket-name>.s3.<region>.amazonaws.com/<key>
  const urlParts = fileUrl.split('/');
  const key = urlParts[urlParts.length - 1];

  const deleteParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  };

  await s3Client.send(new DeleteObjectCommand(deleteParams));
};

module.exports = {
  uploadFile,
  deleteFile
};
