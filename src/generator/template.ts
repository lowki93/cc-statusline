export function generateHeader() {
  return [
    "#!/usr/bin/env bash",
    "# cc-statusline generated -- do not edit manually",
    "# Regenerate with: cc-statusline generate",
    "",
    "set -euo pipefail",
    "LC_ALL=C",
    "",
  ].join("\n");
}

export function generateJsonParsing() {
  return [
    "# Read all stdin",
    "DATA=$(cat)",
    "",
    "# Validate we got JSON",
    'if ! echo "$DATA" | jq empty 2>/dev/null; then',
    '  echo "cc-statusline: invalid JSON input" >&2',
    '  echo ""',
    '  echo ""',
    "  exit 0",
    "fi",
    "",
  ].join("\n");
}

export function generateTermWidth() {
  return [
    "# Terminal width for right-alignment",
    "COLS=$(tput cols 2>/dev/null || echo 80)",
    "",
  ].join("\n");
}

export function generateSeparator(fg: string) {
  return `SEP="\\033[38;5;${fg}m | \\033[0m"`;
}

function generateLineAssembly(
  lineNum: number,
  leftVars: readonly string[],
  rightVars: readonly string[],
) {
  const lines: string[] = [];
  const prefix = `LINE${lineNum}`;

  lines.push(`# Assemble line ${lineNum}`);
  lines.push(`${prefix}_LEFT=""`);

  for (let index = 0; index < leftVars.length; index++) {
    const v = leftVars[index];
    lines.push(`if [ -n "$${v}" ]; then`);
    if (index === 0) {
      lines.push(`  ${prefix}_LEFT="$${v}"`);
    } else {
      lines.push(`  [ -n "$${prefix}_LEFT" ] && ${prefix}_LEFT="$${prefix}_LEFT$SEP"`);
      lines.push(`  ${prefix}_LEFT="$${prefix}_LEFT$${v}"`);
    }
    lines.push("fi");
  }

  lines.push("");
  lines.push(`${prefix}_RIGHT=""`);

  for (let index = 0; index < rightVars.length; index++) {
    const v = rightVars[index];
    lines.push(`if [ -n "$${v}" ]; then`);
    if (index === 0) {
      lines.push(`  ${prefix}_RIGHT="$${v}"`);
    } else {
      lines.push(`  [ -n "$${prefix}_RIGHT" ] && ${prefix}_RIGHT="$${prefix}_RIGHT$SEP"`);
      lines.push(`  ${prefix}_RIGHT="$${prefix}_RIGHT$${v}"`);
    }
    lines.push("fi");
  }

  lines.push("");
  // Add separator between left and right groups
  lines.push(`if [ -n "$${prefix}_LEFT" ] && [ -n "$${prefix}_RIGHT" ]; then`);
  lines.push(`  ${prefix}_LEFT="$${prefix}_LEFT$SEP"`);
  lines.push("fi");
  lines.push("");
  // Strip ANSI for length calculation, then pad
  lines.push(`${prefix}_LEFT_PLAIN=$(echo -e "$${prefix}_LEFT" | sed 's/\\x1b\\[[0-9;]*m//g')`);
  lines.push(`${prefix}_RIGHT_PLAIN=$(echo -e "$${prefix}_RIGHT" | sed 's/\\x1b\\[[0-9;]*m//g')`);
  lines.push(`${prefix}_LEFT_LEN=\${#${prefix}_LEFT_PLAIN}`);
  lines.push(`${prefix}_RIGHT_LEN=\${#${prefix}_RIGHT_PLAIN}`);
  lines.push(`${prefix}_PAD=$(( COLS - ${prefix}_LEFT_LEN - ${prefix}_RIGHT_LEN ))`);
  lines.push(`if [ "$${prefix}_PAD" -lt 1 ]; then ${prefix}_PAD=1; fi`);
  lines.push(`${prefix}_SPACES=$(printf "%\${${prefix}_PAD}s" "")`);
  lines.push(`echo -e "$${prefix}_LEFT$${prefix}_SPACES$${prefix}_RIGHT"`);
  lines.push("");

  return lines.join("\n");
}

export { generateLineAssembly };
