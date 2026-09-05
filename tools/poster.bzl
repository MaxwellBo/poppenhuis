"""GLB → PNG posters using host Blender + render_blender.py."""

def _render_poster_impl(ctx):
    if ctx.attr.mode == "single" and len(ctx.files.srcs) != 1:
        fail("render_poster single mode requires exactly one src, got %s" % ctx.files.srcs)
    if not ctx.files.srcs:
        fail("render_poster requires at least one src")

    out = ctx.outputs.out
    args = ctx.actions.args()
    args.add(ctx.file._script)
    args.add(ctx.attr.mode)
    args.add(out)
    args.add(str(ctx.attr.width))
    args.add(str(ctx.attr.height))
    args.add_all(ctx.files.srcs)
    ctx.actions.run(
        executable = ctx.executable._blender,
        arguments = [args],
        inputs = ctx.files.srcs + [ctx.file._script],
        outputs = [out],
        use_default_shell_env = True,
        execution_requirements = {
            "local": "1",
            "no-remote": "1",
            "no-sandbox": "1",
        },
        mnemonic = "BlenderPoster",
        progress_message = "Poster %{label}",
    )
    return [DefaultInfo(files = depset([out]))]

render_poster = rule(
    implementation = _render_poster_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = [".glb"], mandatory = True, allow_empty = False),
        "out": attr.output(mandatory = True),
        "mode": attr.string(values = ["single", "multi"], mandatory = True),
        "width": attr.int(default = 1200),
        "height": attr.int(default = 630),
        "_script": attr.label(
            default = Label("//:render_blender.py"),
            allow_single_file = True,
        ),
        "_blender": attr.label(
            default = Label("//tools:blender_render"),
            executable = True,
            cfg = "exec",
        ),
    },
)
