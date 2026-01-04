# Test Script for Shipment Management API
Write-Host "=== Testing Shipment Management API ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api/shipments"

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get
    Write-Host "   ✅ Server is running: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server not responding: $_" -ForegroundColor Red
    exit
}
Write-Host ""

# Test 2: List Shipments (should be empty initially)
Write-Host "2. Testing GET /api/shipments (List)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Get
    Write-Host "   ✅ List successful - Found $($response.pagination.total) shipments" -ForegroundColor Green
    Write-Host "   Data: $($response.data.Count) items" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create Shipment
Write-Host "3. Testing POST /api/shipments (Create)..." -ForegroundColor Yellow
$shipmentData = @{
    sender_name = "Jean Mbarga"
    sender_phone = "+237 6XX XXX XXX"
    receiver_name = "Paul Atangana"
    receiver_phone = "+237 6XX XXX XXX"
    description = "Electronics package"
    weight = 5.5
    declared_value = 50000
    price = 25000
    route = "Yaoundé → Douala"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $shipmentData -ContentType "application/json"
    $shipmentId = $response.data.id
    $waybillNumber = $response.data.waybill_number
    Write-Host "   ✅ Shipment created successfully!" -ForegroundColor Green
    Write-Host "   ID: $shipmentId" -ForegroundColor Gray
    Write-Host "   Waybill Number: $waybillNumber" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    $shipmentId = $null
}
Write-Host ""

if ($shipmentId) {
    # Test 4: Get Single Shipment
    Write-Host "4. Testing GET /api/shipments/$shipmentId (Get One)..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$shipmentId" -Method Get
        Write-Host "   ✅ Retrieved shipment: $($response.data.waybill_number)" -ForegroundColor Green
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test 5: Confirm Shipment
    Write-Host "5. Testing PATCH /api/shipments/$shipmentId/confirm..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$shipmentId/confirm" -Method Patch
        Write-Host "   ✅ Shipment confirmed!" -ForegroundColor Green
        Write-Host "   Status: $($response.data.status)" -ForegroundColor Gray
        Write-Host "   Is Confirmed: $($response.data.is_confirmed)" -ForegroundColor Gray
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test 6: Try to Update as Staff (should fail if confirmed)
    Write-Host "6. Testing PATCH /api/shipments/$shipmentId (Update as Staff - should fail)..." -ForegroundColor Yellow
    $updateData = @{
        price = 30000
    } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$shipmentId" -Method Patch -Body $updateData -ContentType "application/json"
        Write-Host "   ⚠️  Update succeeded (unexpected - might be admin role)" -ForegroundColor Yellow
    } catch {
        Write-Host "   ✅ Update blocked (expected for staff on confirmed shipment)" -ForegroundColor Green
    }
    Write-Host ""

    # Test 7: Generate Waybill
    Write-Host "7. Testing GET /api/shipments/$shipmentId/waybill..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$shipmentId/waybill" -Method Get
        Write-Host "   ✅ Waybill endpoint works: $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test 8: Generate Receipt
    Write-Host "8. Testing GET /api/shipments/$shipmentId/receipt..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$shipmentId/receipt" -Method Get
        Write-Host "   ✅ Receipt endpoint works: $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test 9: List with Filters
    Write-Host "9. Testing GET /api/shipments?status=confirmed..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl?status=confirmed" -Method Get
        Write-Host "   ✅ Filter by status works - Found $($response.pagination.total) confirmed shipments" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 10: Create another shipment for testing
Write-Host "10. Creating second shipment for testing..." -ForegroundColor Yellow
$shipmentData2 = @{
    sender_name = "Marie Essono"
    sender_phone = "+237 6XX XXX XXX"
    receiver_name = "Claire Nkomo"
    receiver_phone = "+237 6XX XXX XXX"
    description = "Clothing package"
    weight = 2.3
    declared_value = 30000
    price = 15000
    route = "Douala → Bafoussam"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $shipmentData2 -ContentType "application/json"
    Write-Host "   ✅ Second shipment created: $($response.data.waybill_number)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}
Write-Host ""

# Final List
Write-Host "11. Final List Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Get
    Write-Host "   ✅ Total shipments in database: $($response.pagination.total)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Cyan





