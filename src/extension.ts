'use strict';

import * as vscode from 'vscode';
import { Terminal, TextDocument } from 'vscode';
import * as fs from 'fs';

export declare let csproj_map: { key: string, value: string }[];

export function activate(context: vscode.ExtensionContext) {
	csproj_map = new Array<{ key: string, value: string }>();
	context.subscriptions.push(vscode.commands.registerCommand('buildByContext.buildActive', () => {
		let messages = new Array<string>();
		const terminalName = `Build by Context`;
		let terminal = vscode.window.terminals.find(x => x.name == terminalName);
		if (!terminal) {
			terminal = vscode.window.createTerminal({ name: terminalName });
		}

		let activeDocument = vscode.window.activeTextEditor?.document;
		if (!activeDocument) {
			messages.push('Found no active document to build.');
			return;
		}
		runDotNetBuild(terminal, activeDocument, messages);
		vscode.window.showInformationMessage('Build by Context Finished: ' + messages.join(", "));
	}));
}

function runDotNetBuild(terminal: Terminal, document: TextDocument, messages: Array<string>): void {
	let buildableFile = csproj_map.find(x => x.key == document.uri.fsPath)?.value ?? "";
	if (document.uri.fsPath.endsWith(".csproj") || document.uri.fsPath.endsWith(".sln")) {
		buildableFile = document.uri.fsPath;
	}

	let currentDirPath: string | null = document.uri.fsPath;
	while (buildableFile == "") {
		currentDirPath = getNextDirectory(currentDirPath);
		if (currentDirPath == null) {
			break;
		}

		let files = fs.readdirSync(currentDirPath);
		for (let j = 0; j < files.length; j++) {
			let fileName = files[j];
			if (fileName.endsWith(".csproj") || fileName.endsWith(".sln")) {
				buildableFile = `${currentDirPath}\\${fileName}`;
				break;
			}
		}
	}

	if (buildableFile !== "") {
		if (!csproj_map.find(x => x.key == document.uri.fsPath)) {
			csproj_map.push({ key: document.uri.fsPath, value: buildableFile });
		}
		messages.push(`Building using detected buildable file \'${buildableFile}\'`);
		terminal.sendText(`dotnet build \'${buildableFile}\'`);
	}
	else {
		messages.push(`ERROR: No buildable file found for the file.`);
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