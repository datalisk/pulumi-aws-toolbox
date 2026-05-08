"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCertificate = createCertificate;
const aws = __importStar(require("@pulumi/aws"));
function createCertificate(args) {
    const cert = new aws.acm.Certificate(args.name, {
        region: args.region,
        domainName: args.domain,
        subjectAlternativeNames: args.subjectAlternativeNames,
        validationMethod: "DNS",
    });
    const records = [];
    cert.domainValidationOptions.apply(domainValidationOptions => {
        // deduplicate by domain name, as ACM sometimes returns multiple validation options for the same domain
        const validationRecords = Object.entries(domainValidationOptions.reduce((__obj, dvo) => ({
            ...__obj,
            [dvo.domainName]: {
                name: dvo.resourceRecordName,
                record: dvo.resourceRecordValue,
                type: dvo.resourceRecordType,
            }
        }), {}))
            .map(([k, v]) => ({ key: k, value: v }));
        for (const range of validationRecords) {
            records.push(new aws.route53.Record(`${args.name}-${range.key}`, {
                allowOverwrite: true,
                name: range.value.name,
                records: [range.value.record],
                ttl: 60,
                type: aws.route53.RecordType[range.value.type],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJzaXRlL2NlcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUlBLDhDQTZDQztBQWpERCxpREFBbUM7QUFJbkMsU0FBZ0IsaUJBQWlCLENBQUMsSUFBMkI7SUFDekQsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQzVDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDdkIsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QjtRQUNyRCxnQkFBZ0IsRUFBRSxLQUFLO0tBQzFCLENBQUMsQ0FBQztJQUVILE1BQU0sT0FBTyxHQUF5QixFQUFFLENBQUM7SUFFekMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO1FBT3pELHVHQUF1RztRQUN2RyxNQUFNLGlCQUFpQixHQUFxRCxNQUFNLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkksR0FBRyxLQUFLO1lBQ1IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ2QsSUFBSSxFQUFFLEdBQUcsQ0FBQyxrQkFBa0I7Z0JBQzVCLE1BQU0sRUFBRSxHQUFHLENBQUMsbUJBQW1CO2dCQUMvQixJQUFJLEVBQUUsR0FBRyxDQUFDLGtCQUFrQjthQUMvQjtTQUNKLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUNILEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBMkIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUV2RSxLQUFLLE1BQU0sS0FBSyxJQUFJLGlCQUFpQixFQUFFLENBQUM7WUFDcEMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzdELGNBQWMsRUFBRSxJQUFJO2dCQUNwQixJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJO2dCQUN0QixPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDN0IsR0FBRyxFQUFFLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBOEIsQ0FBQztnQkFDeEUsTUFBTSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTthQUM3QixDQUFDLENBQUMsQ0FBQztRQUNSLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDaEQsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1FBQ25CLGNBQWMsRUFBRSxJQUFJLENBQUMsR0FBRztRQUN4QixxQkFBcUIsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDcEQsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2VydGlmaWNhdGUoYXJnczogQ3JlYXRlQ2VydGlmaWNhdGVBcmdzKTogYXdzLmFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24ge1xuICAgIGNvbnN0IGNlcnQgPSBuZXcgYXdzLmFjbS5DZXJ0aWZpY2F0ZShhcmdzLm5hbWUsIHtcbiAgICAgICAgcmVnaW9uOiBhcmdzLnJlZ2lvbixcbiAgICAgICAgZG9tYWluTmFtZTogYXJncy5kb21haW4sXG4gICAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBhcmdzLnN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzLFxuICAgICAgICB2YWxpZGF0aW9uTWV0aG9kOiBcIkROU1wiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVjb3JkczogYXdzLnJvdXRlNTMuUmVjb3JkW10gPSBbXTtcblxuICAgIGNlcnQuZG9tYWluVmFsaWRhdGlvbk9wdGlvbnMuYXBwbHkoZG9tYWluVmFsaWRhdGlvbk9wdGlvbnMgPT4ge1xuICAgICAgICB0eXBlIERvbWFpblZhbGlkYXRpb25SZWNvcmQgPSB7XG4gICAgICAgICAgICBuYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICByZWNvcmQ6IHN0cmluZztcbiAgICAgICAgICAgIHR5cGU6IHN0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlZHVwbGljYXRlIGJ5IGRvbWFpbiBuYW1lLCBhcyBBQ00gc29tZXRpbWVzIHJldHVybnMgbXVsdGlwbGUgdmFsaWRhdGlvbiBvcHRpb25zIGZvciB0aGUgc2FtZSBkb21haW5cbiAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlY29yZHM6IHsga2V5OiBzdHJpbmc7IHZhbHVlOiBEb21haW5WYWxpZGF0aW9uUmVjb3JkIH1bXSA9IE9iamVjdC5lbnRyaWVzKGRvbWFpblZhbGlkYXRpb25PcHRpb25zLnJlZHVjZSgoX19vYmosIGR2bykgPT4gKHtcbiAgICAgICAgICAgIC4uLl9fb2JqLFxuICAgICAgICAgICAgW2R2by5kb21haW5OYW1lXToge1xuICAgICAgICAgICAgICAgIG5hbWU6IGR2by5yZXNvdXJjZVJlY29yZE5hbWUsXG4gICAgICAgICAgICAgICAgcmVjb3JkOiBkdm8ucmVzb3VyY2VSZWNvcmRWYWx1ZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBkdm8ucmVzb3VyY2VSZWNvcmRUeXBlLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KSwge30pKVxuICAgICAgICAgICAgLm1hcCgoW2ssIHZdKSA9PiAoeyBrZXk6IGssIHZhbHVlOiB2IGFzIERvbWFpblZhbGlkYXRpb25SZWNvcmQgfSkpO1xuXG4gICAgICAgIGZvciAoY29uc3QgcmFuZ2Ugb2YgdmFsaWRhdGlvblJlY29yZHMpIHtcbiAgICAgICAgICAgIHJlY29yZHMucHVzaChuZXcgYXdzLnJvdXRlNTMuUmVjb3JkKGAke2FyZ3MubmFtZX0tJHtyYW5nZS5rZXl9YCwge1xuICAgICAgICAgICAgICAgIGFsbG93T3ZlcndyaXRlOiB0cnVlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHJhbmdlLnZhbHVlLm5hbWUsXG4gICAgICAgICAgICAgICAgcmVjb3JkczogW3JhbmdlLnZhbHVlLnJlY29yZF0sXG4gICAgICAgICAgICAgICAgdHRsOiA2MCxcbiAgICAgICAgICAgICAgICB0eXBlOiBhd3Mucm91dGU1My5SZWNvcmRUeXBlW3JhbmdlLnZhbHVlLnR5cGUgYXMgYXdzLnJvdXRlNTMuUmVjb3JkVHlwZV0sXG4gICAgICAgICAgICAgICAgem9uZUlkOiBhcmdzLmhvc3RlZFpvbmUuaWQsXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgYXdzLmFjbS5DZXJ0aWZpY2F0ZVZhbGlkYXRpb24oYXJncy5uYW1lLCB7XG4gICAgICAgIHJlZ2lvbjogYXJncy5yZWdpb24sXG4gICAgICAgIGNlcnRpZmljYXRlQXJuOiBjZXJ0LmFybixcbiAgICAgICAgdmFsaWRhdGlvblJlY29yZEZxZG5zOiByZWNvcmRzLm1hcChyID0+IChyLmZxZG4pKSxcbiAgICB9KTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVDZXJ0aWZpY2F0ZUFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb21haW46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGhvc3RlZFpvbmU6IGF3cy5yb3V0ZTUzLlpvbmU7XG4gICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IHB1bHVtaS5JbnB1dDxzdHJpbmdbXT47XG4gICAgcmVnaW9uOiBzdHJpbmc7XG59XG4iXX0=