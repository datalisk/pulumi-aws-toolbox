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
exports.createHostDnsRecords = createHostDnsRecords;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
async function createHostDnsRecords(name, fullDomain, ipv4Address, ipv6Address, ttl, opts) {
    const { subdomain, zoneDomain } = pulumi.output(fullDomain).apply(domain => parseFullDomain(domain));
    const hostedZone = zoneDomain.apply(domain => aws.route53.getZone({ name: domain }));
    new aws.route53.Record(`${name}-a`, {
        zoneId: hostedZone.zoneId,
        name: subdomain,
        type: "A",
        ttl,
        records: [ipv4Address],
    }, opts);
    new aws.route53.Record(`${name}-aaaa`, {
        zoneId: hostedZone.zoneId,
        name: subdomain,
        type: "AAAA",
        ttl,
        records: [ipv6Address],
    }, opts);
}
function parseFullDomain(fullDomain) {
    const parts = fullDomain.split(".");
    if (parts.length < 3) {
        throw new Error(`Domain name ${fullDomain} must include at least one subdomain.`);
    }
    const subdomain = parts.slice(0, parts.length - 2).join(".");
    const zoneDomain = parts.slice(parts.length - 2).join(".");
    return { subdomain, zoneDomain };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Rucy9kbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLG9EQW9CQztBQXZCRCxpREFBbUM7QUFDbkMsdURBQXlDO0FBRWxDLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsVUFBZ0MsRUFBRSxXQUFpQyxFQUFFLFdBQWlDLEVBQUUsR0FBVyxFQUFFLElBQXNDO0lBQ2hOLE1BQU0sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUVyRyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXJGLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRTtRQUNoQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07UUFDekIsSUFBSSxFQUFFLFNBQVM7UUFDZixJQUFJLEVBQUUsR0FBRztRQUNULEdBQUc7UUFDSCxPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUM7S0FDekIsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVULElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBRTtRQUNuQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07UUFDekIsSUFBSSxFQUFFLFNBQVM7UUFDZixJQUFJLEVBQUUsTUFBTTtRQUNaLEdBQUc7UUFDSCxPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUM7S0FDekIsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxVQUFrQjtJQUN2QyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsVUFBVSx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFDRCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM3RCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzNELE9BQU8sRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUM7QUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUhvc3REbnNSZWNvcmRzKG5hbWU6IHN0cmluZywgZnVsbERvbWFpbjogcHVsdW1pLklucHV0PHN0cmluZz4sIGlwdjRBZGRyZXNzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPiwgaXB2NkFkZHJlc3M6IHB1bHVtaS5JbnB1dDxzdHJpbmc+LCB0dGw6IG51bWJlciwgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBjb25zdCB7IHN1YmRvbWFpbiwgem9uZURvbWFpbiB9ID0gcHVsdW1pLm91dHB1dChmdWxsRG9tYWluKS5hcHBseShkb21haW4gPT4gcGFyc2VGdWxsRG9tYWluKGRvbWFpbikpO1xuXG4gICAgY29uc3QgaG9zdGVkWm9uZSA9IHpvbmVEb21haW4uYXBwbHkoZG9tYWluID0+IGF3cy5yb3V0ZTUzLmdldFpvbmUoeyBuYW1lOiBkb21haW4gfSkpO1xuXG4gICAgbmV3IGF3cy5yb3V0ZTUzLlJlY29yZChgJHtuYW1lfS1hYCwge1xuICAgICAgICB6b25lSWQ6IGhvc3RlZFpvbmUuem9uZUlkLFxuICAgICAgICBuYW1lOiBzdWJkb21haW4sXG4gICAgICAgIHR5cGU6IFwiQVwiLFxuICAgICAgICB0dGwsXG4gICAgICAgIHJlY29yZHM6IFtpcHY0QWRkcmVzc10sXG4gICAgfSwgb3B0cyk7XG5cbiAgICBuZXcgYXdzLnJvdXRlNTMuUmVjb3JkKGAke25hbWV9LWFhYWFgLCB7XG4gICAgICAgIHpvbmVJZDogaG9zdGVkWm9uZS56b25lSWQsXG4gICAgICAgIG5hbWU6IHN1YmRvbWFpbixcbiAgICAgICAgdHlwZTogXCJBQUFBXCIsXG4gICAgICAgIHR0bCxcbiAgICAgICAgcmVjb3JkczogW2lwdjZBZGRyZXNzXSxcbiAgICB9LCBvcHRzKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VGdWxsRG9tYWluKGZ1bGxEb21haW46IHN0cmluZykge1xuICAgIGNvbnN0IHBhcnRzID0gZnVsbERvbWFpbi5zcGxpdChcIi5cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb21haW4gbmFtZSAke2Z1bGxEb21haW59IG11c3QgaW5jbHVkZSBhdCBsZWFzdCBvbmUgc3ViZG9tYWluLmApO1xuICAgIH1cbiAgICBjb25zdCBzdWJkb21haW4gPSBwYXJ0cy5zbGljZSgwLCBwYXJ0cy5sZW5ndGggLSAyKS5qb2luKFwiLlwiKTtcbiAgICBjb25zdCB6b25lRG9tYWluID0gcGFydHMuc2xpY2UocGFydHMubGVuZ3RoIC0gMikuam9pbihcIi5cIik7XG4gICAgcmV0dXJuIHsgc3ViZG9tYWluLCB6b25lRG9tYWluIH07XG59XG4iXX0=