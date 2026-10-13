# WOW3D 관리자 PC용 "Bambu Studio로 열기" 실행기 설치 스크립트 (Windows)
# - 관리자 주문관리의 "Bambu" 버튼(wow3d-bambu:// 링크)을 받아 STL을 내려받고 Bambu Studio로 엽니다
# - 현재 사용자 범위(HKCU)에만 등록하므로 관리자 권한이 필요 없습니다
# 설치:  이 파일을 마우스 오른쪽 클릭 → "PowerShell에서 실행"
# 제거:  powershell -ExecutionPolicy Bypass -File .\wow3d-bambu-setup.ps1 -Uninstall

param([switch]$Uninstall)

$ErrorActionPreference = 'Stop'
$installDir = Join-Path $env:LOCALAPPDATA 'WOW3D'
$handlerPath = Join-Path $installDir 'bambu-open.ps1'
$protocolKey = 'HKCU:\Software\Classes\wow3d-bambu'

Add-Type -AssemblyName PresentationFramework

if ($Uninstall) {
    if (Test-Path $protocolKey) { Remove-Item $protocolKey -Recurse -Force }
    if (Test-Path $handlerPath) { Remove-Item $handlerPath -Force }
    [System.Windows.MessageBox]::Show('WOW3D Bambu Studio 실행기를 제거했습니다.', 'WOW3D') | Out-Null
    exit 0
}

$handler = @'
# WOW3D: wow3d-bambu://open?u=<서명된 파일 주소>&u=... 를 받아 Bambu Studio로 엽니다
param([string]$Uri)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Web

function Show-Message([string]$text) {
    [System.Windows.MessageBox]::Show($text, 'WOW3D · Bambu Studio') | Out-Null
}

# 허용 주소: WOW3D 사이트(https) 또는 로컬 개발 서버, 관리자 주문 파일 경로만
function Test-AllowedUrl([Uri]$u) {
    $pathOk = $u.AbsolutePath -match '^/api/admin/orders/\d+/file$'
    $prodOk = $u.Scheme -eq 'https' -and @('www.wow3dp.co.kr', 'wow3dp.co.kr') -contains $u.Host
    $devOk = $u.Scheme -eq 'http' -and @('localhost', '127.0.0.1') -contains $u.Host
    return $pathOk -and ($prodOk -or $devOk)
}

function Get-SafeFileName([string]$disposition, [int]$index) {
    $name = $null
    if ($disposition -match "filename\*=UTF-8''([^;]+)") {
        $name = [Uri]::UnescapeDataString($Matches[1])
    } elseif ($disposition -match 'filename="?([^";]+)"?') {
        $name = $Matches[1]
    }
    if (-not $name) { $name = "model-$index.stl" }
    foreach ($c in [IO.Path]::GetInvalidFileNameChars()) { $name = $name.Replace([string]$c, '_') }
    if ($name -notmatch '\.(stl|3mf|obj|step|stp)$') { $name = "$name.stl" }
    return $name
}

function Find-BambuStudio {
    $candidates = @()
    $roots = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    foreach ($root in $roots) {
        Get-ItemProperty $root -ErrorAction SilentlyContinue |
            Where-Object { $_.DisplayName -like 'Bambu Studio*' } |
            ForEach-Object {
                if ($_.InstallLocation) { $candidates += (Join-Path $_.InstallLocation 'bambu-studio.exe') }
                if ($_.DisplayIcon) { $candidates += (($_.DisplayIcon -replace ',\d+$', '') -replace '"', '') }
            }
    }
    $candidates += (Join-Path $env:ProgramFiles 'Bambu Studio\bambu-studio.exe')
    foreach ($c in $candidates) {
        if ($c -and $c.ToLower().EndsWith('.exe') -and (Test-Path $c)) { return $c }
    }
    return $null
}

try {
    $queryStart = $Uri.IndexOf('?')
    if (-not $Uri.StartsWith('wow3d-bambu://', [StringComparison]::OrdinalIgnoreCase) -or $queryStart -lt 0) {
        throw '올바르지 않은 실행 링크입니다.'
    }
    $query = [System.Web.HttpUtility]::ParseQueryString($Uri.Substring($queryStart + 1))
    $urls = @($query.GetValues('u'))
    if ($urls.Count -eq 0 -or -not $urls[0]) { throw '열 파일이 없습니다.' }
    if ($urls.Count -gt 10) { throw '한 번에 최대 10개 파일까지 열 수 있습니다.' }

    $exe = Find-BambuStudio
    if (-not $exe) {
        Show-Message 'Bambu Studio가 설치되어 있지 않습니다. bambulab.com에서 설치한 뒤 다시 시도해 주세요.'
        exit 1
    }

    # 오래된 임시 폴더(7일 이상) 정리
    $tempRoot = Join-Path $env:TEMP 'WOW3D-Bambu'
    if (Test-Path $tempRoot) {
        Get-ChildItem $tempRoot -Directory |
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
    $dir = Join-Path $tempRoot (Get-Date -Format 'yyyyMMdd-HHmmss')
    New-Item -ItemType Directory -Path $dir -Force | Out-Null

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $files = @()
    $index = 0
    foreach ($raw in $urls) {
        $index++
        $u = [Uri]$raw
        if (-not (Test-AllowedUrl $u)) { throw "허용되지 않은 주소입니다: $($u.Host)" }
        $wc = New-Object System.Net.WebClient
        try {
            $bytes = $wc.DownloadData($u)
            $name = Get-SafeFileName $wc.ResponseHeaders['Content-Disposition'] $index
        } finally {
            $wc.Dispose()
        }
        $target = Join-Path $dir $name
        if (Test-Path $target) { $target = Join-Path $dir ("$index-" + $name) }
        [IO.File]::WriteAllBytes($target, $bytes)
        $files += $target
    }

    Start-Process -FilePath $exe -ArgumentList ($files | ForEach-Object { '"' + $_ + '"' })
} catch {
    $msg = $_.Exception.Message
    if ($msg -match '\(403\)') { $msg = '링크가 만료되었습니다. 주문관리에서 버튼을 다시 눌러 주세요.' }
    Show-Message "파일을 열지 못했습니다.`n$msg"
    exit 1
}
'@

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Set-Content -Path $handlerPath -Value $handler -Encoding UTF8

New-Item -Path $protocolKey -Value 'URL:WOW3D Bambu Studio Opener' -Force | Out-Null
New-ItemProperty -Path $protocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
$command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$handlerPath`" `"%1`""
New-Item -Path "$protocolKey\shell\open\command" -Value $command -Force | Out-Null

[System.Windows.MessageBox]::Show(
    "설치가 완료되었습니다.`n관리자 주문관리에서 'Bambu' 버튼을 누르면 Bambu Studio로 바로 열립니다.`n(처음 한 번은 브라우저가 열기 허용을 물어봅니다)",
    'WOW3D'
) | Out-Null
