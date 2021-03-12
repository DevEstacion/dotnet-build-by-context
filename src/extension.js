'use strict';
exports.__esModule = true;
exports.activate = void 0;
var vscode = require("vscode");
function activate(context) {
    var writeEmitter = new vscode.EventEmitter();
    context.subscriptions.push(vscode.commands.registerCommand('extensionTerminalSample.create', function () {
        var line = '';
        var pty = {
            onDidWrite: writeEmitter.event,
            open: function () { return writeEmitter.fire('Type and press enter to echo the text\r\n\r\n'); },
            close: function () { },
            handleInput: function (data) {
                if (data === '\r') { // Enter
                    writeEmitter.fire("\r\necho: \"" + colorText(line) + "\"\r\n\n");
                    line = '';
                    return;
                }
                if (data === '\x7f') { // Backspace
                    if (line.length === 0) {
                        return;
                    }
                    line = line.substr(0, line.length - 1);
                    // Move cursor backward
                    writeEmitter.fire('\x1b[D');
                    // Delete character
                    writeEmitter.fire('\x1b[P');
                    return;
                }
                line += data;
                writeEmitter.fire(data);
            }
        };
        var terminal = vscode.window.createTerminal({ name: "My Extension REPL", pty: pty });
        terminal.show();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extensionTerminalSample.clear', function () {
        writeEmitter.fire('\x1b[2J\x1b[3J\x1b[;H');
    }));
}
exports.activate = activate;
function colorText(text) {
    var output = '';
    var colorIndex = 1;
    for (var i = 0; i < text.length; i++) {
        var char = text.charAt(i);
        if (char === ' ' || char === '\r' || char === '\n') {
            output += char;
        }
        else {
            output += "\u001B[3" + colorIndex++ + "m" + text.charAt(i) + "\u001B[0m";
            if (colorIndex > 6) {
                colorIndex = 1;
            }
        }
    }
    return output;
}
