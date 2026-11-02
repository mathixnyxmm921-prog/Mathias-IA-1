
$token = "4b9cc78a-24a2-44a4-8935-c4332767450e"

$url = "https://www.duckdns.org/update?domains=mathias123&token=$token&ip="

$respuesta = Invoke-RestMethod -Uri $url -Method Get

Write-Host "Respuesta de DuckDNS: $respuesta"

if ($respuesta -eq "OK") {
    Write-Host "¡Mathias123 está actualizado correctamente!"
}
else {
    Write-Host "No se pudo actualizar el dominio."
}