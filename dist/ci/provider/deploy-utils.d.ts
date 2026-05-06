/**
 * Uploads the files of a folder (including subdirs) to S3.
 * @param localDir path to the local dir to upload
 * @param bucketName
 * @param bucketFolder S3 key prefix (starts and ends without slash, e.g. 'frontend/abc123')
 */
export declare function s3PutFolder(localDir: string, bucketName: string, bucketFolder: string): Promise<void>;
/**
 * Checks if the placeholder object exists in S3 (i.e., if 'bucketFolder/' key is present).
 * @param bucketName The name of the S3 bucket.
 * @param bucketFolder S3 key prefix (starts and ends without slash, e.g. 'frontend/abc123')
 * @returns true if the placeholder object exists (folder is present), false otherwise.
 */
export declare function isFolderPresent(bucketName: string, bucketFolder: string): Promise<boolean>;
