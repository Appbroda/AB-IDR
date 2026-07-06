import axios from 'axios';
import { ACCOUNT_NETWORK_CODES } from './const.js';
import logger from '../config/logger.js';

const authUrl = 'https://platform.ironsrc.com/partners/publisher/auth';
const baseInstanceUrl = 'https://platform.ironsrc.com/levelPlay/network/instances/v4/';

/**
 * Get Bearer token using secretKey and refreshToken
 */
async function getAccessToken(secretKey, refreshToken) {
  try {
    const response = await axios.get(authUrl, {
      headers: {
        secretKey,
        refreshToken,
      },
    });
    // Bearer token
    return response.data;
  } catch (error) {
    logger.error('Error getting access token:', error.message);
    throw error;
  }
}

/**
 * List instanceId, instanceConfig1, and rate for a given appKey
 */
async function listInstances(appKey, bearerToken) {
  const url = baseInstanceUrl + appKey;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    const instances = response.data;

    // filter data to include only appbroda ad units
    const filtered = instances
      .filter(
        ({ instanceConfig1 }) =>
          instanceConfig1 &&
          Object.values(ACCOUNT_NETWORK_CODES).some((pattern) => instanceConfig1.startsWith(`/${pattern}`)) &&
          /_v\d+$/.test(instanceConfig1)
      )
      .map(({ instanceId, instanceName, adUnit, adFormat, instanceConfig1, rate }) => ({
        instanceId,
        instanceName,
        adUnit,
        adFormat,
        instanceConfig1,
        rate,
      }));
    logger.info(filtered);
    return filtered;
  } catch (error) {
    logger.error('Error listing instances:', error.message);
    throw error;
  }
}

/**
 * Update instanceConfig1 for one or more instances
 * Requires: instanceId, instanceConfig1, and rate
 */
async function updateInstanceConfig(appKey, bearerToken, updates, results) {
  const url = baseInstanceUrl + appKey;
  const validPayload = updates.filter((item) => item.instanceId && item.rate && item.instanceConfig1);

  if (validPayload.length === 0) {
    throw new Error('Each update item must include instanceId, instanceConfig1, and rate.');
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await axios.put(url, validPayload, {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      results.push({
        isSuccess: true,
        previousValue: `${appKey}`,
        nextValue: '-',
      });

      updates.forEach((item) => {
        results.push({
          isSuccess: true,
          previousValue: item.current,
          nextValue: item.instanceConfig1,
        });
      });

      return;
    } catch (error) {
      logger.info(
        JSON.stringify({
          message: 'Error updating instance config:',
          details: error.message,
          attempt,
        })
      );
      if (attempt === 2) {
        // attach appKey
        results.push({
          isSuccess: false,
          previousValue: `${appKey}`,
          nextValue: '-',
        });

        updates.forEach((item) => {
          results.push({
            isSuccess: false,
            previousValue: item.current,
            nextValue: item.instanceConfig1,
          });
        });
        logger.info(
          JSON.stringify({
            message: 'FINAL Error updating instance config:',
            details: error.message,
            attempt,
          })
        );
      }
    }
  }
}

export default {
  getAccessToken,
  listInstances,
  updateInstanceConfig,
};
