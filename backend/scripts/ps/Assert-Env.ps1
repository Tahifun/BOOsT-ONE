<# 
  Assert-Env.ps1
  - Prüft, ob Pflicht-Keys in .env vorhanden/nicht-leer sind.
  - Bricht mit ExitCode 1 und präziser Fehlermeldung ab, ohne Werte zu drucken.
  - Gibt bei Erfolg das von LoadEnv.ps1 gelieferte Objekt ($ctx) zurück.

  Verwendung:
    $ctx = & "$PSScriptRoot\Assert-Env.ps1" -Keys @("JWT_SECRET","JWT_ISSUER") -Path ".env" -SetGlobal
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)]
  [string[]]$Keys,

  [string]$Path = ".env",
  [switch]$SetGlobal
)

$loadEnv = Join-Path -Path $PSScriptRoot -ChildPath "LoadEnv.ps1"
if (-not (Test-Path -LiteralPath $loadEnv)) {
  Write-Error "Assert-Env.ps1: LoadEnv.ps1 nicht gefunden unter $loadEnv"
  exit 1
}

try {
  $ctx = & $loadEnv -Path $Path -SetGlobal:$SetGlobal
} catch {
  Write-Error ("Assert-Env.ps1: {0}" -f $_.Exception.Message)
  exit 1
}

$envMap = $ctx.Map
$missing = @()

foreach ($k in $Keys) {
  if (-not $envMap.ContainsKey($k) -or [string]::IsNullOrWhiteSpace($envMap[$k])) {
    $missing += $k
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Fehlende .env Keys: {0}. Bitte in {1} setzen. Vorgang abgebrochen." -f ($missing -join ", "), $Path)
  exit 1
}

# Erfolgreich: neutrales Context-Objekt zurück
return $ctx
