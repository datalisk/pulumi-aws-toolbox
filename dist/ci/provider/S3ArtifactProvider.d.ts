import * as pulumi from "@pulumi/pulumi";
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
    buildSpec: ProviderBuildSpec;
}
interface ProviderBuildSpec {
    readonly sourceDir: string;
    readonly commands: string[];
    readonly environmentVariables?: {
        [key: string]: string;
    };
    /**
     * The path of the directory that will be used for the artifact's content.
     */
    readonly outputDir: string;
}
interface Outputs {
}
export {};
