"""Local dev server that disables browser caching, so a plain reload always shows the latest build.
Usage: python3 scripts/serve_nocache.py [port]   (default 8000), serves the repo root."""
import http.server, sys, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def log_message(self, *a): pass
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
