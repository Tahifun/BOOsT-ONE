<# 
  LoadEnv.ps1
  - Robustes Einlesen einer .env-Datei in eine Hashtable ($envMap)
  - Unterstützt: KEY=VALUE, Werte mit/ohne Quotes, '=' im Wert, Inline-Kommentare bei UNQUOTED Werten
  - Optionales Setzen globaler Variablen ($global:envMap, $global:BACKEND)
  - Optionales Exportieren in den Prozess (Env:) ohne Ausgabe von Secrets

  Verwendung:
    $ctx = & "$PSScriptRoot\LoadEnv.ps1" -Path ".env" -BackendDefault "http://127.0.0.1:4001" -SetGlobal
    # $ctx.Map  → Hashtable
    # $ctx.Backend → String
#>

[CmdletBinding()]
param(
  [string]$Path = ".env",
  [string]$BackendDefault = "http://127.0.0.1:4001",
  [switch]$ExportToProcess,
  [switch]$SetGlobal
)

function Convert-DotEnvToHashtable {
  param([string[]]$Lines)

  $table = @{}
  foreach ($raw in $Lines) {
    if ($null -eq $raw) { continue }
    $line = $raw.Trim()
    if ($line -eq "" -or $line.StartsWith("#") -or $line.StartsWith(";")) { continue }

    # KEY=VALUE (nur am ersten '=' splitten)
    if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { continue }
    $key   = $matches[1]
    $value = $matches[2]

    # Entferne führende/trailing Spaces einmal
    $value = $value.Trim()

    # Wenn gequoted (einfach ODER doppelt) → Quotes abstreifen, '#' bleibt Teil des Wertes
    if (($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) -or
        ($value.StartsWith("'") -and $value.EndsWith("'") -and $value.Length -ge 2)) {
      $value = $value.Substring(1, $value.Length - 2)
    } else {
      # Unquoted: Inline-Kommentar ab ' #' (SPACE-Hash) oder am Zeilenende ' #...'
      $hashIdx = $value.IndexOf(' #')
      if ($hashIdx -ge 0) { $value = $value.Substring(0, $hashIdx).TrimEnd() }
    }

    # Windows-CR entfernen (falls vorhanden)
    $value = $value -replace '\r$', ''

    $table[$key] = $value
  }
  return $table
}

if (-not (Test-Path -LiteralPath $Path)) {
  throw "LoadEnv.ps1: Datei nicht gefunden: $Path"
}

$lines  = Get-Content -LiteralPath $Path -ErrorAction Stop
$envMap = Convert-DotEnvToHashtable -Lines $lines

# BACKEND_URL Fallback
$BACKEND = $envMap.BACKEND_URL
if ([string]::IsNullOrWhiteSpace($BACKEND)) { $BACKEND = $BackendDefault }

# Optional ins aktuelle Prozess-Env exportieren (z. B. für Tools, die Env: lesen)
if ($ExportToProcess) {
  foreach ($kv in $envMap.GetEnumerator()) {
    Set-Item -Path ("Env:{0}" -f $kv.Key) -Value $kv.Value -ErrorAction SilentlyContinue
  }
}

if ($SetGlobal) {
  $global:envMap = $envMap
  $global:BACKEND = $BACKEND
}

# Nur ein neutrales Objekt zurückgeben (keine Secrets loggen)
[pscustomobject]@{
  Map     = $envMap
  Backend = $BACKEND
}
