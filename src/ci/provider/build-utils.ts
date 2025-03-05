import { spawn } from "child_process";

export async function executeCommand(workingDir: string, command: string) {
    return new Promise((resolve, reject) => {
        const childProcess = spawn(command, {
            cwd: workingDir,
            shell: true,
        });

        // Stream the stdout data to the console
        childProcess.stdout.on('data', (data: Buffer) => {
            process.stdout.write(data.toString());
        });

        // Stream the stderr data to the console
        childProcess.stderr.on('data', (data: Buffer) => {
            process.stderr.write(data.toString());
        });

        // Handle process close
        childProcess.on('close', (code: number) => {
            if (code === 0) {
                resolve(`Command finished with exit code ${code}`);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        // Handle errors
        childProcess.on('error', (error: Error) => {
            reject(new Error(`Error executing command: ${error.message}`));
        });
    });
}
