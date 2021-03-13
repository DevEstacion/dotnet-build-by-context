'use strict';

import * as vscode from 'vscode';
import { Terminal, TextDocument } from 'vscode';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('buildByContext.buildActive', () => {
	let messages = new Array<string>();
	const terminalName = `Build by Context`;
		let terminal = vscode.window.terminals.find(x => x.name == terminalName);
		if (!terminal) {
			terminal = vscode.window.createTerminal({ name: terminalName });
		}
		terminal.show();

		let activeDocument = vscode.window.activeTextEditor?.document;
		if (!activeDocument) {
			messages.push('Found no active document to build.');
			return;
		}
		runDotNetBuild(terminal, activeDocument, messages);
		vscode.window.showInformationMessage('Build by Context Finished:' + messages.join(", "));
	}));
}

function runDotNetBuild(terminal: Terminal, document: TextDocument, messages: Array<string>): void {
	let csProjects = new Array<string>();

	// handling only csharp code
	if (!document.uri.fsPath.endsWith(".cs")) {
		messages.push(`Cannot execute on file ${document.uri.fsPath}`);
		return;
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

	if (csProjects.length > 0) {
		messages.push(`Found ${csProjects.length} csproject files. Executing dotnet build.`);
		for (let index = 0; index < csProjects.length; index++) {
			const csProj = csProjects[index];
			terminal.sendText(`dotnet build \'${csProj}\'`);
		}
	}
	else {
		messages.push(`ERROR: No csproj found for the file.`);
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