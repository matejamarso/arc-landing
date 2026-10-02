import functools
import http.server
import os
import socketserver

PORT = 5180
ROOT = os.path.dirname(os.path.abspath(__file__))

# Passing the directory explicitly avoids os.getcwd(), which the preview sandbox does not allow.
Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)


class Server(socketserver.TCPServer):
    allow_reuse_address = True


with Server(("", PORT), Handler) as httpd:
    print(f"Serving {ROOT} at http://localhost:{PORT}")
    httpd.serve_forever()
