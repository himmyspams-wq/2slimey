import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface UploadResult {
  url: string;
  key: string;
}

async function processImageBuffer(buffer: Buffer): Promise<Buffer> {
  // Dynamic import of sharp to avoid issues in non-Node environments
  const sharp = (await import('sharp')).default;
  return sharp(buffer)
    .resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}

export async function uploadImageLocally(
  buffer: Buffer,
  originalName: string
): Promise<UploadResult> {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const key = `${uuidv4()}-${baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.webp`;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const processedBuffer = await processImageBuffer(buffer);
  const filePath = path.join(uploadsDir, key);
  await fs.writeFile(filePath, processedBuffer);

  return {
    url: `/uploads/${key}`,
    key,
  };
}

export async function uploadToS3(
  buffer: Buffer,
  originalName: string
): Promise<UploadResult> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const key = `listings/${uuidv4()}-${baseName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.webp`;

  const processedBuffer = await processImageBuffer(buffer);

  const client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/webp',
    })
  );

  const baseUrl = process.env.AWS_CLOUDFRONT_URL
    ? `https://${process.env.AWS_CLOUDFRONT_URL}`
    : `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

  return {
    url: `${baseUrl}/${key}`,
    key,
  };
}

export async function uploadImage(
  buffer: Buffer,
  originalName: string
): Promise<UploadResult> {
  const hasS3Config =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_BUCKET_NAME;

  if (hasS3Config) {
    return uploadToS3(buffer, originalName);
  }

  return uploadImageLocally(buffer, originalName);
}

export async function deleteImage(key: string): Promise<void> {
  const hasS3Config =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_BUCKET_NAME;

  if (hasS3Config) {
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
      })
    );
  } else {
    // Local file deletion
    const filePath = path.join(process.cwd(), 'public', 'uploads', key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist, ignore error
    }
  }
}
