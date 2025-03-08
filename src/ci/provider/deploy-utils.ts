import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { lookup } from 'mime-types';
import { join, relative } from 'path';

/**
 * Uploads the files of a folder (including subdirs) to S3.
 * @param localDir path to the local dir to upload
 * @param bucketName 
 * @param bucketFolder S3 key prefix (starts and ends without slash, e.g. 'frontend/abc123')
 */
export async function s3PutFolder(localDir: string, bucketName: string, bucketFolder: string) {
  const s3Client = new S3Client({});

  // not importing like this causes a weird pulumi serialization error
  const { readdir, readFile, stat } = require('fs/promises');

  // Put zero-byte placeholder for the folder itself
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: bucketFolder.endsWith('/') ? bucketFolder : `${bucketFolder}/`, // ensure trailing slash
    Body: '',
    ContentLength: 0,
  }));

  async function uploadDirectory(dirPath: string) {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(dirPath, entry.name);
      const entryStat = await stat(entryPath);

      if (entryStat.isDirectory()) {
        // Recursively upload subdirectories
        await uploadDirectory(entryPath);
      } else {
        const fileBuffer = await readFile(entryPath);

        // Compute the relative path to construct the S3 object key
        const relativePath = relative(localDir, entryPath).replace(/\\/g, '/');
        const objectKey = `${bucketFolder}/${relativePath}`;

        const contentType = lookup(entryPath) || 'application/octet-stream';

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            Body: fileBuffer,
            ContentType: contentType,
            ContentLength: fileBuffer.byteLength,
          })
        );

        // console.log(`Uploaded ${objectKey} to s3://${bucketName}/${objectKey}`);
      }
    }
  }

  await uploadDirectory(localDir);
}

/**
 * Checks if the placeholder object exists in S3 (i.e., if 'bucketFolder/' key is present).
 * @param bucketName The name of the S3 bucket.
 * @param bucketFolder S3 key prefix (starts and ends without slash, e.g. 'frontend/abc123')
 * @returns true if the placeholder object exists (folder is present), false otherwise.
 */
export async function isFolderPresent(bucketName: string, bucketFolder: string): Promise<boolean> {
  const prefix = bucketFolder.endsWith('/') ? bucketFolder : `${bucketFolder}/`;

  const s3Client = new S3Client({});
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: prefix,
    }));
    return true;
  } catch (error: any) {
    if (error?.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}