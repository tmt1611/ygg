#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8080

# This handler will serve files from the directory where the script is run.
# Make sure to run this script from the project's root directory.
Handler = http.server.SimpleHTTPRequestHandler

# Allow reusing the address to avoid "Address already in use" error on quick restarts
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("=====================================================")
    print("  Yggdrasil Project Server Started")
    print("=====================================================")
    print(f"\nServing on port {PORT}")
    print(f"Please make sure you are running this from the project root directory.")
    print(f"Open your browser and go to: http://localhost:{PORT}")
    print("\nTo stop the server, press Ctrl+C in this terminal.")
    print("=====================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()