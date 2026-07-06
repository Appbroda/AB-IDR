import ironsourceUtils from '../utils/ironsource.utils.js';

const getCurrentAndNewUnitId = (instanceConfig1) => {
  const match = instanceConfig1.match(/(.+)_v(\d+)$/);

  if (match) {
    const base = match[1];
    const version = parseInt(match[2], 10);

    return {
      current: instanceConfig1,
      new: `${base}_v${version + 1}`,
    };
  }

  return {
    current: instanceConfig1,
    new: instanceConfig1,
  };
};

async function fetchAllAppbrodaAdUnits(secretKey, refreshToken) {
  const appKeys = process.env.IRONSOURCE_APP_KEYS?.split(',').map((key) => key.trim());

  if (!appKeys || appKeys.length === 0) {
    throw new Error('No IronSource app keys configured. You can configure them using IRONSOURCE_APP_KEYS in env');
  }

  const bearerToken = await ironsourceUtils.getAccessToken(secretKey, refreshToken);

  const results = await Promise.all(
    appKeys.map(async (appKey) => {
      const instances = await ironsourceUtils.listInstances(appKey, bearerToken);

      return {
        appKey,
        instances: instances.map((instance) => ({
          ...instance,
          ...getCurrentAndNewUnitId(instance.instanceConfig1),
        })),
      };
    })
  );

  const hasAnyInstances = results.some(({ instances }) => instances.length > 0);

  if (!hasAnyInstances) {
    throw new Error('No valid instances found for any configured app key');
  }

  return results;
}

async function refreshAdUnits(secretKey, refreshToken) {
  const appKeys = process.env.IRONSOURCE_APP_KEYS?.split(',').map((key) => key.trim());

  if (!appKeys || appKeys.length === 0) {
    throw new Error('No IronSource app keys configured.');
  }

  const bearerToken = await ironsourceUtils.getAccessToken(secretKey, refreshToken);
  // Fetch instances for every configured app
  const instancesResults = await Promise.all(
    appKeys.map(async (appKey) => {
      const instances = await ironsourceUtils.listInstances(appKey, bearerToken);

      return {
        appKey,
        instances,
      };
    })
  );

  const results = [];

  const updatePromises = instancesResults
    .map(({ appKey, instances }) => {
      const updates = instances.map(({ instanceId, instanceConfig1, rate }) => {
        const { current, new: newInstanceConfig1 } = getCurrentAndNewUnitId(instanceConfig1);

        return {
          instanceId,
          instanceConfig1: newInstanceConfig1,
          rate,
          current,
        };
      });

      if (!updates.length) return null;

      return ironsourceUtils.updateInstanceConfig(appKey, bearerToken, updates, results);
    })
    .filter(Boolean);

  await Promise.all(updatePromises);

  return results;
}

export default {
  fetchAllAppbrodaAdUnits,
  refreshAdUnits,
};
