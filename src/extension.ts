import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
// import { isBinaryFile } from "isbinaryfile";

const outputChannel = vscode.window.createOutputChannel("EOL Converter");

async function walkAndConvert(fsPath: string, toCRLF: boolean) {
  const stats = await fs.promises.stat(fsPath);

  if (stats.isFile()) {
    await convertFile(fsPath, toCRLF);
  } else if (stats.isDirectory()) {
    const entries = await fs.promises.readdir(fsPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(fsPath, entry.name);
      if (entry.isDirectory()) {
        await walkAndConvert(fullPath, toCRLF);
      } else {
        await convertFile(fullPath, toCRLF);
      }
    }
  }
}

// Add a set of image file extensions to skip
const imageExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tiff", ".tif"
]);

async function convertFile(filePath: string, toCRLF: boolean) {
  try {
    // Skip image files by extension
    const ext = path.extname(filePath).toLowerCase();
    if (imageExtensions.has(ext)) {
      // outputChannel.appendLine(`Skipped (image): ${filePath}`);
      return;
    }
    // Skip binary files
    // if (await isBinaryFile(filePath)) {
    //   outputChannel.appendLine(`Skipped (binary): ${filePath}`);
    //   return;
    // }
    const content = await fs.promises.readFile(filePath, "utf8");
    const converted = toCRLF
      ? content.replace(/\r?\n/g, "\r\n")
      : content.replace(/\r\n/g, "\n");
    await fs.promises.writeFile(filePath, converted, "utf8");
    outputChannel.appendLine(`Converted: ${filePath}`);
  } catch (error) {
    outputChannel.appendLine(`Skipped: ${filePath} - ${error}`);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "eol-converter.convertToLF",
      async (uri: vscode.Uri) => {
        outputChannel.clear();
        outputChannel.show(true);
        // If no URI is provided (e.g., command invoked from editor context menu)
        if (!uri && vscode.window.activeTextEditor) {
          const document = vscode.window.activeTextEditor.document;
          if (document.isDirty) {
            await document.save();
          }
          uri = document.uri;
        }

        if (!uri) {
          vscode.window.showErrorMessage("No folder or file selected.");
          return;
        }

        try {
          outputChannel.appendLine("Converting to LF...");
          await walkAndConvert(uri.fsPath, false);
          outputChannel.appendLine("Done.");
          vscode.window.showInformationMessage("Converted to LF");
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to convert: ${error}`);
        }
      }
    ),
    vscode.commands.registerCommand(
      "eol-converter.convertToCRLF",
      async (uri: vscode.Uri) => {
        outputChannel.clear();
        outputChannel.show(true);
        // If no URI is provided (e.g., command invoked from editor context menu)
        if (!uri && vscode.window.activeTextEditor) {
          const document = vscode.window.activeTextEditor.document;
          if (document.isDirty) {
            await document.save();
          }
          uri = document.uri;
        }

        if (!uri) {
          vscode.window.showErrorMessage("No folder or file selected.");
          return;
        }

        try {
          outputChannel.appendLine("Converting to CRLF...");
          await walkAndConvert(uri.fsPath, true);
          outputChannel.appendLine("Done.");
          vscode.window.showInformationMessage("Converted to CRLF");
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to convert: ${error}`);
        }
      }
    )
  );
}

export function deactivate() {}
