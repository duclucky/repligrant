$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"
$env:GENVM_VERSION = "v0.2.16"

Write-Host "[1/3] genvm-lint"
& "$PSScriptRoot\..\.venv\Scripts\genvm-lint.exe" check "$PSScriptRoot\..\contracts\repligrant.py"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/3] direct tests"
& "$PSScriptRoot\..\.venv\Scripts\python.exe" -m pytest "$PSScriptRoot\..\tests\direct" -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/3] frontend"
& npm --prefix "$PSScriptRoot\..\frontend" run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& npm --prefix "$PSScriptRoot\..\frontend" test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& npm --prefix "$PSScriptRoot\..\frontend" run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "CHECK_PASS: lint, direct tests, frontend typecheck/tests/build"
