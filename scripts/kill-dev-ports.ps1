$ErrorActionPreference = "SilentlyContinue"

$ports = @(3001, 3010)

function Get-PortPids([int]$port) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen
  if (-not $connections) { return @() }
  return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
}

foreach ($port in $ports) {
  $pids = Get-PortPids $port
  foreach ($procId in $pids) {
    taskkill /PID $procId /T /F | Out-Null
    Write-Output "Freed port $port (PID $procId)"
  }
}

Start-Sleep -Milliseconds 300

foreach ($port in $ports) {
  $stillUsed = Get-PortPids $port
  if ($stillUsed.Count -gt 0) {
    Write-Output "Port $port still busy: $($stillUsed -join ',')"
  }
}
