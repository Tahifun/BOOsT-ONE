Write-Host "Moving misplaced backend files from Frontend..."
New-Item -ItemType Directory -Force -Path "tools\dev-server" | Out-Null

if (Test-Path "src\server.mjs") {
  Move-Item "src\server.mjs" "tools\dev-server\server.mjs" -Force
  Write-Host "Moved src\server.mjs -> tools\dev-server\server.mjs"
}
if (Test-Path "src\openapi.mjs") {
  Move-Item "src\openapi.mjs" "tools\dev-server\openapi.mjs" -Force
  Write-Host "Moved src\openapi.mjs -> tools\dev-server\openapi.mjs"
}
if (Test-Path "src\routes") {
  Move-Item "src\routes" "tools\dev-server\routes" -Force
  Write-Host "Moved src\routes -> tools\dev-server\routes"
}

if (Test-Path "package.json") {
  $pkg = Get-Content "package.json" -Raw | ConvertFrom-Json
  if (-not $pkg.PSObject.Properties.Match('scripts')) {
    $scriptsObj = [ordered]@{}
    Add-Member -InputObject $pkg -MemberType NoteProperty -Name scripts -Value $scriptsObj
  }
  # dev:mock-server hinzufügen/überschreiben
  if ($pkg.scripts -is [System.Collections.IDictionary]) {
    $pkg.scripts['dev:mock-server'] = 'node tools/dev-server/server.mjs'
  } else {
    # Fallback: Scripts als PSCustomObject behandeln
    $null = $pkg.scripts | Add-Member -MemberType NoteProperty -Name 'dev:mock-server' -Value 'node tools/dev-server/server.mjs' -Force
  }
  ($pkg | ConvertTo-Json -Depth 10) | Set-Content -Encoding UTF8 "package.json"
  Write-Host "Added npm script: dev:mock-server"
}
Write-Host "Backend file move complete."
