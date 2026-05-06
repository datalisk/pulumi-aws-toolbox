import * as pulumi from "@pulumi/pulumi";

export interface BuildSpec {
    readonly sourceDir: string;

    readonly commands: pulumi.Input<string>[];

    readonly environmentVariables?: pulumi.Input<{
        [key: string]: pulumi.Input<string>;
    }>;

    /**
     * The path of the directory that will be used for the artifact's content.
     */
    readonly outputDir: string;
}
