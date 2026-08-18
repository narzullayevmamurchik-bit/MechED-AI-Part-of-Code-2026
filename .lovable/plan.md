## Goal
Delete the oversized `electron-release/MechEd-win32-x64/MechEd.exe` binary from the project so it stops blocking GitHub sync.

## Steps
1. Remove the file `electron-release/MechEd-win32-x64/MechEd.exe` from the project using `rm`.
2. Leave `.gitignore` as-is (already excludes `electron-release/` and `*.exe`).
3. Leave all application source, Electron config (`electron/main.cjs`), Supabase, and UI untouched.

## Notes
- Deleting the file here removes it from the working tree only. If it was already committed to Git history, GitHub may still reject the push — in that case you'll need `git filter-repo` locally to purge it from history.
- The binary can be regenerated anytime by rerunning the Electron packager.
