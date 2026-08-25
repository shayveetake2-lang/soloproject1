#!/usr/bin/env python3
import json
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
DB_PATH = ROOT / 'veloce.sqlite3'


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.execute('CREATE TABLE IF NOT EXISTS app_storage (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    return connection


class VeloceHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/health':
            self.send_json({'ok': True, 'database': str(DB_PATH.name)})
            return
        if self.path == '/api/storage':
            with get_connection() as connection:
                rows = connection.execute('SELECT key, value FROM app_storage').fetchall()
            self.send_json({key: json.loads(value) for key, value in rows})
            return
        super().do_GET()

    def do_PUT(self):
        if self.path != '/api/storage':
            self.send_error(404)
            return
        try:
            payload = json.loads(self.read_body())
            if not isinstance(payload, dict) or not isinstance(payload.get('key'), str):
                raise ValueError('Expected a storage key and value')
            value = json.dumps(payload.get('value'))
            with get_connection() as connection:
                connection.execute(
                    'INSERT INTO app_storage(key, value) VALUES (?, ?) '
                    'ON CONFLICT(key) DO UPDATE SET value = excluded.value',
                    (payload['key'], value),
                )
            self.send_json({'ok': True})
        except (json.JSONDecodeError, ValueError) as error:
            self.send_error(400, str(error))

    def do_DELETE(self):
        if not self.path.startswith('/api/storage/'):
            self.send_error(404)
            return
        key = self.path.removeprefix('/api/storage/')
        with get_connection() as connection:
            connection.execute('DELETE FROM app_storage WHERE key = ?', (key,))
        self.send_json({'ok': True})

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return self.rfile.read(length).decode('utf-8')

    def send_json(self, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    with get_connection():
        pass
    print('Veloce database server running at http://localhost:8000')
    ThreadingHTTPServer(('localhost', 8000), VeloceHandler).serve_forever()
