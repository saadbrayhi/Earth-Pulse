"""Authenticated, seekable remote access to NISAR .h5 files (HTTP range requests).

Credentials, in order of preference:
  1. EARTHDATA_TOKEN       (Earthdata Login bearer token, e.g. on a server)
  2. EARTHDATA_USERNAME + EARTHDATA_PASSWORD
  3. ~/.netrc entry for urs.earthdata.nasa.gov   (local development)
"""

import io
import os
import time
from urllib.parse import urlparse

import requests

EDL_HOST = "urs.earthdata.nasa.gov"


class EarthdataSession(requests.Session):
    """Keeps credentials across the Earthdata Login redirect (requests drops them on host change)."""

    def __init__(self):
        super().__init__()
        self.headers["User-Agent"] = "earthpulse"
        token = os.environ.get("EARTHDATA_TOKEN")
        user, pwd = os.environ.get("EARTHDATA_USERNAME"), os.environ.get("EARTHDATA_PASSWORD")
        self._token = token
        if not token and user and pwd:
            self.auth = (user, pwd)

    def rebuild_auth(self, prepared_request, response):
        host = urlparse(prepared_request.url).hostname or ""
        if self._token and ("earthdatacloud.nasa.gov" in host or host == EDL_HOST):
            prepared_request.headers["Authorization"] = f"Bearer {self._token}"
            return
        if host == EDL_HOST and self.auth:
            prepared_request.prepare_auth(self.auth)
            return
        super().rebuild_auth(prepared_request, response)  # default: netrc for the new host, strip otherwise

    def request(self, method, url, *args, **kwargs):
        if self._token and "earthdatacloud.nasa.gov" in (urlparse(url).hostname or ""):
            kwargs.setdefault("headers", {})
            kwargs["headers"] = {**kwargs["headers"], "Authorization": f"Bearer {self._token}"}
        return super().request(method, url, *args, **kwargs)


class AuthError(RuntimeError):
    pass


class RemoteFile(io.RawIOBase):
    """Read-only, seekable file over HTTP range requests, with a block cache."""

    BLOCK = 4 * 1024 * 1024

    def __init__(self, session: requests.Session, url: str):
        super().__init__()
        self.session, self.url = session, url
        self.pos, self.cache, self.bytes_fetched = 0, {}, 0
        self._resolve()

    def _resolve(self):
        # Follow the Earthdata login redirects once to get the signed download URL.
        r = self.session.get(self.url, headers={"Range": "bytes=0-0"}, timeout=60)
        if r.status_code == 401 or EDL_HOST in r.url:
            raise AuthError("Earthdata login failed: check credentials and that ASF data access is authorized.")
        r.raise_for_status()
        self.signed_url = r.url
        self.size = int(r.headers["Content-Range"].split("/")[1])

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=io.SEEK_SET):
        base = {io.SEEK_SET: 0, io.SEEK_CUR: self.pos, io.SEEK_END: self.size}[whence]
        self.pos = base + offset
        return self.pos

    def _block(self, i):
        if i not in self.cache:
            start = i * self.BLOCK
            end = min(start + self.BLOCK, self.size) - 1
            for attempt in range(4):
                r = self.session.get(self.signed_url, headers={"Range": f"bytes={start}-{end}"}, timeout=120)
                if r.status_code == 206:
                    break
                if r.status_code in (401, 403):  # signed URL expired -> get a fresh one
                    self._resolve()
                time.sleep(2 ** attempt)
            else:
                r.raise_for_status()
            self.cache[i] = r.content
            self.bytes_fetched += len(r.content)
        return self.cache[i]

    def readinto(self, buf):
        n = max(0, min(len(buf), self.size - self.pos))
        done = 0
        while done < n:
            i, off = divmod(self.pos, self.BLOCK)
            chunk = self._block(i)[off: off + n - done]
            buf[done: done + len(chunk)] = chunk
            done += len(chunk)
            self.pos += len(chunk)
        return done
