import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
export declare function createCertificate(args: CreateCertificateArgs): aws.acm.CertificateValidation;
export interface CreateCertificateArgs {
    name: string;
    domain: pulumi.Input<string>;
    hostedZone: aws.route53.Zone;
    subjectAlternativeNames: pulumi.Input<string[]>;
    region: string;
}
