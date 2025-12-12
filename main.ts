import { MarkdownPostProcessorContext, Plugin, Notice, FileSystemAdapter } from "obsidian";
import { spawn } from "child_process";

export default class Runsh extends Plugin {
	vaultPath: string;

	async onload() {
		this.registerMarkdownCodeBlockProcessor("runsh", this.processRunshBlock.bind(this));
		const adapter = this.app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			this.vaultPath = adapter.getBasePath();
		}
	}

	async processRunshBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Split to code and fluff by "%%%"
		const [cmd, ...fluff] = source.split("%%%");

		// Use fluff as button text if present, otherwise use the "Run command" as default
		const button = el.createEl("button", {
			text: fluff.length > 0 ? fluff.join(" ") : "Run command",
		});
		// Add tooltip with command
		button.setAttribute("title", cmd);

		button.on("click", "button", () => clickHandler(cmd, this.vaultPath));
	}
}

const clickHandler = async (cmd: string, vaultPath: string) => {
	new Notice("Running: " + cmd);

	const res = spawn(cmd, { shell: true, cwd: vaultPath, stdio: "pipe" });

	let output = "";
	res.stdout.on("data", (data) => (output += data.toString()));
	res.stderr.on("data", (data) => (output += data.toString()));

	res.on("close", () => new Notice(output ? output : "Command completed"));
	res.on("error", (error) => new Notice("Error: " + error.message));
};
