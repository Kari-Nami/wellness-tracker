#!/usr/bin/env python3
"""Render only the three routing settings. Never evaluate shell code or print secrets."""
import argparse
import os
from pathlib import Path
import re
import sys


def render(base_path: str, frontend_port: str, backend_port: str) -> str:
    path = '' if base_path in ('', '/') else base_path.rstrip('/')
    if path and not re.fullmatch(r'/[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*', path):
        raise ValueError('Invalid PUBLIC_BASE_PATH')
    for port in (frontend_port, backend_port):
        if not port.isdigit() or not 1 <= int(port) <= 65535:
            raise ValueError('Host ports must be integers from 1 to 65535')
    template = Path(__file__).with_name('wellness-tracker.locations.conf.template').read_text()
    if not path:
        # Root deployment cannot redirect / to itself. It occupies the domain root.
        template = template[template.index('location = ${PUBLIC_BASE_PATH}/api'):]
    for key, value in {'PUBLIC_BASE_PATH': path, 'FRONTEND_HOST_PORT': frontend_port, 'BACKEND_HOST_PORT': backend_port}.items():
        template = template.replace('${' + key + '}', value)
    return template


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--env-file', type=Path)
    args = parser.parse_args()
    settings = dict(os.environ)
    if args.env_file:
        wanted = {'PUBLIC_BASE_PATH', 'FRONTEND_HOST_PORT', 'BACKEND_HOST_PORT'}
        for line in args.env_file.read_text().splitlines():
            key, separator, value = line.partition('=')
            if separator and key.strip() in wanted:
                settings[key.strip()] = value.strip().strip('"').strip("'")
    try:
        print(render(settings.get('PUBLIC_BASE_PATH', '/'), settings.get('FRONTEND_HOST_PORT', '18080'), settings.get('BACKEND_HOST_PORT', '13000')), end='')
    except ValueError as error:
        sys.exit(str(error))


if __name__ == '__main__':
    main()
