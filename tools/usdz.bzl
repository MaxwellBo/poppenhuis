"""GLB → USDZ conversion using host usdcat/usdzip."""

def _glb_to_usdz_impl(ctx):
    out = ctx.outputs.out
    args = ctx.actions.args()
    args.add(ctx.file.src)
    args.add(out)
    ctx.actions.run(
        executable = ctx.executable._usdconvert,
        arguments = [args],
        inputs = [ctx.file.src],
        outputs = [out],
        use_default_shell_env = True,
        execution_requirements = {
            "local": "1",
            "no-remote": "1",
        },
        mnemonic = "GlbToUsdz",
        progress_message = "USDZ %{label}",
    )
    return [DefaultInfo(files = depset([out]))]

glb_to_usdz = rule(
    implementation = _glb_to_usdz_impl,
    attrs = {
        "src": attr.label(allow_single_file = [".glb"], mandatory = True),
        "out": attr.output(mandatory = True),
        "_usdconvert": attr.label(
            default = Label("//tools:usdconvert"),
            executable = True,
            cfg = "exec",
        ),
    },
)
