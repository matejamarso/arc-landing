import http.server
import os
import socketserver

PORT = 5180
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Passing the directory explicitly avoids os.getcwd(), which the preview sandbox does not allow.
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Never let the browser keep an old copy: while the page is being worked on,
        # a reload must always show the latest files.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


# Threaded, so one stalled browser connection cannot block every other request.
class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Server(("", PORT), Handler) as httpd:
    print(f"Serving {ROOT} at http://localhost:{PORT}")
    httpd.serve_forever()
