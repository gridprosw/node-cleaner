import arg from 'arg';
import inquirer from 'inquirer';
import { analyzePath } from "./main";

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--path': String,
            '-p': '--path',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        path: args['--path'] || null,
    };
}

async function promptForMissingOptions(options) {
    if (!options.path) {
        const questions = [
            {
                type: 'input',
                name: 'path',
                message: 'Please choose a path containing all code projects to analyze',
                default: "",
            }
        ];

        const answers = await inquirer.prompt(questions);
        return {
            ...options,
            path: options.path || answers.path
        }
    } else {
        return options;
    }   
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    await analyzePath(options.path);
}