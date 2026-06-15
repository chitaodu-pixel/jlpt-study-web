# Project Issue Log

## 1. GitHub push fails when direct GitHub HTTPS connection is unstable

Date recorded: 2026-06-15

### Symptoms

`git push origin main` may fail with errors like:

```text
fatal: unable to access 'https://github.com/chitaodu-pixel/jlpt-study-web.git/': Empty reply from server
fatal: unable to access 'https://github.com/chitaodu-pixel/jlpt-study-web.git/': Recv failure: Connection was reset
fatal: unable to access 'https://github.com/chitaodu-pixel/jlpt-study-web.git/': Failed to connect to github.com port 443
```

### Cause

The local network can time out or reset direct HTTPS connections to GitHub. In this environment, direct access to `github.com:443` was unstable, while the local proxy at `127.0.0.1:1080` worked.

### Fix Used

Configure the current repository to use the local SOCKS proxy for GitHub traffic:

```bash
git config http.proxy socks5h://127.0.0.1:1080
git config http.version HTTP/1.1
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
git push origin main
```

### Current Repository Git HTTP Config

```text
http.proxy=socks5h://127.0.0.1:1080
http.version=HTTP/1.1
http.lowSpeedLimit=0
http.lowSpeedTime=999999
```

### Prevention

For future GitHub push/pull/fetch failures in this project, first check whether the local proxy is still available:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 1080
```

If the proxy is available, keep using the repository-level proxy config above. If the proxy is not available, start the local proxy/VPN first, then retry:

```bash
git push origin main
```

