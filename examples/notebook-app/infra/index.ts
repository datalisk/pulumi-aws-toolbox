import * as pat from "@datalisk/pulumi-aws-toolbox";
import { RouteType } from "@datalisk/pulumi-aws-toolbox/dist/website";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const resourcePrefix = `notebook-${pulumi.getStack()}`;
const config = new pulumi.Config();

const artifactStore = new pat.ci.S3ArtifactStore(`${resourcePrefix}-artifact`);

// Build and deploy the backend artifact
const backendArtifact = pat.ci.createS3ArtifactBuild(`${resourcePrefix}-backend`, {
    artifactStore,
    artifactName: "backend",
    buildSpec: {
        sourceDir: "../backend",
        commands: [
            "pnpm install",
            "pnpm run build:dist",
        ],
        outputDir: "../backend/dist",
    },
});

// Create content bucket
const contentBucket = new aws.s3.Bucket(`${resourcePrefix}-content`, {
    forceDestroy: true,
});

// Create backend
const backendLambda = new pat.lambda.SimpleNodeLambda(`${resourcePrefix}-backend`, {
    codeS3Folder: backendArtifact,
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

// Build and deploy the frontend artifact
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
const hostedZone = aws.route53.Zone.get(`${resourcePrefix}-zone`, config.require("hostedZoneId"));
const website = new pat.website.Website(`${resourcePrefix}-website`, {
    hostedZone,
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
        s3Folder: { bucket: contentBucket, path: '' }
    }, {
        // rewrite and serve notebook UI (i.e. a request to /n/abc123 is served with /n/0.html)
        type: RouteType.S3,
        pathPattern: "/n/*",
        s3Folder: frontendArtifact,
        getViewerRequestFunctionArn: (template) => template
            .rewritePathElement(1, "0.html")
            .create().arn
        ,
    }, {
        // default: serve static frontend assets
        type: RouteType.S3,
        pathPattern: "/*",
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
