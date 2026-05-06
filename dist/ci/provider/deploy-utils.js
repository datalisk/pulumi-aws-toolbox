"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3PutFolder = s3PutFolder;
exports.isFolderPresent = isFolderPresent;
const client_s3_1 = require("@aws-sdk/client-s3");
const mime_types_1 = require("mime-types");
const path_1 = require("path");
/**
 * Uploads the files of a folder (including subdirs) to S3.
 * @param localDir path to the local dir to upload
 * @param bucketName
 * @param bucketFolder S3 key prefix (starts and ends without slash, e.g. 'frontend/abc123')
 */
async function s3PutFolder(localDir, bucketName, bucketFolder) {
    const s3Client = new client_s3_1.S3Client({});
    // not importing like this causes a weird pulumi serialization error
    const { readdir, readFile, stat } = require('fs/promises');
    // Put zero-byte placeholder for the folder itself
    await s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: bucketName,
        Key: bucketFolder.endsWith('/') ? bucketFolder : `${bucketFolder}/`, // ensure trailing slash
        Body: '',
        ContentLength: 0,
    }));
    async function uploadDirectory(dirPath) {
        const entries = await readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = (0, path_1.join)(dirPath, entry.name);
            const entryStat = await stat(entryPath);
            if (entryStat.isDirectory()) {
                // Recursively upload subdirectories
                await uploadDirectory(entryPath);
            }
            else {
                const fileBuffer = await readFile(entryPath);
                // Compute the relative path to construct the S3 object key
                const relativePath = (0, path_1.relative)(localDir, entryPath).replace(/\\/g, '/');
                const objectKey = `${bucketFolder}/${relativePath}`;
                const contentType = (0, mime_types_1.lookup)(entryPath) || 'application/octet-stream';
                await s3Client.send(new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: objectKey,
                    Body: fileBuffer,
                    ContentType: contentType,
                    ContentLength: fileBuffer.byteLength,
                }));
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
async function isFolderPresent(bucketName, bucketFolder) {
    const prefix = bucketFolder.endsWith('/') ? bucketFolder : `${bucketFolder}/`;
    const s3Client = new client_s3_1.S3Client({});
    try {
        await s3Client.send(new client_s3_1.HeadObjectCommand({
            Bucket: bucketName,
            Key: prefix,
        }));
        return true;
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.name) === 'NotFound') {
            return false;
        }
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95LXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NpL3Byb3ZpZGVyL2RlcGxveS11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVVBLGtDQWdEQztBQVFELDBDQWdCQztBQWxGRCxrREFBbUY7QUFDbkYsMkNBQW9DO0FBQ3BDLCtCQUFzQztBQUV0Qzs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxXQUFXLENBQUMsUUFBZ0IsRUFBRSxVQUFrQixFQUFFLFlBQW9CO0lBQzFGLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUVsQyxvRUFBb0U7SUFDcEUsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTNELGtEQUFrRDtJQUNsRCxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSw0QkFBZ0IsQ0FBQztRQUN2QyxNQUFNLEVBQUUsVUFBVTtRQUNsQixHQUFHLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksR0FBRyxFQUFFLHdCQUF3QjtRQUM3RixJQUFJLEVBQUUsRUFBRTtRQUNSLGFBQWEsRUFBRSxDQUFDO0tBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBRUosS0FBSyxVQUFVLGVBQWUsQ0FBQyxPQUFlO1FBQzVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLEtBQUssTUFBTSxLQUFLLElBQUksT0FBTyxFQUFFLENBQUM7WUFDNUIsTUFBTSxTQUFTLEdBQUcsSUFBQSxXQUFJLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUV4QyxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUM1QixvQ0FBb0M7Z0JBQ3BDLE1BQU0sZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7aUJBQU0sQ0FBQztnQkFDTixNQUFNLFVBQVUsR0FBRyxNQUFNLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFN0MsMkRBQTJEO2dCQUMzRCxNQUFNLFlBQVksR0FBRyxJQUFBLGVBQVEsRUFBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxTQUFTLEdBQUcsR0FBRyxZQUFZLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBRXBELE1BQU0sV0FBVyxHQUFHLElBQUEsbUJBQU0sRUFBQyxTQUFTLENBQUMsSUFBSSwwQkFBMEIsQ0FBQztnQkFFcEUsTUFBTSxRQUFRLENBQUMsSUFBSSxDQUNqQixJQUFJLDRCQUFnQixDQUFDO29CQUNuQixNQUFNLEVBQUUsVUFBVTtvQkFDbEIsR0FBRyxFQUFFLFNBQVM7b0JBQ2QsSUFBSSxFQUFFLFVBQVU7b0JBQ2hCLFdBQVcsRUFBRSxXQUFXO29CQUN4QixhQUFhLEVBQUUsVUFBVSxDQUFDLFVBQVU7aUJBQ3JDLENBQUMsQ0FDSCxDQUFDO2dCQUVGLDJFQUEyRTtZQUM3RSxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsZUFBZSxDQUFDLFVBQWtCLEVBQUUsWUFBb0I7SUFDNUUsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksR0FBRyxDQUFDO0lBRTlFLE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsQyxJQUFJLENBQUM7UUFDSCxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSw2QkFBaUIsQ0FBQztZQUN4QyxNQUFNLEVBQUUsVUFBVTtZQUNsQixHQUFHLEVBQUUsTUFBTTtTQUNaLENBQUMsQ0FBQyxDQUFDO1FBQ0osT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLElBQUksTUFBSyxVQUFVLEVBQUUsQ0FBQztZQUMvQixPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFDRCxNQUFNLEtBQUssQ0FBQztJQUNkLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGVhZE9iamVjdENvbW1hbmQsIFB1dE9iamVjdENvbW1hbmQsIFMzQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXMzJztcbmltcG9ydCB7IGxvb2t1cCB9IGZyb20gJ21pbWUtdHlwZXMnO1xuaW1wb3J0IHsgam9pbiwgcmVsYXRpdmUgfSBmcm9tICdwYXRoJztcblxuLyoqXG4gKiBVcGxvYWRzIHRoZSBmaWxlcyBvZiBhIGZvbGRlciAoaW5jbHVkaW5nIHN1YmRpcnMpIHRvIFMzLlxuICogQHBhcmFtIGxvY2FsRGlyIHBhdGggdG8gdGhlIGxvY2FsIGRpciB0byB1cGxvYWRcbiAqIEBwYXJhbSBidWNrZXROYW1lIFxuICogQHBhcmFtIGJ1Y2tldEZvbGRlciBTMyBrZXkgcHJlZml4IChzdGFydHMgYW5kIGVuZHMgd2l0aG91dCBzbGFzaCwgZS5nLiAnZnJvbnRlbmQvYWJjMTIzJylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHMzUHV0Rm9sZGVyKGxvY2FsRGlyOiBzdHJpbmcsIGJ1Y2tldE5hbWU6IHN0cmluZywgYnVja2V0Rm9sZGVyOiBzdHJpbmcpIHtcbiAgY29uc3QgczNDbGllbnQgPSBuZXcgUzNDbGllbnQoe30pO1xuXG4gIC8vIG5vdCBpbXBvcnRpbmcgbGlrZSB0aGlzIGNhdXNlcyBhIHdlaXJkIHB1bHVtaSBzZXJpYWxpemF0aW9uIGVycm9yXG4gIGNvbnN0IHsgcmVhZGRpciwgcmVhZEZpbGUsIHN0YXQgfSA9IHJlcXVpcmUoJ2ZzL3Byb21pc2VzJyk7XG5cbiAgLy8gUHV0IHplcm8tYnl0ZSBwbGFjZWhvbGRlciBmb3IgdGhlIGZvbGRlciBpdHNlbGZcbiAgYXdhaXQgczNDbGllbnQuc2VuZChuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgIEtleTogYnVja2V0Rm9sZGVyLmVuZHNXaXRoKCcvJykgPyBidWNrZXRGb2xkZXIgOiBgJHtidWNrZXRGb2xkZXJ9L2AsIC8vIGVuc3VyZSB0cmFpbGluZyBzbGFzaFxuICAgIEJvZHk6ICcnLFxuICAgIENvbnRlbnRMZW5ndGg6IDAsXG4gIH0pKTtcblxuICBhc3luYyBmdW5jdGlvbiB1cGxvYWREaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHJlYWRkaXIoZGlyUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgY29uc3QgZW50cnlQYXRoID0gam9pbihkaXJQYXRoLCBlbnRyeS5uYW1lKTtcbiAgICAgIGNvbnN0IGVudHJ5U3RhdCA9IGF3YWl0IHN0YXQoZW50cnlQYXRoKTtcblxuICAgICAgaWYgKGVudHJ5U3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHVwbG9hZCBzdWJkaXJlY3Rvcmllc1xuICAgICAgICBhd2FpdCB1cGxvYWREaXJlY3RvcnkoZW50cnlQYXRoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGZpbGVCdWZmZXIgPSBhd2FpdCByZWFkRmlsZShlbnRyeVBhdGgpO1xuXG4gICAgICAgIC8vIENvbXB1dGUgdGhlIHJlbGF0aXZlIHBhdGggdG8gY29uc3RydWN0IHRoZSBTMyBvYmplY3Qga2V5XG4gICAgICAgIGNvbnN0IHJlbGF0aXZlUGF0aCA9IHJlbGF0aXZlKGxvY2FsRGlyLCBlbnRyeVBhdGgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgY29uc3Qgb2JqZWN0S2V5ID0gYCR7YnVja2V0Rm9sZGVyfS8ke3JlbGF0aXZlUGF0aH1gO1xuXG4gICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gbG9va3VwKGVudHJ5UGF0aCkgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XG5cbiAgICAgICAgYXdhaXQgczNDbGllbnQuc2VuZChcbiAgICAgICAgICBuZXcgUHV0T2JqZWN0Q29tbWFuZCh7XG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBLZXk6IG9iamVjdEtleSxcbiAgICAgICAgICAgIEJvZHk6IGZpbGVCdWZmZXIsXG4gICAgICAgICAgICBDb250ZW50VHlwZTogY29udGVudFR5cGUsXG4gICAgICAgICAgICBDb250ZW50TGVuZ3RoOiBmaWxlQnVmZmVyLmJ5dGVMZW5ndGgsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgVXBsb2FkZWQgJHtvYmplY3RLZXl9IHRvIHMzOi8vJHtidWNrZXROYW1lfS8ke29iamVjdEtleX1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhd2FpdCB1cGxvYWREaXJlY3RvcnkobG9jYWxEaXIpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgcGxhY2Vob2xkZXIgb2JqZWN0IGV4aXN0cyBpbiBTMyAoaS5lLiwgaWYgJ2J1Y2tldEZvbGRlci8nIGtleSBpcyBwcmVzZW50KS5cbiAqIEBwYXJhbSBidWNrZXROYW1lIFRoZSBuYW1lIG9mIHRoZSBTMyBidWNrZXQuXG4gKiBAcGFyYW0gYnVja2V0Rm9sZGVyIFMzIGtleSBwcmVmaXggKHN0YXJ0cyBhbmQgZW5kcyB3aXRob3V0IHNsYXNoLCBlLmcuICdmcm9udGVuZC9hYmMxMjMnKVxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgcGxhY2Vob2xkZXIgb2JqZWN0IGV4aXN0cyAoZm9sZGVyIGlzIHByZXNlbnQpLCBmYWxzZSBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0ZvbGRlclByZXNlbnQoYnVja2V0TmFtZTogc3RyaW5nLCBidWNrZXRGb2xkZXI6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBwcmVmaXggPSBidWNrZXRGb2xkZXIuZW5kc1dpdGgoJy8nKSA/IGJ1Y2tldEZvbGRlciA6IGAke2J1Y2tldEZvbGRlcn0vYDtcblxuICBjb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7fSk7XG4gIHRyeSB7XG4gICAgYXdhaXQgczNDbGllbnQuc2VuZChuZXcgSGVhZE9iamVjdENvbW1hbmQoe1xuICAgICAgQnVja2V0OiBidWNrZXROYW1lLFxuICAgICAgS2V5OiBwcmVmaXgsXG4gICAgfSkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgaWYgKGVycm9yPy5uYW1lID09PSAnTm90Rm91bmQnKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9XG59Il19