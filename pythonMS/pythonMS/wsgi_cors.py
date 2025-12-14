"""
WSGI wrapper that injects CORS headers and handles OPTIONS preflight.
Wraps the Django WSGI application exported by pythonMS.wsgi:application.
"""

try:
    from pythonMS.wsgi import application as django_app
except Exception as e:
    # ensure import failure is visible in container logs early
    raise

def _get_origin(environ):
    return environ.get("HTTP_ORIGIN") or environ.get("HTTP_REFERER") or "*"

def _get_req_headers(environ):
    return environ.get("HTTP_ACCESS_CONTROL_REQUEST_HEADERS", "Authorization,Origin, X-Requested-With, Content-Type, Accept")

def cors_start_response(orig_start_response, environ):
    def _start(status, response_headers, exc_info=None):
        origin = _get_origin(environ)
        hdrs = [
            ("Access-Control-Allow-Origin", origin),
            ("Access-Control-Allow-Credentials", "true"),
            ("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH"),
            ("Access-Control-Allow-Headers", _get_req_headers(environ)),
        ]
        existing = {k.lower() for k, _ in response_headers}
        for k, v in hdrs:
            if k.lower() not in existing:
                response_headers.append((k, v))
        return orig_start_response(status, response_headers, exc_info)
    return _start

def application(environ, start_response):
    # Fast-path preflight
    if environ.get("REQUEST_METHOD", "").upper() == "OPTIONS":
        origin = _get_origin(environ)
        headers = [
            ("Content-Length", "0"),
            ("Content-Type", "text/plain"),
            ("Access-Control-Allow-Origin", origin),
            ("Access-Control-Allow-Credentials", "true"),
            ("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH"),
            ("Access-Control-Allow-Headers", _get_req_headers(environ)),
        ]
        start_response("204 No Content", headers)
        return [b""]

    wrapped_start = cors_start_response(start_response, environ)
    return django_app(environ, wrapped_start)