param(
  [ValidateSet("backend","frontend")] [string]$Scope = "backend",
  [switch]$Fix
)

Write-Host "=== Import Check ($Scope) ===`n"

function Get-Files($root, $patterns) {
  $files = @()
  foreach ($p in $patterns) {
    $files += Get-ChildItem -Path $root -Recurse -File -Include $p `
      | Where-Object { $_.FullName -notmatch "\\node_modules\\|\\dist\\|\\build\\" }
  }
  return $files
}

if ($Scope -eq "backend") {
  $root = Join-Path (Get-Location) "backend"
  if (-not (Test-Path $root)) { Write-Host "No backend/ folder found." -ForegroundColor Yellow; exit 0 }
  $files = Get-Files $root @("*.ts","*.js","*.mjs")
  $offenders = @()

  foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    # Finde relative Imports (static + dynamic)
    $matches = [regex]::Matches($content, "(from\s+['""])(\.{1,2}/[^'""]+)(['""])|(?:import\(\s*['""])(\.{1,2}/[^'""]+)(['""]\s*\))")
    foreach ($m in $matches) {
      $path = $null
      if ($m.Groups[2].Success) { $path = $m.Groups[2].Value }
      elseif ($m.Groups[4].Success) { $path = $m.Groups[4].Value }
      else { continue }

      if ($path -match "\.(js|json|css|scss)$") { continue }
      $offenders += [pscustomobject]@{ File=$f.FullName; ImportPath=$path }
      if ($Fix) {
        $new = $path + ".js"
        $content = $content -replace [regex]::Escape("$path'"), "$new'"
        $content = $content -replace [regex]::Escape("$path`""), "$new`""
      }
    }
    if ($Fix) { Set-Content -Path $f.FullName -Value $content -Encoding UTF8 }
  }

  if ($offenders.Count -gt 0) {
    Write-Host "Backend imports missing .js extension:" -ForegroundColor Yellow
    $offenders | ForEach-Object { Write-Host " - $($_.File) → $($_.ImportPath)" }
    if (-not $Fix) { Write-Host "`nRun with -Fix to auto-fix." -ForegroundColor Cyan; exit 1 }
    else { Write-Host "`nFixed." -ForegroundColor Green }
  } else {
    Write-Host "Backend imports are OK." -ForegroundColor Green
  }

} else {
  $root = Join-Path (Get-Location) "src"
  if (-not (Test-Path $root)) { Write-Host "No src/ folder found." -ForegroundColor Yellow; exit 0 }
  $files = Get-Files $root @("*.ts","*.tsx")
  $bad = @()

  foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $m = [regex]::Matches($content, "from\s+['""]\.[^'""]+\.js['""]|import\(\s*['""]\.[^'""]+\.js['""]\s*\)")
    if ($m.Count -gt 0) {
      $bad += [pscustomobject]@{ File=$f.FullName; Count=$m.Count }
      if ($Fix) {
        $content = $content -replace "(from\s+['""])(\.[^'""]+?)\.js(['""])", "`$1`$2`$3"
        $content = $content -replace "(import\(\s*['""])(\.[^'""]+?)\.js(['""]\s*\))", "`$1`$2`$3"
        Set-Content -Path $f.FullName -Value $content -Encoding UTF8
      }
    }
  }

  if ($bad.Count -gt 0) {
    Write-Host "Frontend has .js extensions in TS imports:" -ForegroundColor Red
    $bad | ForEach-Object { Write-Host " - $($_.File) ($($_.Count))" }
    if (-not $Fix) { Write-Host "`nRun with -Fix to remove them." -ForegroundColor Cyan; exit 1 }
    else { Write-Host "`nFixed." -ForegroundColor Green }
  } else {
    Write-Host "Frontend imports are OK (no .js in TS files)." -ForegroundColor Green
  }
}
