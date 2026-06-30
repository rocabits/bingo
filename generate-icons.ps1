Add-Type -AssemblyName System.Drawing

function New-Icon($size, $outputPath) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'HighQuality'
  $g.InterpolationMode = 'HighQualityBicubic'

  $green = [System.Drawing.Color]::FromArgb(46, 204, 113)
  $white = [System.Drawing.Color]::FromArgb(255, 255, 255)

  $g.Clear($green)

  $s = [double]($size) / 100.0
  $wb = New-Object System.Drawing.SolidBrush($white)

  $g.FillRectangle($wb, [float](26*$s), [float](34*$s), [float](48*$s), [float](40*$s))
  $g.FillEllipse($wb, [float](26*$s), [float](18*$s), [float](48*$s), [float](32*$s))
  $g.FillRectangle($wb, [float](74*$s), [float](50*$s), [float](7*$s), [float](4*$s))
  $g.FillRectangle($wb, [float](74*$s), [float](45*$s), [float](3*$s), [float](14*$s))
  $g.FillEllipse($wb, [float](79.5*$s), [float](48.5*$s), [float](7*$s), [float](7*$s))
  $g.FillEllipse($wb, [float](44*$s), [float](76*$s), [float](12*$s), [float](12*$s))

  $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $wb.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

$root = "C:\Users\PEPELUIS\Desktop\apps\bingo"
New-Icon 192 "$root\icon-192.png"
New-Icon 512 "$root\icon-512.png"
Write-Host "Iconos generados correctamente"
