'use strict';

import * as vscode from 'vscode';
import { Terminal } from 'vscode';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
	const writeEmitter = new vscode.EventEmitter<string>();
	context.subscriptions.push(vscode.commands.registerCommand('buildByContext.build', () => {
		const pty = {
			onDidWrite: writeEmitter.event,
			open: () => {
				writeEmitter.fire('Finding the closest csproj by hierarchy\r\n\r\n');
				let textDocuments = vscode.workspace.textDocuments;
				if (textDocuments.length <= 0) {
					writeEmitter.fire('Found no documents open to build.\r\n');
					return;
				}

				let csProjects = new Array<string>();

				for (let i = 0; i < textDocuments.length; i++) {
					let document = textDocuments[i];
					// handling only csharp code
					if (!document.uri.fsPath.endsWith(".cs")) {
						continue;
					}

					let foundCsproj = "";
					let currentDirPath: string | null = document.uri.fsPath;
					while (foundCsproj == "") {
						currentDirPath = getNextDirectory(currentDirPath);
						if (currentDirPath == null) {
							break;
						}

						let files = fs.readdirSync(currentDirPath);
						for (let j = 0; j < files.length; j++) {
							let fileName = files[j];
							if (fileName.endsWith(".csproj")) {
								foundCsproj = `${currentDirPath}\\${fileName}`;
								break;
							}
						}
					}

					if (foundCsproj !== "") {
						csProjects.push(foundCsproj);
					}
				}

				if (csProjects.length > 0) {
					writeEmitter.fire(`Found ${csProjects.length} number of csproject files. Executing dotnet build.\r\n\r\n`);
					for (let index = 0; index < csProjects.length; index++) {
						const csProj = csProjects[index];
						terminal.sendText(`dotnet build ${csProj}\r\n`)
					}
				}
			},
			close: () => { /* noop*/ },
			handleInput: () => { /* noop*/ }
		};
		const terminal = (<any>vscode.window).createTerminal({ name: `Build by Context`, pty }) as Terminal;
		terminal.show();
	}));
}

function getNextDirectory(dirPath: string): string | null {
	var newUri: string | null = null;
	if (vscode.workspace.workspaceFolders?.find(x => x.uri.fsPath == dirPath)) {
		return null;
	}

	for (let index = dirPath.length - 1; index >= 0; index--) {
		const element = dirPath[index];
		if (element === "\\") {
			newUri = dirPath.substr(0, index);
			break;
		}
	}

	return newUri;
}