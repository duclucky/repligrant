$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$deploymentPath = Join-Path $projectRoot "deployment.json"
$contractPath = Join-Path $projectRoot "contracts\repligrant.py"
$envCandidates = @(
  (Join-Path $projectRoot ".env"),
  (Join-Path (Split-Path $projectRoot -Parent) ".env")
)
$envPath = $envCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $envPath) { throw "No authorized .env found in project or parent root." }
$envText = Get-Content -LiteralPath $envPath -Raw
foreach ($name in @("STUDIONET_PRIVATE_KEY", "STUDIONET_INTEGRATOR_PRIVATE_KEY")) {
  if ($envText -notmatch "(?m)^\s*$name\s*=\s*[^\s#].*$") { throw "$name is missing or empty." }
}

if (Test-Path $deploymentPath) {
  $existing = Get-Content $deploymentPath -Raw | ConvertFrom-Json
  $currentHash = (Get-FileHash -LiteralPath $contractPath -Algorithm SHA256).Hash.ToLower()
  if ($existing.active -eq $true -and $existing.network -eq "studionet" -and $existing.status -eq "FINALIZED" -and $existing.contract_address -and $existing.source_sha256 -eq $currentHash) {
    Write-Output "DEPLOYMENT_REUSED: $($existing.contract_address)"
    exit 0
  }
  if ($existing.active -eq $true -and $existing.contract_address) {
    $archiveDir = Join-Path $projectRoot "docs\evidence\studionet\deployments"
    New-Item -ItemType Directory -Force $archiveDir | Out-Null
    $archivePath = Join-Path $archiveDir ("superseded-" + $existing.contract_address + ".json")
    $existing | ConvertTo-Json | Set-Content -LiteralPath $archivePath -Encoding utf8
  }
}

$deployOutput = (& genlayer deploy --contract $contractPath 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw "genlayer deploy failed." }
$tx = [regex]::Match($deployOutput, "Deployment Transaction Hash:\s*\r?\n([^\s]+)").Groups[1].Value
$address = [regex]::Match($deployOutput, "Contract Address:\s*'?(0x[a-fA-F0-9]{40})'?").Groups[1].Value
if (-not $tx -or -not $address) { throw "Deployment output did not contain a safe transaction/address pair." }

$receiptOutput = (& genlayer receipt $tx --status FINALIZED --retries 50 --interval 3000 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) { throw "deployment receipt did not finalize." }
$status = [regex]::Match($receiptOutput, "status_name:\s*'([^']+)'").Groups[1].Value
$resultName = [regex]::Match($receiptOutput, "result_name:\s*'([^']+)'").Groups[1].Value
$execution = ([regex]::Matches($receiptOutput, "execution_result:\s*'([^']+)'") | ForEach-Object { $_.Groups[1].Value } | Select-Object -First 1)
$from = [regex]::Match($receiptOutput, "from_address:\s*'([^']+)'").Groups[1].Value
if ($status -ne "FINALIZED" -or $execution -ne "SUCCESS") { throw "Deployment finalized without successful execution." }

$sourceHash = (Get-FileHash -LiteralPath $contractPath -Algorithm SHA256).Hash.ToLower()
$record = [ordered]@{
  active = $true
  network = "studionet"
  chain_id = "61999"
  contract = "RepliGrant"
  contract_address = $address
  deployment_tx = $tx
  deployer = $from
  status = $status
  result_name = $resultName
  execution_result = $execution
  source_sha256 = $sourceHash
  depends = "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6"
  rpc = "https://studio.genlayer.com/api"
  explorer = "https://genlayer-explorer.vercel.app"
}
$record | ConvertTo-Json | Set-Content -LiteralPath $deploymentPath -Encoding utf8
Write-Output "DEPLOYMENT_FINALIZED: $address"
