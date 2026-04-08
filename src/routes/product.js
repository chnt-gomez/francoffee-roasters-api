const { Router } = require ('express');
const { getAllProducts, postDetails } = require('../controllers/products/product.controller');

const router = Router();

router.get('/', getAllProducts);
router.post('/', postDetails);

module.exports = router;