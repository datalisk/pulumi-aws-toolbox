import * as pulumi from "@pulumi/pulumi";
import { BuildSpec } from '../BuildSpec.js';
export declare class S3ArtifactProvider implements pulumi.dynamic.ResourceProvider<Inputs, Outputs> {
    private artifactExists;
    check(_: Inputs, news: Inputs): Promise<{}>;
    diff(): Promise<pulumi.dynamic.DiffResult>;
    create(args: Inputs): Promise<{
        id: string;
        outs: Outputs;
    }>;
    private buildAndDeploy;
}
interface Inputs {
    bucketName: string;
    bucketPath: string;
    buildSpec: BuildSpec;
}
interface Outputs {
}
export {};
