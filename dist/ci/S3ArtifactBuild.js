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
 * The artifact version is the Git commit hash when the source dir was last changed.
 * The artifact will be built and deployed when the artifact version is not yet present in the S3ArtifactStore.
 * Therfore, only new commits that change the source dir will trigger a rebuild.
 *
 * @param name logical resource name
 * @param args
 * @returns a S3Folder instance
 */
function createS3ArtifactBuild(name, args) {
    const artifactVersion = pulumi.output((0, ci_1.getVersion)(args.buildSpec.sourceDir));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUzNBcnRpZmFjdEJ1aWxkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NpL1MzQXJ0aWZhY3RCdWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLHNEQWFDO0FBaENELHVEQUF5QztBQUN6Qyw4QkFBbUM7QUFFbkMsc0VBQW1FO0FBS25FOzs7Ozs7Ozs7O0dBVUc7QUFDSCxTQUFnQixxQkFBcUIsQ0FBQyxJQUFZLEVBQUUsSUFBd0I7SUFDeEUsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFBLGVBQVUsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDNUUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztJQUVwRixNQUFNLEtBQUssR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUU7UUFDcEMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTTtRQUNsQyxVQUFVLEVBQUUsUUFBUSxDQUFDLElBQUk7UUFDekIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO0tBQzVCLENBQUMsQ0FBQztJQUVILHlEQUF5RDtJQUN6RCx3RUFBd0U7SUFDeEUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7QUFDcEcsQ0FBQztBQVFELE1BQU0sZUFBZ0IsU0FBUSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVE7SUFDakQsWUFBWSxJQUFZLEVBQUUsSUFBeUIsRUFBRSxJQUFtQztRQUNwRixNQUFNLElBQUksR0FBRztZQUNULEdBQUcsSUFBSTtTQUNWLENBQUM7UUFDRixLQUFLLENBQUMsSUFBSSx1Q0FBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCB7IGdldFZlcnNpb24gfSBmcm9tIFwiLi4vY2lcIjtcbmltcG9ydCB7IEJ1aWxkU3BlYyB9IGZyb20gXCIuL0J1aWxkU3BlY1wiO1xuaW1wb3J0IHsgUzNBcnRpZmFjdFByb3ZpZGVyIH0gZnJvbSBcIi4vcHJvdmlkZXIvUzNBcnRpZmFjdFByb3ZpZGVyXCI7XG5pbXBvcnQgeyBTM0FydGlmYWN0U3RvcmUgfSBmcm9tIFwiLi9TM0FydGlmYWN0U3RvcmVcIjtcbmltcG9ydCB7IFMzRm9sZGVyIH0gZnJvbSBcIi4vUzNGb2xkZXJcIjtcblxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIENJIGJ1aWxkIGZvciB0aGUgZ2l2ZW4gYXJ0aWZhY3QuXG4gKiBcbiAqIFRoZSBhcnRpZmFjdCB2ZXJzaW9uIGlzIHRoZSBHaXQgY29tbWl0IGhhc2ggd2hlbiB0aGUgc291cmNlIGRpciB3YXMgbGFzdCBjaGFuZ2VkLlxuICogVGhlIGFydGlmYWN0IHdpbGwgYmUgYnVpbHQgYW5kIGRlcGxveWVkIHdoZW4gdGhlIGFydGlmYWN0IHZlcnNpb24gaXMgbm90IHlldCBwcmVzZW50IGluIHRoZSBTM0FydGlmYWN0U3RvcmUuXG4gKiBUaGVyZm9yZSwgb25seSBuZXcgY29tbWl0cyB0aGF0IGNoYW5nZSB0aGUgc291cmNlIGRpciB3aWxsIHRyaWdnZXIgYSByZWJ1aWxkLlxuICogXG4gKiBAcGFyYW0gbmFtZSBsb2dpY2FsIHJlc291cmNlIG5hbWVcbiAqIEBwYXJhbSBhcmdzIFxuICogQHJldHVybnMgYSBTM0ZvbGRlciBpbnN0YW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUzNBcnRpZmFjdEJ1aWxkKG5hbWU6IHN0cmluZywgYXJnczogQ3JlYXRlQXJ0aWZhY3RBcmdzKTogUzNGb2xkZXIge1xuICAgIGNvbnN0IGFydGlmYWN0VmVyc2lvbiA9IHB1bHVtaS5vdXRwdXQoZ2V0VmVyc2lvbihhcmdzLmJ1aWxkU3BlYy5zb3VyY2VEaXIpKTtcbiAgICBjb25zdCBhcnRpZmFjdCA9IGFyZ3MuYXJ0aWZhY3RTdG9yZS5nZXRBcnRpZmFjdChhcmdzLmFydGlmYWN0TmFtZSwgYXJ0aWZhY3RWZXJzaW9uKTtcblxuICAgIGNvbnN0IGJ1aWxkID0gbmV3IFMzQXJ0aWZhY3RCdWlsZChuYW1lLCB7XG4gICAgICAgIGJ1Y2tldE5hbWU6IGFydGlmYWN0LmJ1Y2tldC5idWNrZXQsXG4gICAgICAgIGJ1Y2tldFBhdGg6IGFydGlmYWN0LnBhdGgsXG4gICAgICAgIGJ1aWxkU3BlYzogYXJncy5idWlsZFNwZWMsXG4gICAgfSk7XG5cbiAgICAvLyByZXR1cm4gYSBTM0ZvbGRlciBpbnN0YW5jZSwgdGhhdCBkZXBlbmRzIG9uIHRoZSBidWlsZC5cbiAgICAvLyBlbnN1cmVzIENsb3VkRnJvbnQgZXRjIGRvZXNuJ3QgZ2V0IHVwZGF0ZWQgYmVmb3JlIHRoZSBidWlsZCBzdWNjZWVkcy5cbiAgICByZXR1cm4gYXJncy5hcnRpZmFjdFN0b3JlLmdldEFydGlmYWN0KGFyZ3MuYXJ0aWZhY3ROYW1lLCBidWlsZC5pZC5hcHBseSgoKSA9PiBhcnRpZmFjdFZlcnNpb24pKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDcmVhdGVBcnRpZmFjdEFyZ3Mge1xuICAgIGFydGlmYWN0U3RvcmU6IFMzQXJ0aWZhY3RTdG9yZSxcbiAgICBhcnRpZmFjdE5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjO1xufVxuXG5jbGFzcyBTM0FydGlmYWN0QnVpbGQgZXh0ZW5kcyBwdWx1bWkuZHluYW1pYy5SZXNvdXJjZSB7XG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTM0FydGlmYWN0QnVpbGRBcmdzLCBvcHRzPzogcHVsdW1pLkN1c3RvbVJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBjb25zdCBvdXRzID0ge1xuICAgICAgICAgICAgLi4uYXJnc1xuICAgICAgICB9O1xuICAgICAgICBzdXBlcihuZXcgUzNBcnRpZmFjdFByb3ZpZGVyLCBuYW1lLCBvdXRzLCBvcHRzKTtcbiAgICB9XG59XG5cbmludGVyZmFjZSBTM0FydGlmYWN0QnVpbGRBcmdzIHtcbiAgICBidWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBidWNrZXRQYXRoOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBidWlsZFNwZWM6IEJ1aWxkU3BlYztcbn1cbiJdfQ==