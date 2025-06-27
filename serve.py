#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
from functools import partial

PORT = 8080
DIRECTORY = "."  # Serve files from the project root
URL = f"http://localhost:{PORT}"


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom request handler that adds 'no-cache' headers to all responses.
    This prevents the browser from caching files during development, ensuring
    that changes to CSS, JS, etc., are reflected immediately on reload.
    """
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def run_server():
    """Starts the development server and opens the browser."""
    # Use a partial function to set the directory for the handler
    Handler = partial(NoCacheHTTPRequestHandler, directory=DIRECTORY)

    # Allow reusing the address to avoid "Address already in use" error on quick restarts
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        separator = "=" * 53
        print(separator)
        print("  Yggdrasil Project Development Server Started")
        print(separator)
        print(f"\nServing on port: {PORT}")
        print(f"Opening app at: {URL}")
        print("\nTo stop the server, press Ctrl+C in this terminal.")
        print(separator)
        
        try:
            webbrowser.open_new_tab(URL)
        except webbrowser.Error:
            print("\nCould not open web browser automatically.")
            print(f"Please open this URL in your browser: {URL}")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped by user.")
        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}")
        finally:
            print("Server shutting down.")


if __name__ == "__main__":
    run_server()