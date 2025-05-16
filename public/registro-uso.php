<?php
// Permitir CORS si es necesario
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "No data"]);
    exit;
}

$csvFile = __DIR__ . "/uso-etiquetas.csv";
$first = !file_exists($csvFile);

$fp = fopen($csvFile, "a");
if ($first) {
    fputcsv($fp, ["Accion", "Provincia", "CantidadProductos", "Fecha", "Hora", "UserAgent"]);
}
fputcsv($fp, [
    $data["accion"] ?? "",
    $data["provincia"] ?? "",
    $data["cantidad"] ?? "",
    $data["fecha"] ?? "",
    $data["hora"] ?? "",
    $data["userAgent"] ?? "",
]);
fclose($fp);

echo json_encode(["ok" => true]);
