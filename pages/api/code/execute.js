import { exec } from 'child_process';
// ChatGPT suggested the use of this library ^
// How it works: Node.js passes command to the OS, then OS runs it
// This ^^ happens as a child process, so that main Node.js server isnt blocked
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Use this package^^ to generate unique file names (from ChatGPT)

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST method is allowed' });
    }

    const {code, language } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Missing code and/or language.' });
    }

    let command = '';
    switch (language) {
        case 'c':
            const cFileName = `program_${uuidv4()}.c`;
            const cFilePath = path.join('/tmp', cFileName);
            
            fs.writeFileSync(cFilePath, code);

            command = `gcc ${cFilePath} -o /tmp/program && /tmp/program`;
            break;
        case 'cpp':
            const cppFileName = `program_${uuidv4()}.cpp`;
            const cppFilePath = path.join('/tmp', cppFileName);
            
            fs.writeFileSync(cppFilePath, code);

            command = `g++ ${cppFilePath} -o /tmp/program && /tmp/program`;
            break;
        case 'java':
            // From ChatGPT, how to compile then execute
            const javaFileName = 'Main.java';
            const javaFilePath = path.join('/tmp', javaFileName);
            
            fs.writeFileSync(javaFilePath, code);   //write user's code to a file

            command = `javac ${javaFilePath} && java -cp /tmp Main`; // Compile and run
            break;
        case 'python':
            command = `python3 -c "${code.replace(/"/g, '\\"')}"`;  // Escape quotes
            break;
        case 'javascript':
            command = `node -e "${code.replace(/"/g, '\\"')}"`;     // Escape quotes
            break;
        default:
            return res.status(400).json({ error: 'Does not support this language. Only C, C++, Java, Python, and JavaScript.' });
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(400).json({ error: error.message || stderr });
        }
        res.status(200).json({ output: stdout });
    });
}