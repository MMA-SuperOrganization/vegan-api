import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir } from "node:fs/promises";
const execute = promisify(execFile);
const decode = (value) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&apos;", "'");

export class AndroidUi {
  constructor(serial, output) {
    this.serial = serial;
    this.output = output;
    this.nodes = [];
  }
  async adb(...args) {
    try {
      return (
        await execute("adb", ["-s", this.serial, ...args], {
          timeout: 45000,
          maxBuffer: 4 * 1024 * 1024,
          windowsHide: true,
        })
      ).stdout;
    } catch {
      throw new Error("ADB operation failed: " + args.slice(0, 2).join(" "));
    }
  }
  async snapshot() {
    await this.adb("shell", "uiautomator", "dump", "/sdcard/vegeta-requirements.xml");
    const xml = await this.adb("exec-out", "cat", "/sdcard/vegeta-requirements.xml");
    this.nodes = [...xml.matchAll(/<node\s+([^>]+)>/g)].map((match) =>
      Object.fromEntries(
        [...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((entry) => [entry[1], decode(entry[2])]),
      ),
    );
    return this.nodes;
  }
  find(label, { input = false, index = 0, enabled = false } = {}) {
    const matches = this.nodes.filter((node) => {
      const values = [node.text, node["content-desc"]].filter(Boolean);
      const matches = values.some((value) =>
        label instanceof RegExp ? label.test(value) : value === label,
      );
      const bounds = [...(node.bounds || "").matchAll(/-?\d+/g)].map((match) => Number(match[0]));
      return (
        matches &&
        (!enabled || node.enabled !== "false") &&
        (!input || node.class?.includes("EditText")) &&
        bounds[2] > bounds[0] &&
        bounds[3] > bounds[1] &&
        bounds[1] >= 0 &&
        bounds[3] <= 1920
      );
    });
    matches.sort((a, b) => Number(b.clickable === "true") - Number(a.clickable === "true"));
    return matches[index];
  }
  async waitFor(label, options = {}) {
    const until = Date.now() + (options.timeout || 45000);
    do {
      await this.snapshot();
      const node = this.find(label, options);
      if (node) return node;
    } while (Date.now() < until);
    throw new Error(
      "Android UI did not show: " +
        String(label) +
        "\nVisible: " +
        this.nodes
          .map((node) => node.text)
          .filter(Boolean)
          .join(" | "),
    );
  }
  async tapNode(node) {
    const bounds = [...node.bounds.matchAll(/-?\d+/g)].map((match) => Number(match[0]));
    await this.adb(
      "shell",
      "input",
      "tap",
      String(Math.round((bounds[0] + bounds[2]) / 2)),
      String(Math.round((bounds[1] + bounds[3]) / 2)),
    );
  }
  async tap(label, options = {}) {
    await this.tapNode(await this.waitFor(label, { enabled: true, ...options }));
  }
  async fill(label, value) {
    await this.tap(label, { input: true });
    await this.adb("shell", "input", "keycombination", "113", "29");
    await this.adb("shell", "input", "text", value.replaceAll(" ", "%s"));
    await this.adb("shell", "input", "keyevent", "4");
  }
  async scrollTo(label) {
    await this.snapshot();
    if (this.find(label)) return this.find(label);
    for (const [from, to] of [
      ["1510", "620"],
      ["620", "1510"],
    ]) {
      for (let attempt = 0; attempt < 7; attempt++) {
        await this.adb("shell", "input", "swipe", "540", from, "540", to, "350");
        await this.snapshot();
        const node = this.find(label);
        if (node) return node;
      }
    }
    throw new Error("Android item not found after scrolling: " + label);
  }
  async scrollTap(label) {
    await this.scrollTo(label);
    await this.tap(label);
  }
  async back() {
    await this.tap("Quay lại");
  }
  async capture(name) {
    await mkdir(this.output, { recursive: true });
    const { stdout } = await execute("adb", ["-s", this.serial, "exec-out", "screencap", "-p"], {
      encoding: "buffer",
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    await writeFile(new URL(name + ".png", this.output), stdout);
  }
}
