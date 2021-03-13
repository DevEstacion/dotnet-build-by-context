'use strict';

import * as vscode from 'vscode';
import { Terminal } from 'vscode';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('buildByContext.build', () => {
		const terminal = vscode.window.createTerminal({ name: `Build by Context` });
		terminal.show();

		let textDocuments = vscode.workspace.textDocuments;
		if (textDocuments.length <= 0) {
			terminal.sendText('echo \'Found no documents open to build.\'', false);
			return;
		}

		runDotNetBuild(terminal, textDocuments);
	}));
}

function runDotNetBuild(terminal: Terminal, textDocuments: vscode.TextDocument[]): void {
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
		terminal.sendText(`echo \'${csProjects.length} number of csproject files. Executing dotnet build.\'`, false);
		for (let index = 0; index < csProjects.length; index++) {
			const csProj = csProjects[index];
			terminal.sendText(`dotnet build \'${csProj}\'`, true);
		}
	}
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