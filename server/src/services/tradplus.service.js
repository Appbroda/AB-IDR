import _ from 'lodash';
import logger from '../config/logger.js';

import { getAppbrodaAdUnits, updateAppbrodaAdUnits } from '../utils/tradplus.utils.js';
import { ACCOUNT_NETWORK_CODES } from '../utils/const.js';

function nextVersionId(idString) {
  const match = idString.match(/_v(\d+)$/i);
  if (!match) return idString;
  const current = parseInt(match[1], 10);
  if (isNaN(current)) return idString;
  return idString.replace(/_v\d+$/i, '_v' + (current + 1));
}

const generateNextVersionsForTradPlus = (adUnits) => {
  let clientResponseUnits = {};
  let eligibleUpdates = [];

  for (const adUnit of adUnits) {
    const { id, placementId } = adUnit;

    if (!placementId) continue;
    const isAppbrodaPattern = Object.values(ACCOUNT_NETWORK_CODES).some((pattern) => placementId.includes(`/${pattern}`));

    if (isAppbrodaPattern) {
      const newId = nextVersionId(placementId);
      if (newId !== placementId) {
        eligibleUpdates.push({ id, placementId: newId });
        clientResponseUnits[id] = {
          id,
          adUnits: [{ prevId: placementId, newId }],
        };
      }
    }
  }
  return { clientResponseUnits, eligibleUpdates };
};

const getTradPlusAdUnits = async (bearKey, secretKey, app_uuid = null) => {
  const adUnits = await getAppbrodaAdUnits({
    bearKey,
    secretKey,
    app_uuid,
  });

  const { clientResponseUnits } = generateNextVersionsForTradPlus(adUnits);
  const unitsToSend = Object.values(clientResponseUnits);
  if (!unitsToSend || !unitsToSend.length) {
    throw new Error('No Units found matching the pattern');
  }
  return {
    units: unitsToSend,
  };
};

const updateTradPlusAdUnits = async (bearKey, secretKey, app_uuid = null) => {
  const adUnits = await getAppbrodaAdUnits({
    bearKey,
    secretKey,
    app_uuid,
  });

  const { clientResponseUnits, eligibleUpdates } = generateNextVersionsForTradPlus(adUnits);

  if (eligibleUpdates.length > 0) {
    try {
      const response = await updateAppbrodaAdUnits({
        bearKey,
        secretKey,
        updates: eligibleUpdates,
      });

      if (response.success) {
        logger.info(`TradPlus: Successfully updated ${response.updatedList.length} AppBroda PIDs`);

        eligibleUpdates.forEach((unit) => {
          if (clientResponseUnits[unit.id]) {
            clientResponseUnits[unit.id].status = { success: true };
          }
        });
      }
    } catch (error) {
      logger.info(`TradPlus_Error: Bulk update failed with error ${JSON.stringify(error)}`);

      eligibleUpdates.forEach((unit) => {
        if (clientResponseUnits[unit.id]) {
          clientResponseUnits[unit.id].status = error;
        }
      });
    }
  } else {
    logger.info('TradPlus: No eligible AppBroda PIDs found for version increment.');
  }
  return {
    units: Object.values(clientResponseUnits),
  };
};

export default {
  getTradPlusAdUnits,
  updateTradPlusAdUnits,
};
