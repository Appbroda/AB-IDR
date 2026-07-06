import ironsourceService from '../services/ironsource.service.js';

async function list(req, res) {
  const { secretKey, refreshKey } = req.query;
  try {
    const adUnits = await ironsourceService.fetchAllAppbrodaAdUnits(secretKey, refreshKey);
    return res.send(adUnits);
  } catch (e) {
    return res.status(e.status || 500).json({
      success: false,
      errorMessage: e.message || e.errorMessage,
    });
  }
}

async function update(req, res) {
  const { secretKey, refreshKey } = req.body;
  try {
    const results = await ironsourceService.refreshAdUnits(secretKey, refreshKey);
    return res.status(200).send(results);
  } catch (e) {
    return res.status(e.status || 500).json({
      success: false,
      errorMessage: e.message || e.errorMessage,
    });
  }
}

export default {
  list,
  update,
};
