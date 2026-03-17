import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

let syncPending = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;

async function git(...args: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  try {
    const proc = Bun.spawn(["git", ...args], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_ASKPASS: "",
      }
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    return { ok: exitCode === 0, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (e: any) {
    return { ok: false, stdout: "", stderr: e.message || "Git command failed" };
  }
}

function getRemoteUrl(): string {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return "";
  return `https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;
}

export async function initGitRepo(): Promise<void> {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.log("⚠ GitHub-Sync deaktiviert (kein Token/Repo konfiguriert)");
    return;
  }

  const remoteUrl = getRemoteUrl();

  const { ok: isRepo } = await git("rev-parse", "--is-inside-work-tree");

  if (!isRepo) {
    await git("init");
    console.log("✓ Git-Repository initialisiert");
  }

  const { stdout: userName } = await git("config", "user.name");
  if (!userName) {
    await git("config", "user.name", "Natis Fine Creation");
    await git("config", "user.email", "noreply@natisfinecreation.de");
  }

  const { stdout: remotes } = await git("remote");
  if (remotes.includes("origin")) {
    await git("remote", "set-url", "origin", remoteUrl);
  } else {
    await git("remote", "add", "origin", remoteUrl);
  }

  const { ok: hasBranch } = await git("rev-parse", "--verify", GITHUB_BRANCH);
  if (!hasBranch) {
    const { ok: hasCommits } = await git("rev-parse", "HEAD");
    if (!hasCommits) {
      await git("checkout", "-b", GITHUB_BRANCH);
    }
  }

  const { ok: fetchOk } = await git("fetch", "origin", GITHUB_BRANCH);
  if (fetchOk) {
    const { ok: hasLocal } = await git("rev-parse", "HEAD");
    if (hasLocal) {
      await git("merge", "origin/" + GITHUB_BRANCH, "--allow-unrelated-histories", "--no-edit", "-X", "ours");
      console.log("✓ Mit GitHub synchronisiert (Pull)");
    } else {
      await git("checkout", "-b", GITHUB_BRANCH, "origin/" + GITHUB_BRANCH);
      console.log("✓ Branch von GitHub geklont");
    }
  }

  isInitialized = true;
  console.log(`✓ GitHub-Sync aktiv → ${GITHUB_REPO} (${GITHUB_BRANCH})`);
}

export async function syncToGitHub(message?: string): Promise<void> {
  if (!isInitialized || !GITHUB_TOKEN || !GITHUB_REPO) return;

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    if (syncPending) return;
    syncPending = true;

    try {
      await git("add", "-A");

      const { stdout: status } = await git("status", "--porcelain");
      if (!status) {
        syncPending = false;
        return;
      }

      const commitMsg = message || `Auto-Sync: ${new Date().toLocaleString("de-DE")}`;
      await git("commit", "-m", commitMsg);

      const { ok, stderr } = await git("push", "origin", GITHUB_BRANCH);
      if (ok) {
        console.log(`↑ GitHub-Push: ${commitMsg}`);
      } else {
        if (stderr.includes("rejected") || stderr.includes("fetch first")) {
          await git("pull", "origin", GITHUB_BRANCH, "--rebase", "--no-edit");
          const { ok: retryOk } = await git("push", "origin", GITHUB_BRANCH);
          if (retryOk) {
            console.log(`↑ GitHub-Push (nach Pull): ${commitMsg}`);
          } else {
            console.error("✗ GitHub-Push fehlgeschlagen nach Retry");
          }
        } else {
          console.error(`✗ GitHub-Push Fehler: ${stderr}`);
        }
      }
    } catch (e: any) {
      console.error("✗ Sync-Fehler:", e.message);
    } finally {
      syncPending = false;
    }
  }, 2000);
}

export async function pullFromGitHub(): Promise<boolean> {
  if (!isInitialized || !GITHUB_TOKEN || !GITHUB_REPO) return false;

  const { ok } = await git("pull", "origin", GITHUB_BRANCH, "--no-edit");
  if (ok) console.log("↓ GitHub-Pull erfolgreich");
  return ok;
}
