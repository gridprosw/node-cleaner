import chalk from 'chalk';
import Listr from 'listr';
const path = require('path');
const { readdirSync } = require('fs');
const du = require('du');

function bytesToReadableFormat(bytes, decimals) {
    const byteUnits = ["B", "kB", "MB", "GB", "TB", "PB"];
    if (bytes === 0) return '0 kB';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + byteUnits[i];
  }

async function analyzeFolder(folderPath) {
    const allSubFolders = await listFoldersInPath(folderPath);
    const nodeModuleFolder = allSubFolders.find(folder => folder === "node_modules");
    const otherFolders = allSubFolders.filter(folder => folder !== "node_modules");
    

    let sizeOfNodeModule = nodeModuleFolder ? (await du(path.join(folderPath, nodeModuleFolder))) : 0;
    let sizeOfOtherFolders = 0;

    for (let i = 0; i < otherFolders.length; i++) {
        const folder = otherFolders[i];
        const fullPath = path.join(folderPath, folder);
        sizeOfOtherFolders += await analyzeFolder(fullPath);
    }

    return sizeOfNodeModule + sizeOfOtherFolders;
}


async function listFoldersInPath(path) {
    return readdirSync(path, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

export async function analyzePath(folderPath) {
    const folders = await listFoldersInPath(folderPath);

    const tasks = [];
    for (let i = 0; i < folders.length; i++) {
        tasks.push({
            title: folders[i],
            task: (ctx, task) => analyzeFolder(path.join(folderPath, folders[i])).then((size) => {
                task.title = `${task.title}: ${bytesToReadableFormat(size, 2)}`;
            })
        });
    }
    const listrTasks = new Listr(tasks);
    await listrTasks.run();

    console.log("%s Analyzing path" + folderPath, chalk.green.bold('DONE'));
}

