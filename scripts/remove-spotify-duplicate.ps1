Write-Host "Checking for Spotify duplicates..."
$path1 = "src\spotify\SpotifyCallback.tsx"
$path2 = "src\pages\SpotifyCallback.tsx"

if ((Test-Path $path1) -and (Test-Path $path2)) {
  Write-Host "Duplicate found. Keeping: $path2 ; Removing: $path1"
  Remove-Item $path1 -Force

  if (Test-Path "src\spotify") {
    $isEmpty = -not (Get-ChildItem "src\spotify" -Recurse -File | Measure-Object).Count
    if ($isEmpty) {
      Remove-Item "src\spotify" -Force
      Write-Host "Removed empty folder src\spotify"
    }
  }

  Write-Host "Updating imports pointing to ../spotify/SpotifyCallback..."
  Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $c = Get-Content $_.FullName -Raw
    $n = $c -replace "from\s+'(\.\.\/)spotify\/SpotifyCallback'", "from '$1pages/SpotifyCallback'"
    $n = $n -replace "from\s+""(\.\.\/)spotify\/SpotifyCallback""", "from ""$1pages/SpotifyCallback"""
    if ($n -ne $c) {
      Set-Content -Path $_.FullName -Value $n -Encoding UTF8
      Write-Host "Updated imports in $($_.FullName)"
    }
  }

  Write-Host "Spotify cleanup done."
} else {
  Write-Host "No Spotify duplicates found."
}
