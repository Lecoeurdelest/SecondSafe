export function makeNetworkConfig(apiOrigin, socketOrigin = apiOrigin) {
  const origin = apiOrigin.replace(/\/+$/, '');
  return Object.freeze({ API_ORIGIN: origin, API_BASE_URL: `${origin}/api`, SOCKET_URL: socketOrigin.replace(/\/+$/, '') });
}

const apiOrigin = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const NETWORK_CONFIG = makeNetworkConfig(apiOrigin, process.env.REACT_APP_SOCKET_URL || apiOrigin);
export default NETWORK_CONFIG;
