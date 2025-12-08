# CCTV Recording Center — Server

This is a minimal Go server scaffold for the CCTV Recording Center.

This version includes SQLite + GORM integration. The server will create `data/server.db`
automatically and run `AutoMigrate` for the `Camera` model on startup.

Endpoints:
- `GET /health` — returns `ok` (200)
- `GET /api/cameras` — returns cameras from the SQLite database

Run locally (PowerShell):

```powershell
cd e:\app\cctv-recording-center\server
# download deps and tidy modules
go get ./...
go mod tidy
# run the clean-architecture server (cmd entrypoint)
go run ./cmd/server
```

Build executable (PowerShell):

```powershell
cd e:\app\cctv-recording-center\server
go build -o cctv-server.exe
.\\cctv-server.exe
```

Notes:
- Database file: `data/server.db` (created automatically).
- Models are in `models/` and are migrated automatically by `internal/db`.

Next steps:
- Add endpoints to create/update/delete cameras.
- Add configuration for DB path and migration control.
- Add authentication and CORS if the client will call the API from a browser.

Local development with Air (live-reload)

This project now uses the pure-Go `modernc.org/sqlite` driver so a C toolchain is not required during development.

1. Install `air` (once):

```powershell
go install github.com/cosmtrek/air/v2/cmd/air@latest
```

2. Start live-reload in the `server` directory:

```powershell
cd e:\app\cctv-recording-center\server
air
```

Or use the provided helper script which installs `air` if missing and runs it:

```powershell
cd e:\app\cctv-recording-center\server\scripts
.\dev.ps1
```

Air is configured via the `.air.toml` file at the repository root of the `server`.
