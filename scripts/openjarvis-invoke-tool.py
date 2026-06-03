#!/usr/bin/env python3
"""Invoke one OpenJarvis ToolRegistry tool (used by ACCESS adapter; not a standalone service)."""
from __future__ import annotations

import json
import sys


def main() -> None:
    payload = json.load(sys.stdin)
    tool_name = payload["tool"]
    params = payload.get("params") or {}
    allowed_dirs = payload.get("allowed_dirs") or []

    import openjarvis.tools  # noqa: F401 — register built-ins
    from openjarvis.core.registry import ToolRegistry

    if not ToolRegistry.contains(tool_name):
        print(json.dumps({"success": False, "content": f"Unknown tool: {tool_name}"}))
        sys.exit(0)

    cls = ToolRegistry.get(tool_name)
    if tool_name == "file_read":
        instance = cls(allowed_dirs=allowed_dirs)
    else:
        instance = cls()

    result = instance.execute(**params)
    meta = getattr(result, "metadata", None) or {}
    print(
        json.dumps(
            {
                "success": bool(result.success),
                "content": result.content,
                "metadata": meta,
                "tool_name": result.tool_name,
            }
        )
    )


if __name__ == "__main__":
    main()
