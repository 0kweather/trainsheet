"""Per-railroad plug-ins: one module per railroad, found by listing this directory."""
import importlib, pathlib

HERE = pathlib.Path(__file__).resolve().parent


def load(only=None):
    """The plug-in modules, sorted by id; with only, just that one."""
    mods = []
    for p in sorted(HERE.glob("*.py")):
        if p.stem.startswith("_") or (only and p.stem != only):
            continue
        mods.append(importlib.import_module(f"railroads.{p.stem}"))
    return mods
