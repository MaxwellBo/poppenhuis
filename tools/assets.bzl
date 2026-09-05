"""Macros that expand one Bazel target per golden GLB / OG group."""

load("//tools:og_groups.bzl", "COLLECTION_OGS", "USER_OGS")
load("//tools:poster.bzl", "render_poster")
load("//tools:usdz.bzl", "glb_to_usdz")

_HOST_TAGS = ["manual", "local", "no-remote"]

def _stem(glb):
    # goldens/foo.glb -> foo
    name = glb.split("/")[-1]
    if not name.endswith(".glb"):
        fail("expected .glb, got %s" % glb)
    return name[:-4]

def derive_assets():
    """Declare 1:1 USDZ+poster targets plus manifest-driven OG grids.

    Must be called from //public/assets so globs resolve against goldens/.
    """
    glbs = native.glob(["goldens/*.glb"])
    if not glbs:
        fail("no golden GLBs found")

    usdz_targets = []
    poster_targets = []

    for glb in glbs:
        stem = _stem(glb)
        usdz_name = stem + "_usdz"
        glb_to_usdz(
            name = usdz_name,
            src = glb,
            out = "derived/" + stem + ".usdz",
            tags = _HOST_TAGS,
        )
        usdz_targets.append(":" + usdz_name)

        png_name = stem + "_png"
        render_poster(
            name = png_name,
            srcs = [glb],
            out = "derived/" + stem + ".png",
            mode = "single",
            tags = _HOST_TAGS,
        )
        poster_targets.append(":" + png_name)

    native.filegroup(
        name = "usdz",
        srcs = usdz_targets,
        tags = _HOST_TAGS,
        visibility = ["//visibility:public"],
    )
    native.filegroup(
        name = "posters",
        srcs = poster_targets,
        tags = _HOST_TAGS,
        visibility = ["//visibility:public"],
    )

    user_targets = []
    for out_name, models in USER_OGS:
        target = out_name.replace(".png", "")
        render_poster(
            name = target,
            srcs = ["goldens/" + m for m in models],
            out = "derived/" + out_name,
            mode = "multi",
            tags = _HOST_TAGS,
        )
        user_targets.append(":" + target)

    native.filegroup(
        name = "user_ogs",
        srcs = user_targets,
        tags = _HOST_TAGS,
        visibility = ["//visibility:public"],
    )

    collection_targets = []
    for out_name, models in COLLECTION_OGS:
        target = out_name.replace(".png", "")
        render_poster(
            name = target,
            srcs = ["goldens/" + m for m in models],
            out = "derived/" + out_name,
            mode = "multi",
            tags = _HOST_TAGS,
        )
        collection_targets.append(":" + target)

    native.filegroup(
        name = "collection_ogs",
        srcs = collection_targets,
        tags = _HOST_TAGS,
        visibility = ["//visibility:public"],
    )

    native.filegroup(
        name = "derived",
        srcs = [
            ":usdz",
            ":posters",
            ":user_ogs",
            ":collection_ogs",
        ],
        tags = _HOST_TAGS,
        visibility = ["//visibility:public"],
    )
