import codecs

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/ProductService.java', 'r', 'utf-8') as f:
    text = f.read()

new_method = """
    @Transactional
    public Design createProduct(String brand, String designCode, String name, java.math.BigDecimal baseLaborFee, String imageUrl) {
        Design product = Design.builder()
                .brand(brand)
                .designCode(designCode)
                .name(name)
                .imageUrl(imageUrl)
                .baseLaborFee(baseLaborFee)
                .isVerified(true)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        return designRepository.save(product);
    }
"""
text = text.replace('public List<Design> getAllProducts() {', new_method + '\n    public List<Design> getAllProducts() {')
with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/service/ProductService.java', 'w', 'utf-8') as f:
    f.write(text)

with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/controller/ProductAdminController.java', 'r', 'utf-8') as f:
    text2 = f.read()

new_endpoint = """
    @PostMapping
    public ResponseEntity<Design> createProduct(@RequestBody Map<String, Object> payload) {
        String brand = (String) payload.get("brand");
        String designCode = (String) payload.get("designCode");
        String name = (String) payload.get("name");
        String imageUrl = (String) payload.get("imageUrl");
        java.math.BigDecimal baseLaborFee = payload.get("baseLaborFee") != null ? new java.math.BigDecimal(payload.get("baseLaborFee").toString()) : null;
        return ResponseEntity.ok(productService.createProduct(brand, designCode, name, baseLaborFee, imageUrl));
    }
"""
text2 = text2.replace('public ResponseEntity<List<Design>> getAllProducts() {', new_endpoint + '\n    public ResponseEntity<List<Design>> getAllProducts() {')
with codecs.open('backend/src/main/java/com/minibig/karatflow/backend/controller/ProductAdminController.java', 'w', 'utf-8') as f:
    f.write(text2)
