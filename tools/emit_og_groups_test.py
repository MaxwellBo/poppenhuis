"""Tests for tools/emit_og_groups.py."""

import unittest

from emit_og_groups import _repo_root, format_bzl, load_groups, parse_manifest, parse_ps2_archive


class EmitOgGroupsTest(unittest.TestCase):
    def setUp(self):
        self.root = _repo_root()

    def test_ps2_archive_has_models_and_ids(self):
        text = (self.root / "src" / "ps2-archive.ts").read_text()
        collection_id, og, models = parse_ps2_archive(text)
        self.assertEqual(collection_id, "ps2-save-icons")
        self.assertEqual(og, "mbo_ps2-save-icons_og.png")
        self.assertGreater(len(models), 100)
        self.assertIn("ps2_save-icons_jak-and-daxter.glb", models)

    def test_commented_joey_user_is_ignored(self):
        users = load_groups(self.root)
        self.assertNotIn("joey", users)
        all_models = [
            m
            for user in users.values()
            for coll in user["collections"].values()
            for m in coll["models"]
        ]
        self.assertNotIn("joey_stolen_film-camera.glb", all_models)

    def test_filename_prefix_is_not_the_user(self):
        users = load_groups(self.root)
        mbo = users["mbo"]
        friends = mbo["collections"]["friends"]
        self.assertIn("max2_friends_zoe.glb", friends["models"])
        self.assertIn("ps2-save-icons", mbo["collections"])
        self.assertTrue(
            all(m.startswith("ps2_save-icons_") for m in mbo["collections"]["ps2-save-icons"]["models"])
        )

    def test_expected_users_and_counts(self):
        users = load_groups(self.root)
        self.assertEqual(set(users), {"jackie", "mbo", "leaonie", "SugarPlumBoss"})
        self.assertEqual(len(users["jackie"]["collections"]["cakes"]["models"]), 4)
        self.assertEqual(len(users["leaonie"]["collections"]["pottery"]["models"]), 3)
        self.assertEqual(len(users["SugarPlumBoss"]["collections"]["baked-goods"]["models"]), 1)
        self.assertEqual(users["jackie"]["og"], "jackie_og.png")
        self.assertEqual(users["mbo"]["og"], "mbo_og.png")

    def test_checked_in_bzl_is_current(self):
        generated = format_bzl(load_groups(self.root))
        checked_in = (self.root / "tools" / "og_groups.bzl").read_text()
        self.assertEqual(
            generated,
            checked_in,
            "tools/og_groups.bzl is stale; run: bazel run //tools:emit_og_groups",
        )

    def test_parse_rejects_model_outside_collection(self):
        with self.assertRaises(ValueError):
            parse_manifest(
                'export const FIRST_PARTY_MANIFEST = [\n    model: "/assets/goldens/x.glb"\n];\n',
                'id: "ps2-save-icons"\nog: "/assets/derived/x.png"\n',
            )


if __name__ == "__main__":
    unittest.main()
