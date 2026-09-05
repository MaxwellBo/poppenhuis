"""Copy Bazel outputs back into the source tree (`bazel run` only)."""

def _sync_to_source_impl(ctx):
    script = ctx.actions.declare_file(ctx.label.name + ".sh")
    ws = ctx.workspace_name
    dest_rel = ctx.attr.dest
    filename = ctx.attr.filename

    lines = [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        'if [[ -z "${BUILD_WORKSPACE_DIRECTORY:-}" ]]; then',
        '  echo "Run this target with: bazel run %s" >&2' % ctx.label,
        "  exit 1",
        "fi",
        'DEST="${BUILD_WORKSPACE_DIRECTORY}/%s"' % dest_rel,
        'mkdir -p "$DEST"',
        "ROOT=\"\"",
        'if [[ -n "${RUNFILES_DIR:-}" && -d "${RUNFILES_DIR}/%s" ]]; then' % ws,
        '  ROOT="${RUNFILES_DIR}/%s"' % ws,
        'elif [[ -d "$0.runfiles/%s" ]]; then' % ws,
        '  ROOT="$0.runfiles/%s"' % ws,
        "else",
        '  echo "Could not locate runfiles directory" >&2',
        "  exit 1",
        "fi",
    ]
    if filename:
        if len(ctx.files.srcs) != 1:
            fail("sync_to_source filename= requires exactly one src")
        src = ctx.files.srcs[0]
        lines.append('cp -f "$ROOT/%s" "$DEST/%s"' % (src.short_path, filename))
        lines.append('echo "Installed $DEST/%s"' % filename)
    else:
        for f in ctx.files.srcs:
            lines.append('cp -f "$ROOT/%s" "$DEST/%s"' % (f.short_path, f.basename))
        lines.append('echo "Installed %d file(s) to $DEST"' % len(ctx.files.srcs))

    ctx.actions.write(output = script, content = "\n".join(lines) + "\n", is_executable = True)
    return [
        DefaultInfo(
            executable = script,
            runfiles = ctx.runfiles(files = ctx.files.srcs + [script]),
        ),
    ]

sync_to_source = rule(
    implementation = _sync_to_source_impl,
    executable = True,
    attrs = {
        "srcs": attr.label_list(allow_files = True, mandatory = True, allow_empty = False),
        "dest": attr.string(mandatory = True, doc = "Workspace-relative destination directory"),
        "filename": attr.string(doc = "If set, copy the single src to dest/filename"),
    },
)
