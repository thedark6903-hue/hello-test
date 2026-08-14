param(
  [string]$ZipPath = ""
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== Hello Test: AI Studio Updater ===" -ForegroundColor Cyan

# Find Git root
$ProjectRoot = git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Run this script from inside your hello-test Git project." -ForegroundColor Red
  exit 1
}
$ProjectRoot = (Resolve-Path $ProjectRoot).Path
Set-Location $ProjectRoot

# Never overwrite uncommitted work
if (git status --porcelain) {
  Write-Host "ERROR: Git working tree is not clean." -ForegroundColor Red
  git status
  Write-Host "Commit/stash existing changes before using the updater." -ForegroundColor Yellow
  exit 1
}

if (-not $ZipPath) {
  $ZipPath = Read-Host "`nPaste the full path of the AI Studio ZIP"
}
$ZipPath = $ZipPath.Trim('"')

if (-not (Test-Path $ZipPath -PathType Leaf)) {
  Write-Host "ERROR: ZIP not found." -ForegroundColor Red
  exit 1
}

$Temp = Join-Path $env:TEMP ("hello-test-ai-" + [guid]::NewGuid().ToString("N"))
$Extract = Join-Path $Temp "extract"
$Backup = Join-Path $Temp "backup"
New-Item -ItemType Directory -Force $Extract,$Backup | Out-Null

# Files/areas controlled by the real project and NOT by AI Studio.
$ProtectedExact = @(
  "version.ts",
  "version.json"
)

$ProtectedPrefixes = @(
  ".git",
  ".github",
  "android",
  "node_modules",
  "dist"
)

function Is-Protected([string]$Rel) {
  $p = $Rel.Replace("\","/").TrimStart("./")
  if ($ProtectedExact -contains $p) { return $true }
  foreach ($x in $ProtectedPrefixes) {
    if ($p -eq $x -or $p.StartsWith("$x/")) { return $true }
  }
  return $false
}

function Copy-TreeSafe([string]$From,[string]$To) {
  Get-ChildItem -LiteralPath $From -Recurse -File -Force | ForEach-Object {
    $rel = $_.FullName.Substring($From.Length).TrimStart("\","/")
    if (Is-Protected $rel) {
      Write-Host "  SKIP protected: $rel" -ForegroundColor DarkYellow
      return
    }
    $dest = Join-Path $To $rel
    New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
    Copy-Item $_.FullName $dest -Force
  }
}

try {
  Write-Host "Extracting ZIP..." -ForegroundColor Cyan
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $Extract -Force

  $Roots = @($Extract) + @(Get-ChildItem $Extract -Directory -Force | ForEach-Object FullName)
  $SourceRoot = $Roots | Where-Object { Test-Path (Join-Path $_ "package.json") } | Select-Object -First 1

  if (-not $SourceRoot) {
    throw "Could not find package.json in the exported AI Studio project."
  }

  # Backup only the current files that the ZIP may overwrite.
  Write-Host "Creating temporary backup..." -ForegroundColor Cyan
  Copy-TreeSafe $ProjectRoot $Backup

  Write-Host "Applying AI Studio files..." -ForegroundColor Cyan
  Copy-TreeSafe $SourceRoot $ProjectRoot

  Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed." }

  Write-Host "`nRunning production build..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "BUILD_FAILED"
  }

  Write-Host "`nBuild passed. Changes:" -ForegroundColor Green
  git status --short
  git diff --stat

  $answer = Read-Host "`nCommit and push these changes? (Y/N)"
  if ($answer -notmatch "^[Yy]$") {
    Write-Host "Stopped. No commit or push performed." -ForegroundColor Yellow
    exit 0
  }

  git add -A

  # Absolutely prevent protected paths from being committed.
  foreach ($p in $ProtectedExact) { git reset -- $p 2>$null }
  foreach ($p in $ProtectedPrefixes) { git reset -- $p 2>$null }

  git commit -m "feat: update app from AI Studio"
  if ($LASTEXITCODE -ne 0) { throw "git commit failed." }

  git push origin main
  if ($LASTEXITCODE -ne 0) { throw "git push failed." }

  Write-Host "`nSUCCESS: App updated and pushed to GitHub." -ForegroundColor Green
}
catch {
  Write-Host "`nUPDATE FAILED: $($_.Exception.Message)" -ForegroundColor Red

  if ($_.Exception.Message -eq "BUILD_FAILED") {
    Write-Host "Build failed. Restoring previous project files..." -ForegroundColor Yellow

    # Restore every non-protected file that existed before the update.
    Get-ChildItem -LiteralPath $ProjectRoot -Recurse -File -Force |
      Where-Object {
        $rel = $_.FullName.Substring($ProjectRoot.Length).TrimStart("\","/")
        -not (Is-Protected $rel) -and
        $rel -notlike ".git/*"
      } |
      ForEach-Object {
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
      }

    Copy-TreeSafe $Backup $ProjectRoot

    git restore --staged . 2>$null
    git restore . 2>$null

    Write-Host "Rollback completed. Nothing was committed or pushed." -ForegroundColor Green
  }
  else {
    Write-Host "No automatic push was performed." -ForegroundColor Yellow
  }

  exit 1
}
finally {
  # Temporary backup is deleted after success, cancellation, or rollback.
  if (Test-Path $Temp) {
    Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue
  }
}
