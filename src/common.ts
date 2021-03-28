export function trim(str: string, chars: string): string {
  if (!str) return str
  if (chars === "]") chars = "\\]";
  if (chars === "\\") chars = "\\\\";
  return str.replace(new RegExp(
    "^[" + chars + "]+|[" + chars + "]+$", "g",
  ), "");
}
