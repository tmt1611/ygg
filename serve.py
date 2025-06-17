#!/usr/bin/env python3
import http.server
import socketserver

PORT = 8080

# This handler will serve files from the directory where the script is run.
# Make sure to run this script from the project's root directory.
Handler = http.server.SimpleHTTPRequestHandler

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