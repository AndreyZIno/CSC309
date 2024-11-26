import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { Writable } from 'stream';

const prisma = new PrismaClient();
const docker = new Docker();

interface ExecuteRequest extends NextApiRequest {
    body: {
        code?: string;
        language?: string;
        input?: string;
        templateId?: number;
    };
}

export default async function handler(req: ExecuteRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST method is allowed' });
    }

    const { code, language, input, templateId } = req.body;

    if (!code) {
        return res.status(400).json({error: 'Please provide code before running it.'})
    }

    let finalCode = code;
    let finalLanguage = language;

    // Fetch template if templateId is provided
    if (templateId) {
        try {
            const template = await prisma.template.findUnique({ where: { id: templateId } });
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            finalCode = template.code;
            finalLanguage = template.language || language;
        } catch (error) {
            return res.status(500).json({ error: 'Error fetching template' });
        }
    }

    if (!finalCode || !finalLanguage) {
        return res.status(400).json({ error: 'Missing code and/or language.' });
    }

    const fileExtensionMap: Record<string, string> = {
        python: 'py',
        c: 'c',
        cpp: 'cpp',
        java: 'java',
        javascript: 'js',
        ruby: 'rb',
        php: 'php',
        go: 'go',
        rust: 'rs',
        swift: 'swift',
        kotlin: 'kt',
        typescript: 'ts',
        perl: 'pl',
        shell: 'sh',
        haskell: 'hs',
    };

    const fileExtension = fileExtensionMap[finalLanguage];
    if (!fileExtension) {
        return res.status(400).json({ error: `Unsupported language: ${finalLanguage}` });
    }

    const dockerImageMap: Record<string, string> = {
        python: 'code-executor-python',
        c: 'code-executor-c',
        cpp: 'code-executor-cpp',
        java: 'code-executor-java',
        javascript: 'code-executor-javascript',
        ruby: 'code-executor-ruby',
        php: 'code-executor-php',
        go: 'code-executor-go',
        rust: 'code-executor-rust',
        swift: 'code-executor-swift',
        kotlin: 'code-executor-kotlin',
        typescript: 'code-executor-typescript',
        perl: 'code-executor-perl',
        shell: 'code-executor-shell',
        haskell: 'code-executor-haskell',
    };

    const dockerImage = dockerImageMap[finalLanguage];
    if (!dockerImage) {
        return res.status(400).json({ error: `Unsupported language: ${finalLanguage}` });
    }

    const uniqueId = uuidv4();
    const fileName = finalLanguage === 'java' ? 'Main.java' : `code_${uniqueId}.${fileExtension}`;
    const codeFilePath = `/tmp/${fileName}`;
    const inputFilePath = `/tmp/input_${uniqueId}.txt`;

    try {
        fs.writeFileSync(codeFilePath, finalCode, { mode: 0o644 });
        console.log(`Code file created at: ${codeFilePath}`);
        fs.writeFileSync(inputFilePath, input || '', { mode: 0o644 });
        console.log(`Input file created at: ${inputFilePath}`);
    } catch (err) {
        console.error('Error creating files:', err);
        return res.status(500).json({ error: 'Failed to create temporary files.' });
    }

    const cmd = [
        finalLanguage, 
        `/code/${finalLanguage === 'java' ? 'Main.java' : `code.${fileExtension}`}`,
        '/code/input.txt'
    ];

    try {
        const container = await docker.createContainer({
            Image: dockerImage,
            Tty: false,
            AttachStdout: true,
            AttachStderr: true,
            HostConfig: {
                AutoRemove: true,
                Binds: [
                    `${codeFilePath}:${finalLanguage === 'java' ? '/code/Main.java' : `/code/code.${fileExtension}`}:ro`,
                    `${inputFilePath}:/code/input.txt:ro`,
                ],
                Memory: 1536 * 1024 * 1024, // 1.5 GB (From ChatGPT)
                MemorySwap: 2048 * 1024 * 1024, // 2 GB (From ChatGPT)
                CpuShares: 1024, // Full CPU (From ChatGPT)
                NanoCpus: 1000000000, // 100% of one CPU (From ChatGPT)
                PidsLimit: 500, // Increase process limit (From ChatGPT)
            },
            Cmd: cmd,
        });

        const stream = await container.attach({ stream: true, stdout: true, stderr: true });

        let stdout = '';
        let stderr = '';

        // Demux - to split stdout and stderr (from ChatGPT)
        const stdoutStream = new Writable({
            write(chunk, encoding, callback) {
                stdout += chunk.toString();
                callback();
            },
        });

        const stderrStream = new Writable({
            write(chunk, encoding, callback) {
                stderr += chunk.toString();
                callback();
            },
        });

        // Use Docker's demuxStream to separate stdout and stderr
        docker.modem.demuxStream(stream, stdoutStream, stderrStream);

        container.start();

        const timeout = setTimeout(async () => {
            console.log('Execution timeout reached');
            try {
                await container.kill();
            } catch (err) {
                console.error('Failed to stop container after timeout:', err);
            }
            res.status(408).json({ error: 'Code execution timed out.' });
        }, 9000);

        stream.on('end', async () => {
            try {
                const containerData = await container.wait();

                const sanitizedStdout = stdout.replace(/[^\x20-\x7E\n]/g, '').trim();
                const sanitizedStderr = stderr.replace(/[^\x20-\x7E\n]/g, '').trim();
        
                res.status(containerData.StatusCode === 0 ? 200 : 400).json({
                    stdout: sanitizedStdout,
                    stderr: sanitizedStderr,
                });
            } catch (err) {
                console.error('Docker execution error:', err);
                res.status(500).json({ error: 'Error during code execution' });
            } finally {
                await new Promise(resolve => setTimeout(resolve, 1000)); // for auto container cleanup
                try {
                    if (fs.existsSync(codeFilePath)) {
                        fs.unlinkSync(codeFilePath);
                        console.log(`Deleted code file: ${codeFilePath}`);
                    }
                    if (fs.existsSync(inputFilePath)) {
                        fs.unlinkSync(inputFilePath);
                        console.log(`Deleted input file: ${inputFilePath}`);
                    }
                } catch (cleanupErr) {
                    console.error('Failed to delete temporary files:', cleanupErr);
                }
            }
        });
    } catch (err) {
        console.error('Docker error:', err);
        res.status(500).json({ error: 'Could not execute code in Docker' });
    }
}