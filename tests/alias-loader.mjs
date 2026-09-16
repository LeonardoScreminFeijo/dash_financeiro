import path from "node:path";
import { pathToFileURL } from "node:url";

const projectRoot = pathToFileURL(`${process.cwd()}${path.sep}`);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server") return nextResolve("next/server.js", context);
  if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

  const sourcePath = specifier.slice(2);
  const target = sourcePath.endsWith(".ts") || sourcePath.endsWith(".tsx")
    ? sourcePath
    : `${sourcePath}.ts`;

  return nextResolve(new URL(target, projectRoot).href, context);
}
