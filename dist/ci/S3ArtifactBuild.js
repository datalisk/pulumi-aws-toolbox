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
 * EXPERIMENTAL! This API may change!
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUzNBcnRpZmFjdEJ1aWxkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NpL1MzQXJ0aWZhY3RCdWlsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBLHNEQWFDO0FBbENELHVEQUF5QztBQUN6Qyw4QkFBbUM7QUFFbkMsc0VBQW1FO0FBS25FOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILFNBQWdCLHFCQUFxQixDQUFDLElBQVksRUFBRSxJQUF3QjtJQUN4RSxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUEsZUFBVSxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM1RSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXBGLE1BQU0sS0FBSyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksRUFBRTtRQUNwQyxVQUFVLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1FBQ2xDLFVBQVUsRUFBRSxRQUFRLENBQUMsSUFBSTtRQUN6QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7S0FDNUIsQ0FBQyxDQUFDO0lBRUgseURBQXlEO0lBQ3pELHdFQUF3RTtJQUN4RSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztBQUNwRyxDQUFDO0FBUUQsTUFBTSxlQUFnQixTQUFRLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUTtJQUNqRCxZQUFZLElBQVksRUFBRSxJQUF5QixFQUFFLElBQW1DO1FBQ3BGLE1BQU0sSUFBSSxHQUFHO1lBQ1QsR0FBRyxJQUFJO1NBQ1YsQ0FBQztRQUNGLEtBQUssQ0FBQyxJQUFJLHVDQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0IHsgZ2V0VmVyc2lvbiB9IGZyb20gXCIuLi9jaVwiO1xuaW1wb3J0IHsgQnVpbGRTcGVjIH0gZnJvbSBcIi4vQnVpbGRTcGVjXCI7XG5pbXBvcnQgeyBTM0FydGlmYWN0UHJvdmlkZXIgfSBmcm9tIFwiLi9wcm92aWRlci9TM0FydGlmYWN0UHJvdmlkZXJcIjtcbmltcG9ydCB7IFMzQXJ0aWZhY3RTdG9yZSB9IGZyb20gXCIuL1MzQXJ0aWZhY3RTdG9yZVwiO1xuaW1wb3J0IHsgUzNGb2xkZXIgfSBmcm9tIFwiLi9TM0ZvbGRlclwiO1xuXG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgQ0kgYnVpbGQgZm9yIHRoZSBnaXZlbiBhcnRpZmFjdC5cbiAqIFxuICogVGhlIGFydGlmYWN0IHZlcnNpb24gaXMgdGhlIEdpdCBjb21taXQgaGFzaCB3aGVuIHRoZSBzb3VyY2UgZGlyIHdhcyBsYXN0IGNoYW5nZWQuXG4gKiBUaGUgYXJ0aWZhY3Qgd2lsbCBiZSBidWlsdCBhbmQgZGVwbG95ZWQgd2hlbiB0aGUgYXJ0aWZhY3QgdmVyc2lvbiBpcyBub3QgeWV0IHByZXNlbnQgaW4gdGhlIFMzQXJ0aWZhY3RTdG9yZS5cbiAqIFRoZXJmb3JlLCBvbmx5IG5ldyBjb21taXRzIHRoYXQgY2hhbmdlIHRoZSBzb3VyY2UgZGlyIHdpbGwgdHJpZ2dlciBhIHJlYnVpbGQuXG4gKiAgXG4gKiBFWFBFUklNRU5UQUwhIFRoaXMgQVBJIG1heSBjaGFuZ2UhXG4gKiBcbiAqIEBwYXJhbSBuYW1lIGxvZ2ljYWwgcmVzb3VyY2UgbmFtZVxuICogQHBhcmFtIGFyZ3MgXG4gKiBAcmV0dXJucyBhIFMzRm9sZGVyIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTM0FydGlmYWN0QnVpbGQobmFtZTogc3RyaW5nLCBhcmdzOiBDcmVhdGVBcnRpZmFjdEFyZ3MpOiBTM0ZvbGRlciB7XG4gICAgY29uc3QgYXJ0aWZhY3RWZXJzaW9uID0gcHVsdW1pLm91dHB1dChnZXRWZXJzaW9uKGFyZ3MuYnVpbGRTcGVjLnNvdXJjZURpcikpO1xuICAgIGNvbnN0IGFydGlmYWN0ID0gYXJncy5hcnRpZmFjdFN0b3JlLmdldEFydGlmYWN0KGFyZ3MuYXJ0aWZhY3ROYW1lLCBhcnRpZmFjdFZlcnNpb24pO1xuXG4gICAgY29uc3QgYnVpbGQgPSBuZXcgUzNBcnRpZmFjdEJ1aWxkKG5hbWUsIHtcbiAgICAgICAgYnVja2V0TmFtZTogYXJ0aWZhY3QuYnVja2V0LmJ1Y2tldCxcbiAgICAgICAgYnVja2V0UGF0aDogYXJ0aWZhY3QucGF0aCxcbiAgICAgICAgYnVpbGRTcGVjOiBhcmdzLmJ1aWxkU3BlYyxcbiAgICB9KTtcblxuICAgIC8vIHJldHVybiBhIFMzRm9sZGVyIGluc3RhbmNlLCB0aGF0IGRlcGVuZHMgb24gdGhlIGJ1aWxkLlxuICAgIC8vIGVuc3VyZXMgQ2xvdWRGcm9udCBldGMgZG9lc24ndCBnZXQgdXBkYXRlZCBiZWZvcmUgdGhlIGJ1aWxkIHN1Y2NlZWRzLlxuICAgIHJldHVybiBhcmdzLmFydGlmYWN0U3RvcmUuZ2V0QXJ0aWZhY3QoYXJncy5hcnRpZmFjdE5hbWUsIGJ1aWxkLmlkLmFwcGx5KCgpID0+IGFydGlmYWN0VmVyc2lvbikpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUFydGlmYWN0QXJncyB7XG4gICAgYXJ0aWZhY3RTdG9yZTogUzNBcnRpZmFjdFN0b3JlLFxuICAgIGFydGlmYWN0TmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgYnVpbGRTcGVjOiBCdWlsZFNwZWM7XG59XG5cbmNsYXNzIFMzQXJ0aWZhY3RCdWlsZCBleHRlbmRzIHB1bHVtaS5keW5hbWljLlJlc291cmNlIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFMzQXJ0aWZhY3RCdWlsZEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ3VzdG9tUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG91dHMgPSB7XG4gICAgICAgICAgICAuLi5hcmdzXG4gICAgICAgIH07XG4gICAgICAgIHN1cGVyKG5ldyBTM0FydGlmYWN0UHJvdmlkZXIsIG5hbWUsIG91dHMsIG9wdHMpO1xuICAgIH1cbn1cblxuaW50ZXJmYWNlIFMzQXJ0aWZhY3RCdWlsZEFyZ3Mge1xuICAgIGJ1Y2tldE5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGJ1Y2tldFBhdGg6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGJ1aWxkU3BlYzogQnVpbGRTcGVjO1xufVxuIl19