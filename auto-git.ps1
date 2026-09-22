$projectPath = "C:\Users\USER\gym-management-system"

Set-Location $projectPath

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectPath
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    Start-Sleep -Seconds 2

    Set-Location "C:\Users\USER\gym-management-system"

    $changes = git status --porcelain

    if ($changes) {
        git add .
        git commit -m "Auto-update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push
    }
}

Register-ObjectEvent $watcher "Changed" -Action $action
Register-ObjectEvent $watcher "Created" -Action $action
Register-ObjectEvent $watcher "Deleted" -Action $action
Register-ObjectEvent $watcher "Renamed" -Action $action

Write-Host "Automatic GitHub sync is running..."
Write-Host "Save a file and the changes will be pushed automatically."
Write-Host "Press CTRL+C to stop."

while ($true) {
    Start-Sleep -Seconds 5
}