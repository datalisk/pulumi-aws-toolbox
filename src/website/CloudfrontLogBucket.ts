import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";
import { delayedOutput } from "../util";

/**
 * Creates a S3 bucket to store CloudFront standard logs.
 * On deletion the bucket's content will be deleted too, so configure it as 'protected' or 'retainOnDelete' if necessary.
 */
export class CloudfrontLogBucket extends ComponentResource {
    readonly bucketRegionalDomainName: pulumi.Output<string>;

    constructor(name: string, args: CloudfrontLogBucketArgs, opts?: ComponentResourceOptions) {
        super("pat:website:CloudfrontLogBucket", name, args, opts);

        const bucket = new aws.s3.BucketV2(name, {
            forceDestroy: true,
        }, {
            parent: this,
            protect: opts?.protect,
            retainOnDelete: opts?.retainOnDelete,
        });

        const encryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(name, {
            bucket: bucket.bucket,
            rules: [{
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                }
            }]
        }, { parent: this });

        const publicAccess = new aws.s3.BucketPublicAccessBlock(name, {
            bucket: bucket.id,
        }, { parent: this });

        const ownershipControls = new aws.s3.BucketOwnershipControls(name, {
            bucket: bucket.id,
            rule: {
                objectOwnership: "BucketOwnerPreferred",
            },
        }, { parent: this });

        const currentUser = aws.s3.getCanonicalUserId({}).then(currentUser => currentUser.id);
        const awslogsdeliveryUserId = "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0";

        const acl = new aws.s3.BucketAclV2(name, {
            bucket: bucket.id,
            accessControlPolicy: {
                grants: [
                    {
                        grantee: {
                            type: "CanonicalUser",
                            id: currentUser,
                        },
                        permission: "FULL_CONTROL"
                    },
                    {
                        grantee: {
                            type: "CanonicalUser",
                            id: awslogsdeliveryUserId,
                        },
                        permission: "FULL_CONTROL"
                    },
                ],
                owner: {
                    id: currentUser,
                },
            }
        }, {
            parent: this,
            dependsOn: [encryption, publicAccess, ownershipControls]
        });

        // make bucketRegionalDomainName depend on the ACL and wait a bit - otherwise a CloudFront dist may fail to create with "bucket ... does not enable ACL access" error
        this.bucketRegionalDomainName = pulumi.all([bucket, acl]).apply(x => delayedOutput(x[0].bucketRegionalDomainName, 10000));
    }
}

export interface CloudfrontLogBucketArgs {
}
