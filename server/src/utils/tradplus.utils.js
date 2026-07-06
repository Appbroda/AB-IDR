import axios from 'axios';
import crypto from 'crypto';
import logger from '../config/logger.js';

const BASE_TRADPLUS_URL = 'https://openapi.tradplusad.com';
const MAX_RETRIES = 3;
const DELAY_MS = 5000;
const APPBRODA_ADSOURCE_ID = 84;

function extractMessageFromTradPlus(data, status) {
  if (data && data.error_message) return data.error_message;
  if (data && typeof data === 'string') return data;
  return `TradPlus Error ${status}`;
}

function formatError(err, defaultMsg = 'Internal Server Error') {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err.message) return err.message;
  return defaultMsg;
}

const handleTradPlusAPIError = (error) => {
  const { status, data } = error.response || {};

  if (status >= 400 && status < 500) {
    let stringErr = 'TradPlus_Error: Error detected - ' + extractMessageFromTradPlus(data, status);
    const errorObj = {
      status: status || 500,
      success: false,
      message: stringErr,
      errorMessage: stringErr,
    };
    logger.info(stringErr);
    return errorObj;
  }

  if (!error.response) {
    const fallbackErrorMessage = 'Network or connectivity issue contacting TradPlus';
    return {
      status: 500,
      success: false,
      message: error.message || fallbackErrorMessage,
      errorMessage: error.message || fallbackErrorMessage,
    };
  }

  return {
    status: 500,
    success: false,
    message: formatError(error),
    errorMessage: formatError(error),
  };
};

function generateAuthParams(secret, path) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(8).toString('hex');
  const signStr = secret + timestamp + nonce + path;
  const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return { timestamp, nonce, sign };
}

async function getAppbrodaAdUnits({ bearKey, secretKey, app_uuid = null, adseat_uuid = null }) {
  const path = '/api/Placement/partner_pid_list';
  const limit = 100;
  let page = 1;
  let allUnits = [];
  let hasMore = true;

  try {
    while (hasMore) {
      logger.info(`Fetching TradPlus AppBroda units: Page ${page}`);

      const { timestamp, nonce, sign } = generateAuthParams(secretKey, path);
      const requestURL = `${BASE_TRADPLUS_URL}${path}?sign=${sign}&timestamp=${timestamp}&nonce=${nonce}`;

      const payload = {
        adsource_id: APPBRODA_ADSOURCE_ID,
        page,
        limit,
      };

      if (app_uuid) payload.app_uuid = app_uuid;
      if (adseat_uuid) payload.adseat_uuid = adseat_uuid;

      const response = await axios.post(requestURL, payload, {
        headers: {
          'Content-Type': 'application/json',
          bear: bearKey,
        },
      });

      const data = response.data;

      if (data && data.status === 0 && data.data) {
        const { list, has_more } = data.data;

        if (Array.isArray(list)) {
          allUnits = allUnits.concat(list);
        }

        hasMore = has_more === 1;
        page++;
      } else {
        throw new Error(data.error_message || 'Unexpected response format from TradPlus');
      }
    }
    return allUnits;
  } catch (error) {
    const err = handleTradPlusAPIError(error);
    logger.info(`TradPlus_Error: Error detected while calling getAppbrodaAdUnits ${JSON.stringify(err)}`);
    throw err;
  }
}

async function updateAppbrodaAdUnits({ bearKey, secretKey, updates }) {
  const path = '/api/Placement/partner_pid_update';
  const chunkSize = 100;
  const results = [];

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const payload = { list: chunk };

    let successForChunk = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { timestamp, nonce, sign } = generateAuthParams(secretKey, path);
        const requestURL = `${BASE_TRADPLUS_URL}${path}?sign=${sign}&timestamp=${timestamp}&nonce=${nonce}`;
        const response = await axios.post(requestURL, payload, {
          headers: {
            'Content-Type': 'application/json',
            bear: bearKey,
          },
        });
        const data = response.data;
        if (data && data.status === 0) {
          results.push(...(data.data.list || []));
          successForChunk = true;
          break;
        } else {
          throw new Error(data.error_message || 'Update failed');
        }
      } catch (error) {
        const err = handleTradPlusAPIError(error);
        const isLastAttempt = attempt === MAX_RETRIES;
        logger.info(
          `TradPlus_Error: Error updating chunk (Attempt ${attempt}/${MAX_RETRIES}). Details: ${JSON.stringify(err)}`
        );

        if (isLastAttempt) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    if (!successForChunk) {
      logger.info(`TradPlus_Error: Failed to update chunk after ${MAX_RETRIES} attempts.`);
    }
  }

  return { success: true, updatedList: results };
}

export { getAppbrodaAdUnits, updateAppbrodaAdUnits };
