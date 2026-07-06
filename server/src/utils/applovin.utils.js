import axios from 'axios';
import logger from '../config/logger.js';

const BASE_MAX_URL = 'https://o.applovin.com/mediation/v1';

const MAX_RETRIES = 3;
const DELAY_MS = 5000;

const getSegmentId = (adUnit) => {
  const { segment, segments } = adUnit;
  if (segment && segment.id) {
    return segment.id;
  }
  if (segments && segments.id) {
    return segments.id;
  }
  return null;
};

function extractMessageFromAppLovin(data, status) {
  return (
    (data && data.errorMessage && data.errorMessage.parameters && data.errorMessage.parameters.description) ||
    (data && data.errorMessage && data.errorMessage.parameters && data.errorMessage.parameters.message) ||
    (data && data.errorMessage && data.errorMessage.id) ||
    `Applovin Error ${status}`
  );
}

function formatError(err, defaultMsg = 'Internal Server Error') {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err.message) return err.message;
  return defaultMsg;
}

const handleAppLovinAPIError = (error) => {
  const { status, data } = error.response || {};

  if (status == 401 || status == 400 || status == 403) {
    let stringErr = 'MAX_Error: Error detected -' + extractMessageFromAppLovin(data, status);
    const errorObj = {
      status: (error.response && error.response.status) || 500,
      success: false,
      message: stringErr,
      errorMessage: stringErr,
    };
    logger.info(stringErr);
    return errorObj;
  }
  if (!error.response) {
    const fallbackErroMessage = 'Network or connectivity issue contacting AppLovin';
    return {
      status: 500,
      success: false,
      message: error.message || fallbackErroMessage,
      errorMessage: error.message || fallbackErroMessage,
    };
  }
  return {
    status: 500,
    success: false,
    message: formatError(error),
    errorMessage: formatError(error),
  };
};

async function getSegmentAdUnits({ managementKey, adUnits, isABUnits }) {
  const targetEntity = isABUnits ? 'ad_unit_experiment' : 'ad_unit';
  const segmentedAdUnits = adUnits.filter(
    (unit) => unit.segments && Array.isArray(unit.segments) && unit.segments.length > 0
  );

  const fetchPromises = segmentedAdUnits.flatMap((unit) => {
    return unit.segments.map(async (segment) => {
      try {
        const response = await axios.get(
          `${BASE_MAX_URL}/${targetEntity}/${unit.id}/${segment.id}?fields=ad_network_settings,segments`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Api-Key': managementKey,
            },
          }
        );

        return response.data ? response.data : null;
      } catch (error) {
        const err = handleAppLovinAPIError(error);
        logger.info(
          `MAX_Error: Error calling config for Segment ad unit ${unit.id}, ab_status: ${isABUnits} and segment ${
            segment.id
          }: ${JSON.stringify(err)}`
        );
        return null;
        // throw err;
      }
    });
  });

  const results = await Promise.all(fetchPromises);
  const allConfigs = results.filter((config) => config !== null);

  return allConfigs;
}

async function getWaterfallAdUnits({ managementKey }) {
  const limit = 500;
  const batchSize = 5;
  let offset = 0;
  let allUnits = [];
  let hasMore = true;

  try {
    while (hasMore) {
      logger.info(`Fetching ${batchSize} pages in parallel, starting at offset ${offset}`);

      const batchPromises = Array.from({ length: batchSize }).map((_, index) => {
        const currentOffset = offset + index * limit;
        return axios
          .get(
            `${BASE_MAX_URL}/ad_units?fields=ad_network_settings,segments&limit=${limit}&offset=${currentOffset}&disabled=false`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Api-Key': managementKey,
              },
            }
          )
          .then((res) => res.data || []);
      });

      const batchResults = await Promise.all(batchPromises);

      for (let i = 0; i < batchResults.length; i++) {
        const data = batchResults[i];
        if (!Array.isArray(data) || data.length === 0) {
          hasMore = false;
          break;
        }

        allUnits = allUnits.concat(data);

        if (data.length < limit) {
          hasMore = false;
          break;
        }
      }

      offset += limit * batchSize;
    }
    let segmentIds = [];
    segmentIds = await getSegmentAdUnits({
      managementKey,
      adUnits: allUnits,
    });
    return [...allUnits, ...segmentIds];
  } catch (error) {
    const err = handleAppLovinAPIError(error);
    logger.info(`MAX_Error: Error detected while calling getWaterfallAdUnits ${JSON.stringify(err)}`);
    throw err;
  }
}

async function getABAdUnitById({ managementKey, id }) {
  try {
    const response = await axios.get(`${BASE_MAX_URL}/ad_unit_experiment/${id}?fields=ad_network_settings,segments`, {
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': managementKey,
      },
    });
    return response.data;
  } catch (error) {
    const { data: errData } = error.response || {};
    const errorMessage =
      (errData && errData.errorMessage && errData.errorMessage.parameters && errData.errorMessage.parameters.message) || '';
    /* MAX API have some out of sync issues where 
       we have seen a case where although adunits had "has_active_experiment": true,
       still when queried for the ad unit experiment it was throwing error.
       https://appbroda.slack.com/archives/C04GGRJQTLK/p1764321389134499
       There is no fixed solution to this problem as this is issue from MAX end. So for time being
       if MAX inform us that there are no active ad unit experiment we will silently allow the system
       to proceed
    */
    if (errorMessage.startsWith('There are no active Ad Unit Experiments associated')) {
      return null;
    }
    const err = handleAppLovinAPIError(error);
    logger.info(`MAX_Error: Error detected while calling getABAdUnitById ${JSON.stringify(err)}`);
    throw err;
  }
}

async function updateWaterfallAdUnit({ managementKey, id, payload }) {
  const requestURL = getSegmentId(payload)
    ? `${BASE_MAX_URL}/ad_unit/${id}/${getSegmentId(payload)}`
    : `${BASE_MAX_URL}/ad_unit/${id}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(requestURL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': managementKey,
        },
      });

      return { success: true, data: response.data };
    } catch (error) {
      const err = handleAppLovinAPIError(error);
      const isLastAttempt = attempt === MAX_RETRIES;

      logger.info(
        `MAX_Error: Error detected while calling updateWaterfallAdUnit (Attempt ${attempt}/${MAX_RETRIES}). Details: ${JSON.stringify(
          err
        )}`
      );

      if (isLastAttempt) {
        return err;
      }
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
}

async function updateABAdUnit({ managementKey, id, payload }) {
  const requestURL = getSegmentId(payload)
    ? `${BASE_MAX_URL}/ad_unit_experiment/${id}/${getSegmentId(payload)}`
    : `${BASE_MAX_URL}/ad_unit_experiment/${id}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(requestURL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': managementKey,
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      const err = handleAppLovinAPIError(error);
      const isLastAttempt = attempt === MAX_RETRIES;

      logger.info(
        `MAX_Error: Error detected while calling updateABAdUnit (Attempt ${attempt}/${MAX_RETRIES}). Details: ${JSON.stringify(
          err
        )}`
      );
      if (isLastAttempt) {
        return err;
      }
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
}

async function getABAdUnits({ managementKey, waterfallAdUnits = [] }) {
  try {
    const fetchPromises = waterfallAdUnits.map(async (adUnit) => {
      const { has_active_experiment, id } = adUnit;

      if (!has_active_experiment) {
        return [];
      }

      const resultsForThisUnit = [];
      const abAdUnit = await getABAdUnitById({ managementKey, id });

      if (abAdUnit) {
        resultsForThisUnit.push(abAdUnit);

        const segmentIdsFromParent = await getSegmentAdUnits({
          managementKey,
          adUnits: [adUnit],
          isABUnits: true,
        });
        const segementAdUnits = await getSegmentAdUnits({
          managementKey,
          adUnits: [abAdUnit],
          isABUnits: true,
        });

        if (segmentIdsFromParent && segmentIdsFromParent.length) {
          resultsForThisUnit.push(...segmentIdsFromParent);
        }

        if (segementAdUnits && segementAdUnits.length) {
          resultsForThisUnit.push(...segementAdUnits);
        }
      }
      return resultsForThisUnit;
    });

    const nestedAdUnits = await Promise.all(fetchPromises);

    return nestedAdUnits.flat();
  } catch (error) {
    const err = handleAppLovinAPIError(error);
    logger.info(`MAX_Error: Error detected while calling getABAdUnits ${JSON.stringify(err)}`);
    throw err;
  }
}

export { getWaterfallAdUnits, getSegmentId, getABAdUnitById, getABAdUnits, updateWaterfallAdUnit, updateABAdUnit };
