#!/usr/bin/env python3
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import firebase_admin
from firebase_admin import credentials, firestore

COLLECTION = 'app_storage'


def get_database():
    if not firebase_admin._apps:
        service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if not service_account_path:
            raise RuntimeError('Set FIREBASE_SERVICE_ACCOUNT in .env before starting the API server.')
        if not os.path.isfile(service_account_path):
            raise RuntimeError(f'Firebase service-account file not found: {service_account_path}')
        firebase_admin.initialize_app(credentials.Certificate(service_account_path))
    return firestore.client()


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
            self.send_json({'ok': True, 'database': 'firestore'})
            return
        if self.path == '/api/storage':
            documents = get_database().collection(COLLECTION).stream()
            self.send_json({document.id: document.to_dict().get('value') for document in documents})
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
            get_database().collection(COLLECTION).document(payload['key']).set({'value': payload.get('value')})
            self.send_json({'ok': True})
        except (json.JSONDecodeError, ValueError) as error:
            self.send_error(400, str(error))

    def do_DELETE(self):
        if not self.path.startswith('/api/storage/'):
            self.send_error(404)
            return
        key = self.path.removeprefix('/api/storage/')
        get_database().collection(COLLECTION).document(key).delete()
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
    get_database()
    print('Veloce Firestore server running at http://localhost:8000')
    ThreadingHTTPServer(('localhost', 8000), VeloceHandler).serve_forever()
