Write-Host "Migrating to unified env system..."
$files = Get-ChildItem -Path "backend" -Recurse -Include *.ts,*.js -File | Where-Object {
  Select-String -Path $_.FullName -Pattern "utils\/env\.js" -Quiet
}
if ($files) {
  Write-Host "Found files using old utils/env.js:"
  $files | ForEach-Object { Write-Host " - " $_.FullName }
  foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $content = $content -replace 'from\s+"(\.\.\/|\.\/)utils\/env\.js"', 'from "$1utils/validateEnv.js"'
    $content = $content -replace "from\s+'(\.\.\/|\.\/)utils\/env\.js'", "from '$1utils/validateEnv.js'"
    $content = $content -replace '\{ *env *\}', 'env'
    Set-Content -Path $f.FullName -Value $content -Encoding UTF8
    Write-Host "Updated: $($f.FullName)"
  }
} else {
  Write-Host "No old env imports found."
}
$oldEnv = "backend\utils\env.ts"
if (Test-Path $oldEnv) {
  Rename-Item -Path $oldEnv -NewName "env.ts.deprecated" -Force
  Write-Host "Renamed backend\utils\env.ts to env.ts.deprecated"
}
Write-Host "Migration complete."
