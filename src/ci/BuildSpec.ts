/**
 * Highly experimental API! Will likely change.
 */
export interface BuildSpec {
    readonly sourceDir: string;
    readonly commands: string[];

    /**
     * The path of the directory that will be used for the artifact's content.
     */
    readonly outputDir: string;
}
