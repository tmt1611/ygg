#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser

PORT = 8080
DIRECTORY = "." # Serve files from the current directory
URL = f"http://localhost:{PORT}"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

# Allow reusing the address to avoid "Address already in use" error on quick restarts
socketserver.TCPServer.allow_reuse_address = True

def run_server():
    """Starts the development server and opens the browser."""
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        separator = "=" * 53
        print(separator)
        print("  Yggdrasil Project Server Started")
        print(separator)
        print(f"\nServing on port {PORT}")
        print("Make sure you are running this from the project root directory.")
        print(f"Opening app in your default browser: {URL}")
        print("\nTo stop the server, press Ctrl+C in this terminal.")
        print(separator)
        
        try:
            webbrowser.open_new_tab(URL)
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.server_close()

if __name__ == "__main__":
    run_server()