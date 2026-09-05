"""Tests for host-tool wrapper scripts with fake binaries."""

from __future__ import annotations

import os
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path


def _find_script(name: str) -> Path:
    here = Path(__file__).resolve().parent
    testdir = Path(os.environ.get("TEST_SRCDIR", ".")) / os.environ.get("TEST_WORKSPACE", "_main")
    for candidate in (
        Path("tools") / name,
        here / name,
        testdir / "tools" / name,
    ):
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"{name} not found in runfiles")


class HostScriptsTest(unittest.TestCase):
    def setUp(self):
        self.usdconvert = _find_script("usdconvert.sh")
        self.blender = _find_script("blender_render.sh")
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)
        self.bindir = self.root / "bin"
        self.bindir.mkdir()

    def tearDown(self):
        self.tmpdir.cleanup()

    def _write_tool(self, name: str, body: str) -> None:
        path = self.bindir / name
        path.write_text("#!/bin/sh\n" + body + "\n")
        path.chmod(path.stat().st_mode | stat.S_IEXEC)

    def _env(self, path: str | None = None) -> dict[str, str]:
        env = os.environ.copy()
        env["PATH"] = (path if path is not None else str(self.bindir)) + os.pathsep + "/usr/bin:/bin"
        return env

    def test_usdconvert_usage(self):
        proc = subprocess.run(["/bin/bash", str(self.usdconvert)], capture_output=True, text=True)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("Usage", proc.stderr)

    def test_usdconvert_missing_tools_fails(self):
        src = self.root / "in.glb"
        src.write_bytes(b"glb")
        empty = self.root / "empty"
        empty.mkdir()
        proc = subprocess.run(
            ["/bin/bash", str(self.usdconvert), str(src), str(self.root / "out.usdz")],
            env=self._env(str(empty)),
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("usdcat", proc.stderr)

    def test_usdconvert_with_fake_tools(self):
        src = self.root / "model.glb"
        src.write_bytes(b"glb-bytes")
        out = self.root / "derived" / "model.usdz"
        log = self.root / "log.txt"

        self._write_tool("usdcat", f'echo usdcat "$@" >> "{log}"\ncp "$1" "$3"')
        self._write_tool("usdzip", f'echo usdzip "$@" >> "{log}"\ncp "$2" "$1"')

        proc = subprocess.run(
            ["/bin/bash", str(self.usdconvert), str(src), str(out)],
            env=self._env(),
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertTrue(out.is_file())
        self.assertEqual(out.read_bytes(), b"glb-bytes")
        logged = log.read_text()
        self.assertIn("usdcat", logged)
        self.assertIn("usdzip", logged)

    def test_blender_render_usage(self):
        proc = subprocess.run(["/bin/bash", str(self.blender)], capture_output=True, text=True)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("Usage", proc.stderr)

    def test_blender_render_missing_blender(self):
        script = self.root / "render_blender.py"
        script.write_text("# fake\n")
        src = self.root / "model.glb"
        src.write_bytes(b"glb")
        empty = self.root / "empty2"
        empty.mkdir()
        proc = subprocess.run(
            [
                "/bin/bash",
                str(self.blender),
                str(script),
                "single",
                str(self.root / "out.png"),
                "1200",
                "630",
                str(src),
            ],
            env=self._env(str(empty)),
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("Blender not found", proc.stderr)

    def test_blender_render_invokes_fake_blender(self):
        script = self.root / "render_blender.py"
        script.write_text("# fake bpy script\n")
        src = self.root / "model.glb"
        src.write_bytes(b"glb")
        out = self.root / "out.png"
        log = self.root / "blender.log"
        self._write_tool(
            "blender",
            f'echo "$@" >> "{log}"\n',
        )
        proc = subprocess.run(
            [
                "/bin/bash",
                str(self.blender),
                str(script),
                "multi",
                str(out),
                "1200",
                "630",
                str(src),
                str(src),
            ],
            env=self._env(),
            capture_output=True,
            text=True,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        logged = log.read_text()
        self.assertIn("--background", logged)
        self.assertIn("--python", logged)
        self.assertIn("--mode", logged)
        self.assertIn("multi", logged)


if __name__ == "__main__":
    unittest.main()
