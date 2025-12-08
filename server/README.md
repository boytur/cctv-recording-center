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
# run
go run .
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
