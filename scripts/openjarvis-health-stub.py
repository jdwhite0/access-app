#!/usr/bin/env python3
"""Minimal OpenJarvis health stub for ACCESS when jarvis serve is unavailable."""
from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: object) -> None:
        return

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/health":
            body = json.dumps({"status": "ok", "version": "access-stub"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path.rstrip("/") == "/v1/tools":
            body = json.dumps(
                {
                    "tools": [
                        {"name": "file_read", "description": "stub"},
                        {"name": "file_list", "description": "stub"},
                    ]
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()


def main() -> None:
    import os

    host = os.environ.get("OPENJARVIS_HOST", "127.0.0.1")
    port = int(os.environ.get("OPENJARVIS_PORT", "8000"))
    print(f"OpenJarvis health stub at http://{host}:{port} (Ctrl+C to stop)", flush=True)
    HTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
