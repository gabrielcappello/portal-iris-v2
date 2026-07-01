// scripts/hook-lint.mjs
// Hook PostToolUse (Edit|Write): lê o JSON do hook no stdin, pega o arquivo
// editado e roda eslint SÓ nele. Non-blocking (sempre sai 0) e quieto quando
// não há problema. Chamado por .claude/settings.json.

import { spawnSync } from "node:child_process";

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (buf += d));
process.stdin.on("end", () => {
  let file;
  try {
    file = JSON.parse(buf)?.tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!file || !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) process.exit(0);

  spawnSync("npx", ["eslint", file], { stdio: "inherit", shell: true });
  process.exit(0); // nunca bloqueia a edição
});
