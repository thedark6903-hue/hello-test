param([string]$ZipPath="")
$ErrorActionPreference="Stop"
$ProjectRoot=git rev-parse --show-toplevel 2>$null
if($LASTEXITCODE -ne 0){throw "Run this from inside the hello-test Git project."}
$ProjectRoot=(Resolve-Path $ProjectRoot).Path; Set-Location $ProjectRoot
if(git status --porcelain){git status; throw "Git working tree is not clean."}
if(-not $ZipPath){$ZipPath=Read-Host "Paste the full path of the AI Studio ZIP"}
$ZipPath=$ZipPath.Trim('"')
if(-not(Test-Path $ZipPath -PathType Leaf)){throw "ZIP not found: $ZipPath"}

Write-Host "=== Hello Test: AI Studio SAFE AUTO UPDATER ===" -ForegroundColor Cyan
git fetch origin
if($LASTEXITCODE -ne 0){throw "git fetch failed."}
$ab=(git rev-list --left-right --count HEAD...origin/main)-split '\s+'
if([int]$ab[1] -gt 0 -and [int]$ab[0] -eq 0){
  git rebase origin/main
  if($LASTEXITCODE -ne 0){git rebase --abort 2>$null; throw "Could not rebase onto origin/main."}
}elseif([int]$ab[0] -gt 0 -and [int]$ab[1] -gt 0){throw "Local and GitHub have diverged. Resolve this before using the updater."}

$Temp=Join-Path $env:TEMP ("hello-test-ai-"+[guid]::NewGuid().ToString("N"))
$Extract=Join-Path $Temp "extract"; $Work=Join-Path $Temp "project"
New-Item -ItemType Directory -Force $Extract,$Work|Out-Null

$ProtectedExact=@("src/version.ts","public/version.json","package.json","package-lock.json","capacitor.config.ts","vite.config.ts","tsconfig.json","tsconfig.app.json","tsconfig.node.json","index.html")
$ProtectedPrefixes=@(".git",".github","android","node_modules","dist")
function R([string]$p){$p.Replace("\","/").TrimStart("./")}
function Protected([string]$p){$r=R $p;if($ProtectedExact -contains $r){return $true};foreach($x in $ProtectedPrefixes){if($r -eq $x -or $r.StartsWith("$x/")){return $true}};return $false}
function Allowed([string]$p){$r=R $p;return($r -eq "src" -or $r.StartsWith("src/") -or $r -eq "public" -or $r.StartsWith("public/"))}

try{
  Write-Host "Extracting ZIP..."
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $Extract -Force
  $roots=@($Extract)+@(Get-ChildItem $Extract -Directory -Force|% FullName)
  $src=$roots|?{Test-Path(Join-Path $_ "package.json")}|Select -First 1
  if(-not $src){throw "Could not find the AI Studio project root (package.json)."}

  Write-Host "Creating temporary project..."
  Get-ChildItem $ProjectRoot -Force|?{$_.Name -ne ".git"}|%{Copy-Item $_.FullName (Join-Path $Work $_.Name) -Recurse -Force}

  Write-Host "Applying only allowed AI Studio files..."
  Get-ChildItem $src -Recurse -File -Force|%{
    $rel=R $_.FullName.Substring($src.Length)
    if(-not(Allowed $rel)){return};if(Protected $rel){Write-Host "SKIP protected: $rel" -ForegroundColor Yellow;return}
    $dest=Join-Path $Work $rel;New-Item -ItemType Directory -Force (Split-Path $dest)|Out-Null;Copy-Item $_.FullName $dest -Force
  }
  if(-not(Test-Path(Join-Path $Work "package.json"))){throw "Temporary project is missing package.json."}

  Set-Location $Work;Write-Host "Testing build in temporary project..."
  npm run build;if($LASTEXITCODE -ne 0){throw "BUILD_FAILED"}

  Set-Location $ProjectRoot;Write-Host "Build passed. Applying changes..."
  Get-ChildItem $Work -Recurse -File -Force|%{
    $rel=R $_.FullName.Substring($Work.Length)
    if(-not(Allowed $rel)-or(Protected $rel)){return}
    $dest=Join-Path $ProjectRoot $rel;New-Item -ItemType Directory -Force (Split-Path $dest)|Out-Null;Copy-Item $_.FullName $dest -Force
  }

  Write-Host "Verifying real project build..."
  npm run build;if($LASTEXITCODE -ne 0){git restore -- src public 2>$null;throw "REAL_BUILD_FAILED"}

  Write-Host "`nChanged files:" -ForegroundColor Cyan;git status --short
  if(-not(git status --porcelain)){Write-Host "No changes detected.";exit 0}
  git diff --stat
  $ok=Read-Host "Commit and push these changes? (Y/N)"
  if($ok -notmatch '^[Yy]$'){Write-Host "Cancelled. Changes remain local.";exit 0}

  git add src public
  git commit -m "feat: update app from AI Studio"
  if($LASTEXITCODE -ne 0){throw "git commit failed."}

  git fetch origin
  $rb=(git rev-list --left-right --count HEAD...origin/main)-split '\s+'
  if([int]$rb[1] -gt 0){
    Write-Host "GitHub changed while working. Rebasing local commit..." -ForegroundColor Yellow
    git rebase origin/main
    if($LASTEXITCODE -ne 0){Write-Host "Rebase conflict. Push stopped; local commit preserved." -ForegroundColor Red;exit 1}
  }

  git push origin main
  if($LASTEXITCODE -ne 0){throw "git push failed."}
  Write-Host "`nUPDATE SUCCESSFUL: build passed, commit pushed, GitHub Actions can build the APK." -ForegroundColor Green
}catch{Set-Location $ProjectRoot;Write-Host "UPDATE FAILED: $($_.Exception.Message)" -ForegroundColor Red;exit 1}
finally{Set-Location $ProjectRoot;if(Test-Path $Temp){Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue}}
