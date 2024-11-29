import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as pat from "@datalisk/pulumi-aws-toolbox";
import { RouteType } from "@datalisk/pulumi-aws-toolbox/dist/website";

const resourcePrefix = `notebook-${pulumi.getStack()}`;
const config = new pulumi.Config();

// Create content bucket
const contentBucket = new aws.s3.BucketV2(`${resourcePrefix}-content`, {
    forceDestroy: true,
});
new aws.s3.BucketPublicAccessBlock(`${resourcePrefix}-content`, {
    bucket: contentBucket.bucket,
    blockPublicAcls: true,
    ignorePublicAcls: true,
});

// Create backend
const backendLambda = new pat.lambda.SimpleNodeLambda(`${resourcePrefix}-backend`, {
    codeDir: `${__dirname}/../backend`,
    roleInlinePolicies: [{
        name: "S3",
        policy: {
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Action: ["s3:PutObject"],
                Resource: [pulumi.interpolate`${contentBucket.arn}/content/*`],
            }],
        },
    }],
    environmentVariables: {
        CONTENT_BUCKET: contentBucket.bucket,
    },
});
const backendFunctionUrl = new aws.lambda.FunctionUrl(`${resourcePrefix}-backend`, {
    functionName: backendLambda.function.name,
    authorizationType: "NONE",
});


// Get a reference to where the frontend assets are stored
const frontendArtifactStore = new pat.build.S3ArtifactStore(`${resourcePrefix}-artifact`, { artifactName: "frontend" });
const frontendLocation = frontendArtifactStore.getArtifactVersion("latest");

// Get a reference to the stored notebook files in S3
const contentLocation = new pat.website.S3Location(contentBucket, '', (distributionArn) => {
    // after distribution is created -> grant read access to S3 bucket
    new aws.s3.BucketPolicy(`${resourcePrefix}-content`, {
        bucket: contentBucket.bucket,
        policy: {
            Version: "2012-10-17",
            Statement: [{
                Effect: "Allow",
                Principal: {
                    Service: "cloudfront.amazonaws.com"
                },
                Action: ["s3:ListBucket", "s3:GetObject"],
                Resource: [
                    contentBucket.arn,
                    pulumi.interpolate`${contentBucket.arn}/content/*`
                ],
                Condition: {
                    StringEquals: {
                        "AWS:SourceArn": distributionArn
                    }
                }
            }],
        },
    });
});

// Creating the Cloudfront Distribution
const website = new pat.website.StaticWebsite(`${resourcePrefix}-website`, {
    acmCertificateArn_usEast1: config.require("acmCertificateArn_usEast1"),
    hostedZoneId: config.require("hostedZoneId"),
    subDomain: 'notebook',
    // basicAuth: { username: "development", password: "bigsecret" }, // enable for a non-public website
    routes: [{
        // serve backend to store notebooks in S3
        type: RouteType.Lambda,
        pathPattern: '/api/*',
        functionUrl: backendFunctionUrl,
    }, {
        // serve download notebook files for direct download
        type: RouteType.S3,
        pathPattern: '/content/*',
        s3Location: contentLocation,
        originCachePolicyId: aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" }).apply(policy => policy.id!!),
    }, {
        // rewrite and serve notebook UI (request to /n/abc123 served with /n/0.html)
        type: RouteType.S3,
        pathPattern: "/n/*",
        s3Location: frontendLocation,
        viewerRequestFunctionArn: new pat.website.ViewerRequestFunction(`${resourcePrefix}-notebook-rewrite`)
            .rewritePathElement(1, "0.html")
            .create().arn
    }, {
        // default: serve static frontend assets
        type: RouteType.S3,
        pathPattern: "/",
        s3Location: frontendLocation,
    }],
});

// Allow CloudFront to read the frontend assets from S3
frontendArtifactStore.createBucketPolicy();

export const frontendArtifactBucket = frontendArtifactStore.getBucketName();
export const websiteDomain = website.domain;
