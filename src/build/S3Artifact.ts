import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { RequestReadAccessFunction, S3Location } from "../website";

/**
 * References a build artifact stored in S3. The S3Artifact references an entire directory in S3, not a single file.
 * An artifact could be
 *  - a directory containing the static assets of a website,
 *  - a directory containing a single ZIP file containing the code to be executed by AWS Lambda.
 *
 * An artifact is identified by
 * - a name e.g. "frontend"
 * - a version e.g. a Git commit hash
 */
export class S3Artifact extends S3Location {
    constructor(bucket: aws.s3.Bucket, name: string, version: string, requestCloudfrontReadAccess: RequestReadAccessFunction) {
        super(bucket, pulumi.interpolate`${name}/${version}`, requestCloudfrontReadAccess);
    }
}

/**
 * Returns a S3 artifact for an existing bucket.
 * The bucket may have been manually created to share artifacts across stacks.
 * The bucket must already allow proper read access.
 */
export function getS3ArtifactForBucket(
    bucket: aws.s3.Bucket,
    artifactName: string,
    version: string
): S3Artifact {
    return new S3Artifact(bucket, artifactName, version, () => {
        // ignored - not supported
    });
}
