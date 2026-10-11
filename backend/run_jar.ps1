$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
if (Test-Path .env) { Get-Content .env | ForEach-Object { if ($_ -match "^(.*?)=(.*)$") { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process") } } }; java "-Dfile.encoding=UTF-8" -jar build/libs/backend-0.0.1-SNAPSHOT.jar
