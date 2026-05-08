import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";


export function createCertificate(args: CreateCertificateArgs): aws.acm.CertificateValidation {
    const cert = new aws.acm.Certificate(args.name, {
        region: args.region,
        domainName: args.domain,
        subjectAlternativeNames: args.subjectAlternativeNames,
        validationMethod: "DNS",
    });

    const records: aws.route53.Record[] = [];

    cert.domainValidationOptions.apply(domainValidationOptions => {
        type DomainValidationRecord = {
            name: string;
            record: string;
            type: string;
        }

        // deduplicate by domain name, as ACM sometimes returns multiple validation options for the same domain
        const validationRecords: { key: string; value: DomainValidationRecord }[] = Object.entries(domainValidationOptions.reduce((__obj, dvo) => ({
            ...__obj,
            [dvo.domainName]: {
                name: dvo.resourceRecordName,
                record: dvo.resourceRecordValue,
                type: dvo.resourceRecordType,
            }
        }), {}))
            .map(([k, v]) => ({ key: k, value: v as DomainValidationRecord }));

        for (const range of validationRecords) {
            records.push(new aws.route53.Record(`${args.name}-${range.key}`, {
                allowOverwrite: true,
                name: range.value.name,
                records: [range.value.record],
                ttl: 60,
                type: aws.route53.RecordType[range.value.type as aws.route53.RecordType],
                zoneId: args.hostedZone.id,
            }));
        }
    });

    return new aws.acm.CertificateValidation(args.name, {
        region: args.region,
        certificateArn: cert.arn,
        validationRecordFqdns: records.map(r => (r.fqdn)),
    });
}

export interface CreateCertificateArgs {
    name: string;
    domain: pulumi.Input<string>;
    hostedZone: aws.route53.Zone;
    subjectAlternativeNames: pulumi.Input<string[]>;
    region: string;
}
