import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

type Entry = {
  name: string;
  isSymbolicLink: () => boolean;
  isFile: () => boolean;
  isDirectory: () => boolean;
};
type Stat = Omit<Entry, "name">;
const { normalizeDirents } = createRequire(import.meta.url)("./windows-file-types.cjs") as {
  normalizeDirents: (directory: string, entries: Entry[], stat: (path: string) => Stat) => Entry[];
};
const linkEntry = (): Entry => ({
  name: "types.js",
  isSymbolicLink: () => true,
  isFile: () => false,
  isDirectory: () => false,
});

describe("Windows cloud file metadata used by Metro", () => {
  it("makes a normal OneDrive file visible without changing its name", () => {
    const [entry] = normalizeDirents("workspace", [linkEntry()], () => ({
      isSymbolicLink: () => false,
      isFile: () => true,
      isDirectory: () => false,
    }));
    expect(entry?.name).toBe("types.js");
    expect(entry?.isSymbolicLink()).toBe(false);
    expect(entry?.isFile()).toBe(true);
  });
  it("preserves genuine symbolic links", () => {
    const link = linkEntry();
    const [entry] = normalizeDirents("workspace", [link], () => ({
      isSymbolicLink: () => true,
      isFile: () => false,
      isDirectory: () => false,
    }));
    expect(entry).toBe(link);
  });
  it("keeps an unreadable entry unchanged rather than inventing its type", () => {
    const link = linkEntry();
    const [entry] = normalizeDirents("workspace", [link], () => {
      throw new Error("EACCES");
    });
    expect(entry).toBe(link);
  });
  it("does not add filesystem reads for ordinary directory entries", () => {
    const entry = { ...linkEntry(), isSymbolicLink: () => false, isFile: () => true };
    const stat = vi.fn();
    expect(normalizeDirents("workspace", [entry], stat)[0]).toBe(entry);
    expect(stat).not.toHaveBeenCalled();
  });
});
