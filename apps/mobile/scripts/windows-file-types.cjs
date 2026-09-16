const fs = require("node:fs");
const path = require("node:path");

// OneDrive reparse points can be reported as links by readdir's Dirent,
// even though lstat correctly reports a regular file. Metro otherwise tries
// readlink, drops the file and reports an unresolved import.
function normalizeDirents(directory, entries, lstat = fs.lstatSync) {
  return entries.map((entry) => {
    if (typeof entry?.isSymbolicLink !== "function" || !entry.isSymbolicLink()) return entry;
    if (typeof entry.name !== "string") return entry;
    try {
      const stat = lstat(path.join(directory, entry.name));
      if (stat.isSymbolicLink()) return entry;
      const normalized = Object.create(entry);
      normalized.isSymbolicLink = () => false;
      normalized.isFile = () => stat.isFile();
      normalized.isDirectory = () => stat.isDirectory();
      return normalized;
    } catch {
      return entry;
    }
  });
}

function installWindowsFileTypesWorkaround(workspaceRoot) {
  if (process.platform !== "win32") return;
  const marker = Symbol.for("fitfamily.windowsFileTypes");
  if (fs[marker]) return;
  const root = path.resolve(workspaceRoot).toLowerCase();
  const withinWorkspace = (directory) => {
    if (typeof directory !== "string") return false;
    const resolved = path.resolve(directory).toLowerCase();
    return resolved === root || resolved.startsWith(root + path.sep);
  };
  const originalRead = fs.readdir;
  const originalReadSync = fs.readdirSync;
  fs.readdir = function (directory, options, callback) {
    if (typeof options === "function") return originalRead.call(this, directory, options);
    if (!options?.withFileTypes || !withinWorkspace(directory))
      return originalRead.call(this, directory, options, callback);
    return originalRead.call(this, directory, options, (error, entries) => {
      callback(error, error ? entries : normalizeDirents(directory, entries));
    });
  };
  fs.readdirSync = function (directory, options) {
    const entries = originalReadSync.call(this, directory, options);
    return options?.withFileTypes && withinWorkspace(directory)
      ? normalizeDirents(directory, entries)
      : entries;
  };
  fs[marker] = true;
}

module.exports = { normalizeDirents, installWindowsFileTypesWorkaround };
