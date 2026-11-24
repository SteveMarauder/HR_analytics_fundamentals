from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import argparse
import webbrowser


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--port", default=8765, type=int)
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=here)
    address = "127.0.0.1"
    url = f"http://{address}:{args.port}"
    try:
        server = ThreadingHTTPServer((address, args.port), handler)
    except OSError as error:
        raise SystemExit(f"Could not start {url}: {error}") from error
    with server:
        print(f"Open {url} in a browser. Press Ctrl+C to stop.", flush=True)
        if not args.no_browser:
            Timer(0.25, webbrowser.open, args=[url]).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
