import applovinService from '../services/applovin.service.js';

async function list(req, res) {
  const { managementKey } = req.query;
  try {
    const adUnits = await applovinService.getMaxAdUnits(managementKey);
    return res.send(adUnits);
  } catch (e) {
    res.status(e.status || 500).json({
      success: false,
      errorMessage: e.message || e.errorMessage,
    });
  }
}

async function update(req, res) {
  const { managementKey } = req.body;
  try {
    const results = await applovinService.updateMaxAdUnits(managementKey);
    return res.status(200).send(results);
  } catch (e) {
    res.status(e.status || 500).json({
      success: false,
      errorMessage: e.message || e.errorMessage,
    });
  }
}

export default {
  list,
  update,
};
