$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"
$env:GENVM_VERSION = "v0.2.16"

Write-Host "[1/4] genvm-lint"
& "$PSScriptRoot\..\.venv\Scripts\genvm-lint.exe" check "$PSScriptRoot\..\contracts\repligrant.py"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[2/4] direct tests"
& "$PSScriptRoot\..\.venv\Scripts\python.exe" -m pytest "$PSScriptRoot\..\tests\direct" -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[3/4] browser RPC proxy tests"
$proxyTests = Get-ChildItem -LiteralPath "$PSScriptRoot\..\tests\proxy" -Filter "*.test.mjs" | ForEach-Object { $_.FullName }
& node --test @proxyTests
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[4/4] frontend"
& npm --prefix "$PSScriptRoot\..\frontend" run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& npm --prefix "$PSScriptRoot\..\frontend" test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& npm --prefix "$PSScriptRoot\..\frontend" run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "CHECK_PASS: lint, direct tests, browser RPC proxy tests, frontend typecheck/tests/build"
