import * as pat from "@datalisk/pulumi-aws-toolbox";
import { RouteType } from "@datalisk/pulumi-aws-toolbox/dist/website";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

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

// Build and deploy the frontend artifact to S3
const artifactStore = new pat.ci.S3ArtifactStore(`${resourcePrefix}-artifact`);
const frontendArtifact = pat.ci.createS3ArtifactBuild(`${resourcePrefix}-frontend`, {
    artifactStore,
    artifactName: "frontend",
    buildSpec: {
        sourceDir: "../frontend",
        commands: [
            "pnpm install",
            "pnpm run build",
        ],
        outputDir: "../frontend/build",
    },
});

// Creating the Cloudfront Distribution
const website = new pat.website.StaticWebsite(`${resourcePrefix}-website`, {
    acmCertificateArn_usEast1: config.require("acmCertificateArn_usEast1"),
    hostedZoneId: config.require("hostedZoneId"),
    subDomain: pulumi.getStack() == "prod" ? "notebook" : resourcePrefix,
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
        s3Folder: { bucket: contentBucket, path: '' },
        originCachePolicyId: aws.cloudfront.getCachePolicyOutput({ name: "Managed-CachingDisabled" }).apply(policy => policy.id!!),
    }, {
        // rewrite and serve notebook UI (i.e. a request to /n/abc123 is served with /n/0.html)
        type: RouteType.S3,
        pathPattern: "/n/*",
        s3Folder: frontendArtifact,
        viewerRequestFunctionArn: new pat.website.ViewerRequestFunction(`${resourcePrefix}-notebook-rewrite`)
            .rewritePathElement(1, "0.html")
            .create().arn
    }, {
        // default: serve static frontend assets
        type: RouteType.S3,
        pathPattern: "/",
        s3Folder: frontendArtifact,
    }],
});

// After distribution is created:
// Create policy to allow CloudFront to read the frontend assets from S3
artifactStore.createBucketPolicy();

// Create policy to allow CloudFront to read notebook contents
new aws.s3.BucketPolicy(`${resourcePrefix}-content`, {
    bucket: contentBucket.bucket,
    policy: {
        Version: "2012-10-17",
        Statement: [
            pat.website.createBucketPolicyStatement(contentBucket.arn, website.distributionArn, '*'),
        ],
    },
});

export const frontendArtifactBucket = artifactStore.getBucketName();
export const websiteDomain = website.domain;
