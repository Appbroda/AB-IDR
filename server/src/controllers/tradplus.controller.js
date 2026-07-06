import tradplusService from '../services/tradplus.service.js';

async function list(req, res) {
  const { bearKey, secretKey, app_uuid } = req.query;
  try {
    const adUnits = await tradplusService.getTradPlusAdUnits(bearKey, secretKey, app_uuid);
    return res.status(200).send(adUnits);
  } catch (e) {
    res.status(e.status || 500).json({
      success: false,
      errorMessage: e.message || e.errorMessage || 'Internal Server Error',
    });
  }
}

async function update(req, res) {
  const { bearKey, secretKey, app_uuid } = req.body;
  try {
    const results = await tradplusService.updateTradPlusAdUnits(bearKey, secretKey, app_uuid);
    return res.status(200).send(results);
  } catch (e) {
    res.status(e.status || 500).json({
      success: false,
      errorMessage: e.message || e.errorMessage || 'Internal Server Error',
    });
  }
}

export default {
  list,
  update,
};
