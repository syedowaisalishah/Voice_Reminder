const router = require('express').Router();

router.get('/', (req, res) => {
  return res.json({ status: 'ok', service: 'backend-api' });
});

module.exports = router;
