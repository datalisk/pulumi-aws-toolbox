import * as s3 from '@aws-sdk/client-s3';

const s3Client = new s3.S3Client();
const contentBucket = process.env.CONTENT_BUCKET;

export const handler = async (event) => {
    console.log("EVENT", JSON.stringify(event, null, 2));

    if (event.requestContext.http.method == "POST" && event.requestContext.http.path.startsWith('/api/content/')) {
        const notebookId = event.requestContext.http.path.substring(13);
        const { content } = JSON.parse(event.body);

        const command = new s3.PutObjectCommand({
            Bucket: contentBucket,
            Key: `content/${notebookId}.txt`,
            Body: content,
        });

        await s3Client.send(command);
        return {
            statusCode: 200,
        };
    } else {
        return {
            statusCode: 404,
        };
    }
}
