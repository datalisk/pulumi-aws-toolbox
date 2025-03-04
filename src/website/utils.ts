import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createCloudfrontDnsRecords(name: string, distribution: aws.cloudfront.Distribution, zoneId: pulumi.Input<string>, subDomain?: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions) {
    const cloudfrontZoneId = "Z2FDTNDATAQYW2";

    new aws.route53.Record(`${name}-a`, {
        zoneId,
        name: subDomain || "",
        type: "A",
        aliases: [{
            zoneId: cloudfrontZoneId,
            name: distribution.domainName,
            evaluateTargetHealth: false
        }]
    }, { ...opts, deleteBeforeReplace: true });

    new aws.route53.Record(`${name}-aaaa`, {
        zoneId,
        name: subDomain || "",
        type: "AAAA",
        aliases: [{
            zoneId: cloudfrontZoneId,
            name: distribution.domainName,
            evaluateTargetHealth: false
        }]
    }, { ...opts, deleteBeforeReplace: true });
}

export const defaultSecurityHeadersConfig: aws.types.input.cloudfront.ResponseHeadersPolicySecurityHeadersConfig = {
    strictTransportSecurity: { // informs browsers that the site should only be accessed using HTTPS
        accessControlMaxAgeSec: 31536000, // 1 year
        includeSubdomains: true,
        preload: true,
        override: true,
    },
    contentTypeOptions: { // blocks styles and scripts from loading if MIME type is incorrect
        override: true,
    },
    referrerPolicy: { // send only the origin for cross origin requests and if HTTPS
        referrerPolicy: 'strict-origin-when-cross-origin',
        override: false,
    },
};

/**
 * Returns a policy statement to grant CloudFront read access to the given bucket path.
 * @param pathPattern e.g. '*' or 'content/*'
 */
export function createBucketPolicyStatement(bucketArn: pulumi.Input<aws.ARN>, distributionArn: pulumi.Input<aws.ARN>, pathPattern: pulumi.Input<string>): aws.iam.PolicyStatement {
    return {
        Effect: "Allow",
        Principal: {
            Service: "cloudfront.amazonaws.com"
        },
        Action: ["s3:ListBucket", "s3:GetObject"],
        Resource: [
            bucketArn,
            pulumi.interpolate`${bucketArn}/${pathPattern}`
        ],
        Condition: {
            StringEquals: {
                "AWS:SourceArn": distributionArn
            }
        }
    };
}
