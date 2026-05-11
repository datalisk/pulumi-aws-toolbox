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
exports.createS3ArtifactBuild = createS3ArtifactBuild;
const pulumi = __importStar(require("@pulumi/pulumi"));
const ci_1 = require("../ci");
const S3ArtifactProvider_1 = require("./provider/S3ArtifactProvider");
/**
 * Registers a CI build for the given artifact.
 *
 * The artifact version is composed of
 * - the Git commit hash when the source dir was last changed
 * - and a hash of the build spec (commands, env vars etc).
 *
 * The artifact will be built and deployed when the artifact version is not yet present in the S3ArtifactStore.
 *
 * @param name logical resource name
 * @param args
 * @returns a S3Folder instance
 */
function createS3ArtifactBuild(name, args) {
    const sourceCodeVersion = pulumi.output((0, ci_1.getVersion)(args.buildSpec.sourceDir));
    const artifactVersion = pulumi.interpolate `${sourceCodeVersion}-${getBuildSpecHash(args.buildSpec)}`;
    const artifact = args.artifactStore.getArtifact(args.artifactName, artifactVersion);
    const build = new S3ArtifactBuild(name, {
        bucketName: artifact.bucket.bucket,
        bucketPath: artifact.path,
        buildSpec: args.buildSpec,
    });
    // return a S3Folder instance, that depends on the build.
    // ensures CloudFront etc doesn't get updated before the build succeeds.
    return args.artifactStore.getArtifact(args.artifactName, build.id.apply(() => artifactVersion));
}
class S3ArtifactBuild extends pulumi.dynamic.Resource {
    constructor(name, args, opts) {
        const outs = {
            ...args
        };
        super(new S3ArtifactProvider_1.S3ArtifactProvider, name, outs, opts);
    }
}
function getBuildSpecHash(buildSpec) {
    const json = JSON.stringify(buildSpec);
    const hash = require('crypto').createHash('sha256');
    hash.update(json);
    return hash.digest('hex').substring(0, 4);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUzNBcnRpZmFjdEJ1aWxkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NpL1MzQXJ0aWZhY3RCdWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLHNEQWVDO0FBcENELHVEQUF5QztBQUN6Qyw4QkFBbUM7QUFFbkMsc0VBQW1FO0FBS25FOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILFNBQWdCLHFCQUFxQixDQUFDLElBQVksRUFBRSxJQUF3QjtJQUN4RSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBQSxlQUFVLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzlFLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUEsR0FBRyxpQkFBaUIsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztJQUVyRyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXBGLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksRUFBRTtRQUNwQyxVQUFVLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1FBQ2xDLFVBQVUsRUFBRSxRQUFRLENBQUMsSUFBSTtRQUN6QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7S0FDNUIsQ0FBQyxDQUFDO0lBRUgseURBQXlEO0lBQ3pELHdFQUF3RTtJQUN4RSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztBQUNwRyxDQUFDO0FBUUQsTUFBTSxlQUFnQixTQUFRLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUTtJQUNqRCxZQUFZLElBQVksRUFBRSxJQUF5QixFQUFFLElBQW1DO1FBQ3BGLE1BQU0sSUFBSSxHQUFHO1lBQ1QsR0FBRyxJQUFJO1NBQ1YsQ0FBQztRQUNGLEtBQUssQ0FBQyxJQUFJLHVDQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNKO0FBUUQsU0FBUyxnQkFBZ0IsQ0FBQyxTQUFvQjtJQUMxQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgZ2V0VmVyc2lvbiB9IGZyb20gXCIuLi9jaVwiO1xuaW1wb3J0IHsgQnVpbGRTcGVjIH0gZnJvbSBcIi4vQnVpbGRTcGVjXCI7XG5pbXBvcnQgeyBTM0FydGlmYWN0UHJvdmlkZXIgfSBmcm9tIFwiLi9wcm92aWRlci9TM0FydGlmYWN0UHJvdmlkZXJcIjtcbmltcG9ydCB7IFMzQXJ0aWZhY3RTdG9yZSB9IGZyb20gXCIuL1MzQXJ0aWZhY3RTdG9yZVwiO1xuaW1wb3J0IHsgUzNGb2xkZXIgfSBmcm9tIFwiLi9TM0ZvbGRlclwiO1xuXG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgQ0kgYnVpbGQgZm9yIHRoZSBnaXZlbiBhcnRpZmFjdC5cbiAqIFxuICogVGhlIGFydGlmYWN0IHZlcnNpb24gaXMgY29tcG9zZWQgb2ZcbiAqIC0gdGhlIEdpdCBjb21taXQgaGFzaCB3aGVuIHRoZSBzb3VyY2UgZGlyIHdhcyBsYXN0IGNoYW5nZWRcbiAqIC0gYW5kIGEgaGFzaCBvZiB0aGUgYnVpbGQgc3BlYyAoY29tbWFuZHMsIGVudiB2YXJzIGV0YykuXG4gKiBcbiAqIFRoZSBhcnRpZmFjdCB3aWxsIGJlIGJ1aWx0IGFuZCBkZXBsb3llZCB3aGVuIHRoZSBhcnRpZmFjdCB2ZXJzaW9uIGlzIG5vdCB5ZXQgcHJlc2VudCBpbiB0aGUgUzNBcnRpZmFjdFN0b3JlLlxuICogXG4gKiBAcGFyYW0gbmFtZSBsb2dpY2FsIHJlc291cmNlIG5hbWVcbiAqIEBwYXJhbSBhcmdzIFxuICogQHJldHVybnMgYSBTM0ZvbGRlciBpbnN0YW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUzNBcnRpZmFjdEJ1aWxkKG5hbWU6IHN0cmluZywgYXJnczogQ3JlYXRlQXJ0aWZhY3RBcmdzKTogUzNGb2xkZXIge1xuICAgIGNvbnN0IHNvdXJjZUNvZGVWZXJzaW9uID0gcHVsdW1pLm91dHB1dChnZXRWZXJzaW9uKGFyZ3MuYnVpbGRTcGVjLnNvdXJjZURpcikpO1xuICAgIGNvbnN0IGFydGlmYWN0VmVyc2lvbiA9IHB1bHVtaS5pbnRlcnBvbGF0ZWAke3NvdXJjZUNvZGVWZXJzaW9ufS0ke2dldEJ1aWxkU3BlY0hhc2goYXJncy5idWlsZFNwZWMpfWA7XG5cbiAgICBjb25zdCBhcnRpZmFjdCA9IGFyZ3MuYXJ0aWZhY3RTdG9yZS5nZXRBcnRpZmFjdChhcmdzLmFydGlmYWN0TmFtZSwgYXJ0aWZhY3RWZXJzaW9uKTtcblxuICAgIGNvbnN0IGJ1aWxkID0gbmV3IFMzQXJ0aWZhY3RCdWlsZChuYW1lLCB7XG4gICAgICAgIGJ1Y2tldE5hbWU6IGFydGlmYWN0LmJ1Y2tldC5idWNrZXQsXG4gICAgICAgIGJ1Y2tldFBhdGg6IGFydGlmYWN0LnBhdGgsXG4gICAgICAgIGJ1aWxkU3BlYzogYXJncy5idWlsZFNwZWMsXG4gICAgfSk7XG5cbiAgICAvLyByZXR1cm4gYSBTM0ZvbGRlciBpbnN0YW5jZSwgdGhhdCBkZXBlbmRzIG9uIHRoZSBidWlsZC5cbiAgICAvLyBlbnN1cmVzIENsb3VkRnJvbnQgZXRjIGRvZXNuJ3QgZ2V0IHVwZGF0ZWQgYmVmb3JlIHRoZSBidWlsZCBzdWNjZWVkcy5cbiAgICByZXR1cm4gYXJncy5hcnRpZmFjdFN0b3JlLmdldEFydGlmYWN0KGFyZ3MuYXJ0aWZhY3ROYW1lLCBidWlsZC5pZC5hcHBseSgoKSA9PiBhcnRpZmFjdFZlcnNpb24pKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVBcnRpZmFjdEFyZ3Mge1xuICAgIGFydGlmYWN0U3RvcmU6IFMzQXJ0aWZhY3RTdG9yZSxcbiAgICBhcnRpZmFjdE5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjO1xufVxuXG5jbGFzcyBTM0FydGlmYWN0QnVpbGQgZXh0ZW5kcyBwdWx1bWkuZHluYW1pYy5SZXNvdXJjZSB7XG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTM0FydGlmYWN0QnVpbGRBcmdzLCBvcHRzPzogcHVsdW1pLkN1c3RvbVJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBjb25zdCBvdXRzID0ge1xuICAgICAgICAgICAgLi4uYXJnc1xuICAgICAgICB9O1xuICAgICAgICBzdXBlcihuZXcgUzNBcnRpZmFjdFByb3ZpZGVyLCBuYW1lLCBvdXRzLCBvcHRzKTtcbiAgICB9XG59XG5cbmludGVyZmFjZSBTM0FydGlmYWN0QnVpbGRBcmdzIHtcbiAgICBidWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBidWNrZXRQYXRoOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYztcbn1cblxuZnVuY3Rpb24gZ2V0QnVpbGRTcGVjSGFzaChidWlsZFNwZWM6IEJ1aWxkU3BlYyk6IHN0cmluZyB7XG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KGJ1aWxkU3BlYyk7XG4gICAgY29uc3QgaGFzaCA9IHJlcXVpcmUoJ2NyeXB0bycpLmNyZWF0ZUhhc2goJ3NoYTI1NicpO1xuICAgIGhhc2gudXBkYXRlKGpzb24pO1xuICAgIHJldHVybiBoYXNoLmRpZ2VzdCgnaGV4Jykuc3Vic3RyaW5nKDAsIDQpO1xufVxuIl19