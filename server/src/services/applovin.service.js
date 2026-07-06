import _ from 'lodash';
import logger from '../config/logger.js';

import {
  getWaterfallAdUnits,
  getABAdUnits,
  updateWaterfallAdUnit,
  updateABAdUnit,
  getSegmentId,
} from '../utils/applovin.utils.js';
import { ACCOUNT_NETWORK_CODES } from '../utils/const.js';

const supportedNetworks = ['GOOGLE_AD_MANAGER_NETWORK', 'GOOGLE_AD_MANAGER_NATIVE_NETWORK'];

function nextVersionId(idString) {
  const match = idString.match(/_v(\d+)$/i);
  if (!match) return idString;
  const current = parseInt(match[1], 10);
  if (isNaN(current)) return idString;
  return idString.replace(/_v\d+$/i, '_v' + (current + 1));
}

const generateNextVersionsForAdUnit = (maxAdUnits) => {
  // just to store units for client side
  let clientResponseUnits = {};
  // for actual API call . keeping in same loop so the process is replicated exactly the same
  let eligibleMAXUnits = [];
  // loop through each of the MAX ad units
  for (const maxAdUnit of maxAdUnits) {
    const { ad_network_settings, disabled } = maxAdUnit;
    let deepClonedMAXUnit = _.cloneDeep(maxAdUnit);
    // we will popluate this later when eligible units will be found
    delete deepClonedMAXUnit.ad_network_settings;
    const adUnitsNeedToBeUpdated = [];

    // check if MAX unit have ad_network_settings with google netweork
    if (ad_network_settings && ad_network_settings.length && !disabled) {
      // loop through each setting and look for google ad network
      for (let i = 0; i < ad_network_settings.length; i += 1) {
        const networkSetting = ad_network_settings[i];

        for (const networkName of supportedNetworks) {
          const network = networkSetting[networkName];
          if (!network || network.disabled || !network.ad_network_ad_units || !network.ad_network_ad_units.length) {
            continue;
          }

          const adUnits = network.ad_network_ad_units;
          for (let j = 0; j < adUnits.length; j++) {
            const adUnit = adUnits[j];
            const adUnitId = adUnit.ad_network_ad_unit_id;
            // get request is giving CPM value but not allowing to set it.
            const cpm = adUnit.cpm;
            if (cpm == null) {
              delete adUnits[j].cpm;
            }
            // if unit matches the appbroda pattern
            if (
              adUnitId &&
              Object.values(ACCOUNT_NETWORK_CODES).some((pattern) => adUnitId.startsWith(`/${pattern}`)) &&
              !adUnit.disabled
            ) {
              // update unit if version number is of valid format
              const newId = nextVersionId(adUnitId);
              if (newId !== adUnitId) {
                adUnits[j].ad_network_ad_unit_id = newId;
                adUnitsNeedToBeUpdated.push({ prevId: adUnitId, newId });
              }
            }
          }
        }
      }
    }
    // if eligible unit are found push itt in the array for update
    if (adUnitsNeedToBeUpdated.length) {
      deepClonedMAXUnit.adUnits = adUnitsNeedToBeUpdated;
      eligibleMAXUnits.push(maxAdUnit);
      const idForClient = getSegmentId(maxAdUnit) ? `${maxAdUnit.id}/${getSegmentId(maxAdUnit)}` : `${maxAdUnit.id}`;
      clientResponseUnits[idForClient] = deepClonedMAXUnit;
    }
  }
  return { clientResponseUnits, eligibleMAXUnits };
};

const getMaxAdUnits = async (managementKey) => {
  const waterfallAdUnits = await getWaterfallAdUnits({
    managementKey,
  });
  const scannedLength = waterfallAdUnits && waterfallAdUnits.length;
  const abAdUnits = await getABAdUnits({
    managementKey,
    waterfallAdUnits,
  });
  const { clientResponseUnits: waterfallAdUnitsClient } = generateNextVersionsForAdUnit(waterfallAdUnits);
  const { clientResponseUnits: abAdUnitsClient } = generateNextVersionsForAdUnit(abAdUnits);

  let waterfallUnits = Object.values(waterfallAdUnitsClient);
  let abUnits = Object.values(abAdUnitsClient);
  if ((!waterfallUnits || !waterfallUnits.length) && (!abUnits || !abUnits.length)) {
    throw new Error('No Units found matching the pattern');
  }

  waterfallUnits.forEach((adUnit) => {
    const idForClient = getSegmentId(adUnit) ? `${adUnit.id}/${getSegmentId(adUnit)}` : `${adUnit.id}`;
    adUnit.id = idForClient;
  });

  abUnits.forEach((adUnit) => {
    const idForClient = getSegmentId(adUnit) ? `${adUnit.id}/${getSegmentId(adUnit)}` : `${adUnit.id}`;
    adUnit.id = idForClient;
  });
  return {
    waterfallUnits: waterfallUnits,
    abUnits: abUnits,
  };
};

const updateMaxAdUnits = async (managementKey) => {
  const waterfallAdUnits = await getWaterfallAdUnits({
    managementKey,
  });

  const abAdUnits = await getABAdUnits({
    managementKey,
    waterfallAdUnits,
  });
  const { clientResponseUnits: waterfallAdUnitsClient, eligibleMAXUnits: waterfallAdUnitsServer } =
    generateNextVersionsForAdUnit(waterfallAdUnits);

  const { clientResponseUnits: abAdUnitsClient, eligibleMAXUnits: abAdUnitsServer } =
    generateNextVersionsForAdUnit(abAdUnits);

  // start updating waterfall units
  for (const maxAdUnit of waterfallAdUnitsServer) {
    const maxAdUnitId = maxAdUnit.id;
    const idForClient = getSegmentId(maxAdUnit) ? `${maxAdUnit.id}/${getSegmentId(maxAdUnit)}` : `${maxAdUnit.id}`;
    const response = await updateWaterfallAdUnit({
      managementKey,
      id: maxAdUnitId,
      payload: maxAdUnit,
    });
    if (response.success) {
      logger.info(`Refreshed Waterfall units for  for MAX Ad unit Id ${idForClient}`);
      waterfallAdUnitsClient[idForClient].status = {
        success: true,
      };
    } else {
      logger.info(`MAX_Error: Error Updating Waterfall ad unit ${idForClient} with error ${JSON.stringify(response)}`);
      waterfallAdUnitsClient[idForClient].status = response;
    }
  }
  // start updating AB units
  for (const maxAdUnit of abAdUnitsServer) {
    const maxAdUnitId = maxAdUnit.id;
    const idForClient = getSegmentId(maxAdUnit) ? `${maxAdUnit.id}/${getSegmentId(maxAdUnit)}` : `${maxAdUnit.id}`;
    const response = await updateABAdUnit({
      managementKey,
      id: maxAdUnitId,
      payload: maxAdUnit,
    });
    if (response.success) {
      logger.info(`Refreshed AB units for MAX Ad unit Id ${idForClient}`);
      abAdUnitsClient[idForClient].status = {
        success: true,
      };
    } else {
      logger.info(`MAX_Error: Error Updating AB ad unit ${idForClient} with error ${JSON.stringify(response)}`);
      abAdUnitsClient[idForClient].status = response;
    }
  }

  let waterfallUnits = Object.values(waterfallAdUnitsClient);
  let abUnits = Object.values(abAdUnitsClient);

  waterfallUnits.forEach((adUnit) => {
    const idForClient = getSegmentId(adUnit) ? `${adUnit.id}/${getSegmentId(adUnit)}` : `${adUnit.id}`;
    adUnit.id = idForClient;
  });

  abUnits.forEach((adUnit) => {
    const idForClient = getSegmentId(adUnit) ? `${adUnit.id}/${getSegmentId(adUnit)}` : `${adUnit.id}`;
    adUnit.id = idForClient;
  });

  waterfallUnits = waterfallUnits.filter((adUnit) => {
    return !getSegmentId(adUnit);
  });

  abUnits = abUnits.filter((adUnit) => {
    return !getSegmentId(adUnit);
  });
  return {
    waterfallUnits: waterfallUnits,
    abUnits: abUnits,
  };
};

export default {
  getMaxAdUnits,
  updateMaxAdUnits,
};
