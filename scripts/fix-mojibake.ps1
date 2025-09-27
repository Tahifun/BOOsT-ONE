$markers = "Ã|Â|â€”|â€“|â€œ|â€""|â€˜|â€™|â€¦|ð|âš¡"
$files = Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.css,*.html,*.md,*.json,*.yml,*.yaml,*.svg,*.txt `
  | Where-Object { $_.FullName -notmatch "\\node_modules\\|\\dist\\|\\build\\|\\.git\\" }

$encLatin1 = [Text.Encoding]::GetEncoding("iso-8859-1")
$encUtf8NoBom = New-Object Text.UTF8Encoding $false

$fixed = 0
foreach ($f in $files) {
  $text = Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8
  if ($text -match $markers) {
    $bytes = $encLatin1.GetBytes($text)
    $new   = [Text.Encoding]::UTF8.GetString($bytes)
    if ($new -ne $text) {
      [IO.File]::WriteAllText($f.FullName, $new, $encUtf8NoBom)
      $fixed++
      Write-Host "fixed $($f.FullName)"
    }
  }
}
Write-Host "TOTAL fixed: $fixed"
