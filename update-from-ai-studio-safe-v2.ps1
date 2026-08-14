param([string]$ZipPath="")
$ErrorActionPreference="Stop"
Write-Host "=== Hello Test SAFE AI Studio Updater (DRY RUN) ===" -ForegroundColor Cyan
$ProjectRoot = git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0) { throw "Run this from inside the hello-test Git project." }
$ProjectRoot=(Resolve-Path $ProjectRoot).Path
Set-Location $ProjectRoot
if (git status --porcelain) { Write-Host "ERROR: Git working tree is not clean." -ForegroundColor Red; git status; exit 1 }
if (-not $ZipPath) { $ZipPath=Read-Host "Paste the full path of the AI Studio ZIP" }
$ZipPath=$ZipPath.Trim('"')
if (-not (Test-Path $ZipPath -PathType Leaf)) { throw "ZIP not found." }
$Temp=Join-Path $env:TEMP ("hello-test-ai-"+[guid]::NewGuid().ToString("N"))
$Extract=Join-Path $Temp "extract"
$WorkProject=Join-Path $Temp "work-project"
New-Item -ItemType Directory -Force $Extract,$WorkProject | Out-Null
$Protected=@("src/version.ts","public/version.json","package.json","package-lock.json","capacitor.config.ts","vite.config.ts","tsconfig.json","tsconfig.app.json","tsconfig.node.json","index.html")
$ProtectedPrefixes=@(".git",".github","android","node_modules","dist")
function Rel([string]$p) { $p.Replace("\","/").TrimStart("./") }
function Blocked([string]$p) { $r=Rel $p; if ($Protected -contains $r) { return $true }; foreach($x in $ProtectedPrefixes) { if ($r -eq $x -or $r.StartsWith("$x/")) { return $true } }; return $false }
function Allowed([string]$p) { $r=Rel $p; return ($r -eq "src" -or $r.StartsWith("src/") -or $r -eq "public" -or $r.StartsWith("public/")) }
try {
  Write-Host "Extracting ZIP..." -ForegroundColor Cyan
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $Extract -Force
  $Roots=@($Extract)+@(Get-ChildItem $Extract -Directory -Force | % FullName)
  $Source=$Roots | ? { Test-Path (Join-Path $_ "package.json") } | Select -First 1
  if (-not $Source) { throw "AI Studio project root not found." }
  Write-Host "Creating temporary project copy..." -ForegroundColor Cyan
  foreach ($item in Get-ChildItem -LiteralPath $ProjectRoot -Force) { if ($item.Name -ne ".git") { Copy-Item $item.FullName (Join-Path $WorkProject $item.Name) -Recurse -Force } }
  Write-Host "Applying ONLY allowed source files..." -ForegroundColor Cyan
  Get-ChildItem $Source -Recurse -File -Force | % { $r=Rel $_.FullName.Substring($Source.Length); if (-not (Allowed $r)) { return }; if (Blocked $r) { Write-Host "SKIP protected: $r" -ForegroundColor Yellow; return }; $dest=Join-Path $WorkProject $r; New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null; Copy-Item $_.FullName $dest -Force }
  if (-not (Test-Path (Join-Path $WorkProject "package.json"))) { throw "Temporary project is missing package.json." }
  Set-Location $WorkProject
  Write-Host "Running build in temporary copy..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "BUILD_FAILED" }
  Set-Location $ProjectRoot
  Write-Host "`nDRY RUN SUCCESS" -ForegroundColor Green
  Write-Host "Build passed." -ForegroundColor Green
  Write-Host "REAL PROJECT WAS NOT MODIFIED." -ForegroundColor Green
  Write-Host "NOTHING WAS COMMITTED OR PUSHED." -ForegroundColor Green
} catch { Set-Location $ProjectRoot; Write-Host "DRY RUN FAILED: $($_.Exception.Message)" -ForegroundColor Red; Write-Host "REAL PROJECT WAS NOT MODIFIED." -ForegroundColor Yellow; exit 1 } finally { Set-Location $ProjectRoot; if (Test-Path $Temp) { Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue } }
