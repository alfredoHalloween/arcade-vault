#!/usr/bin/env bash
# PostToolUse (Write|Edit): pasa Prettier y ESLint por el archivo tocado.
# Solo actúa dentro de Arcade Vault y sobre archivos React/TS/JS o Markdown.
# En TS/JS: quita espacios y líneas en blanco, luego Prettier y ESLint --fix.

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

file=$(node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try {
      const i = JSON.parse(s);
      process.stdout.write((i.tool_response && i.tool_response.filePath) || (i.tool_input && i.tool_input.file_path) || "");
    } catch {}
  });
')

[ -n "$file" ] && [ -f "$file" ] || exit 0

case "$file" in
  "$root"/node_modules/* | "$root"/.next/* | "$root"/references/*) exit 0 ;;
  "$root"/*) ;;
  *) exit 0 ;;
esac

cd "$root" || exit 0

case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs)
    # Código conciso: quita espacios al final de línea y todas las líneas en blanco.
    strip_blanks() { sed -i '' -e 's/[[:space:]]*$//' -e '/^$/d' "$file"; }
    strip_blanks
    npx prettier --write "$file" >/dev/null 2>&1
    out=$(npx eslint --fix "$file" 2>&1) || {
      echo "ESLint encontró errores en $file:" >&2
      echo "$out" >&2
      exit 2
    }
    # Por si Prettier o ESLint --fix reintrodujeron espacios.
    strip_blanks
    ;;
  *.md)
    npx prettier --write "$file" >/dev/null 2>&1
    ;;
esac

exit 0
