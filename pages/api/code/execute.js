import { spawn } from 'child_process';
// ChatGPT suggested the use of this library ^
// How it works: Node.js passes command to the OS, then OS runs it
// This ^^ happens as a child process, so that main Node.js server isnt blocked
// Used to have exec, but needed to switch to span for stdin
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Use this package^^ to generate unique file names (from ChatGPT)

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST method is allowed' });
    }

    const {code, language, input } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Missing code and/or language.' });
    }

    let compiler = '';
    let args = [];
    let filePath = '';
    let fileName = '';
    switch (language) {
        case 'c':
            fileName = `program_${uuidv4()}.c`;
            filePath = path.join('/tmp', fileName);
            fs.writeFileSync(filePath, code);
            
            compiler = 'gcc';
            args = [filePath, '-o', '/tmp/program'];
            break;
        
        case 'cpp':
            fileName = `program_${uuidv4()}.cpp`;
            filePath = path.join('/tmp', fileName);
            fs.writeFileSync(filePath, code);
            
            compiler = 'g++';
            args = [filePath, '-o', '/tmp/program'];
            break;
        
        case 'java':
            // From ChatGPT, how to compile then execute
            fileName = 'Main.java';
            filePath = path.join('/tmp', fileName);
            fs.writeFileSync(filePath, code);
            compiler = 'javac';
            args = [filePath];
            break;
            
        case 'python':
            compiler = 'python3';
            args = ['-c', code];
            break;

        case 'javascript':
            compiler = 'node';
            args = ['-e', code];
            break;

        default:
            return res.status(400).json({ error: 'Does not support this language. Only C, C++, Java, Python, and JavaScript.' });
    }

    if (['c', 'cpp', 'java'].includes(language)) {
        // Need to compile the code
        // Spawn a child process to compile the code:
        const compilingProcess = spawn(compiler, args);

        let compileError = '';
        compilingProcess.stderr.on('data', (data) => {
            compileError += data.toString();
        });

        // When compilation finishes:
        compilingProcess.on('exit', (code) => {
            if (code !== 0) {
                return res.status(400).json({ error: compileError || 'Compilation failed' });
            }
            
            // Run compiled program:
            let executionCommand = '';
            let executionArgs = [];

            if (language === 'c' || language === 'cpp') {
                executionCommand = '/tmp/program';
            } 
            else if (language === 'java') {
                executionCommand = 'java';
                executionArgs = ['-cp', '/tmp', 'Main'];
            }

            const runningProcess = spawn(executionCommand, executionArgs);

            if (input) {
                // Pipe all input into the stdin of the running program at once, 
                // as mentioned in a piazza post by the prof
                runningProcess.stdin.write(input);
                runningProcess.stdin.end();
            }

            let output = '';
            let runtimeError = '';  // exceptions, seg faults

            runningProcess.stdout.on('data', (data) => {
                // listens for any output produced by running program, like printf or System.out.println
                output += data.toString();
            });

            runningProcess.stderr.on('data', (data) => {
                runtimeError += data.toString();
            });

            // Capture signals like SIGFPE (Floating Point Exception)
            runningProcess.on('error', (err) => {
                runtimeError += `Signal error: ${err.message}`;
            });

            runningProcess.on('exit', (code, signal) => {
                if (signal === 'SIGFPE') {
                    return res.status(400).json({ error: 'Floating point exception' });
                } 
                else if (signal === 'SIGSEGV') {
                    return res.status(400).json({ error: 'Segmentation fault' });
                } 
                else if (code !== 0) {
                    return res.status(400).json({ error: runtimeError || 'Runtime error occurred' });
                } 
                else {
                    return res.status(200).json({ output });
                }
            });
        });

    }
    else {
        //Don't need to compile for Python and JS, can just execute
        const runningProcess = spawn(compiler, args);

        if (input) {
            runningProcess.stdin.write(input);
            runningProcess.stdin.end();
        }

        let output = '';
        let runtimeError = '';

        runningProcess.stdout.on('data', (data) => {
            // listens for any output produced by running program, like printf or System.out.println
            output += data.toString();
        });

        runningProcess.stderr.on('data', (data) => {
            runtimeError += data.toString();
        });

        runningProcess.on('exit', (code) => {
            if (code !== 0) {
                return res.status(400).json({ error: runtimeError || 'Runtime error' });
            } 
            else {
                return res.status(200).json({ output });
            }
        });
    }
}