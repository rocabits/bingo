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

  # Drum body (main rectangle)
  $g.FillRectangle($wb, [float](22*$s), [float](32*$s), [float](56*$s), [float](48*$s))

  # Drum dome (top half-circle)
  $g.FillEllipse($wb, [float](22*$s), [float](12*$s), [float](56*$s), [float](40*$s))

  # Window circle (slightly transparent to show depth)
  $windowColor = [System.Drawing.Color]::FromArgb(255, 170, 230, 190)
  $winBrush = New-Object System.Drawing.SolidBrush($windowColor)
  $g.FillEllipse($winBrush, [float](31*$s), [float](34*$s), [float](38*$s), [float](38*$s))
  $winBrush.Dispose()

  # Balls visible through window
  $g.FillEllipse($wb, [float](36*$s), [float](40*$s), [float](9*$s), [float](9*$s))
  $g.FillEllipse($wb, [float](50*$s), [float](36*$s), [float](9*$s), [float](9*$s))
  $g.FillEllipse($wb, [float](55*$s), [float](50*$s), [float](9*$s), [float](9*$s))
  $g.FillEllipse($wb, [float](38*$s), [float](54*$s), [float](9*$s), [float](9*$s))
  $g.FillEllipse($wb, [float](46*$s), [float](58*$s), [float](9*$s), [float](9*$s))

  # Crank arm
  $g.FillRectangle($wb, [float](78*$s), [float](48*$s), [float](10*$s), [float](5*$s))
  $g.FillRectangle($wb, [float](78*$s), [float](43*$s), [float](4*$s), [float](15*$s))

  # Crank handle
  $g.FillEllipse($wb, [float](86*$s), [float](45*$s), [float](9*$s), [float](9*$s))

  # Ball coming out
  $g.FillEllipse($wb, [float](42*$s), [float](82*$s), [float](16*$s), [float](16*$s))

  $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $wb.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

$root = "C:\Users\PEPELUIS\Desktop\apps\bingo"
New-Icon 192 "$root\icon-192.png"
New-Icon 512 "$root\icon-512.png"
Write-Host "Iconos generados correctamente"
