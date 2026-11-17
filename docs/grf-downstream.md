# Optional GRF acceptance gate

This optional example connects [GRF downstream](https://github.com/gillimo/grf-downstream) to this project's existing completion workflow. It leaves `agent-workflow` task state and each task's `Verify:` command in charge; GRF adds an explicit local acceptance check to the existing project-wide `project_verify` gate.

No cloud enrollment, signup, account, or new runtime dependency is needed. Use the verified GRF 0.6.1 release archive and follow its published release-verification steps. This example uses local admission only.

## Set up a local GRF project

From the root of your `agent-workflow` project, with `grf_starter.py` from the verified GRF release available:

```sh
python grf_starter.py init grf-acceptance --intent "Run the agent-workflow project checks before task completion"
```

The starter deliberately creates a failing placeholder acceptance check. Replace `grf-acceptance/project.grf` with this contract; the path and command are relative to the GRF project directory:

```grf:context id="downstream-project"
{
  "format": "grf.downstream-project/v1",
  "name": "agent-workflow-demo acceptance",
  "intent": "Run the agent-workflow project's own test suite before task completion",
  "scope": {
    "allowed": ["Run the repository's existing npm test suite"],
    "excluded": ["Publishing, spending, and credential disclosure"]
  },
  "checks": [
    {
      "id": "REG-PROJECT-ACCEPTANCE",
      "argv": ["npm", "--prefix", "..", "test"],
      "timeout_seconds": 900
    }
  ],
  "admission": {
    "mode": "local",
    "enrollment": "credentials/enrollment.json"
  }
}
```

This runs the repository's documented `npm test` from the GRF subdirectory (`--prefix ..` points to the repository root). `REG-PROJECT-ACCEPTANCE` is required by the published GRF client. The check records local evidence; GRF does not upload command output. Keep the generated `grf-acceptance/.gitignore` so `.grf/` receipts/session state and `credentials/` are not committed. The pinned `.grf-runtime/` files are part of the local runner setup; only commit them if that is intentional for your project.

Sign in to a concrete task and run GRF's check from the repository root:

```sh
python grf-acceptance/grf.py --project grf-acceptance session sign-in --task "Implement and verify the requested change"
python grf-acceptance/grf.py --project grf-acceptance check
```

The check output includes a receipt path relative to `grf-acceptance/`. Do not treat the default placeholder or a failing check as acceptance evidence.

## Gate task completion

If `agent-workflow verify-config` reports no existing project-wide check, configure GRF as that optional gate:

```sh
agent-workflow verify-config --set "python grf-acceptance/grf.py --project grf-acceptance check"
agent-workflow verify-config
```

Now `agent-workflow task complete <id>` still runs that task's own `Verify:` command and also runs the project-wide GRF acceptance check before changing the task to completed. A failing/unavailable GRF check blocks completion under the existing workflow behavior. Agents should not use `--force` or `--no-verify` to bypass either check.

If a project-wide check is already configured, do not overwrite it with the command above. Preserve it by pointing `project_verify` at a wrapper that runs **both** the previous command and GRF. This repository includes `scripts/grf-acceptance.js` as a concrete example: it runs the existing `npm test`, then the local GRF check, without shell-specific chaining. Adapt its first command to the exact existing project-wide check in your project, then configure:

```sh
agent-workflow verify-config --set "node scripts/grf-acceptance.js"
agent-workflow verify-config
```

This makes `task complete` run the existing project check first and GRF second, on Windows and POSIX without shell-specific `&&` syntax. The GRF project must already be initialized and its actual acceptance check implemented. For task-specific use without changing project configuration, run the GRF `check` explicitly before `task complete`.

After completing work, finish the GRF session with a nonempty receipt path printed by `check`, then sign out:

```sh
python grf-acceptance/grf.py --project grf-acceptance session complete --summary "Repository checks passed for this change" --evidence .grf/receipts/REPLACE_WITH_RECEIPT.json
python grf-acceptance/grf.py --project grf-acceptance session sign-out
```

Start or resume an active GRF session before the next gated task completion. When you no longer want the global gate, remove it only if this example was the project-wide check:

```sh
agent-workflow verify-config --clear
```

GRF is a cooperative local check runner, not a sandbox or independent proof that a check is adequate. Review the acceptance command and check quality for your project.
