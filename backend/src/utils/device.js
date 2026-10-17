import { UAParser } from 'ua-parser-js';

export function parseDevice(userAgent = '', ipAddress = '') {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  const browser = [result.browser.name, result.browser.version].filter(Boolean).join(' ');
  const os = [result.os.name, result.os.version].filter(Boolean).join(' ');
  const deviceType = result.device.type || 'desktop';
  const deviceName = [result.device.vendor, result.device.model].filter(Boolean).join(' ')
    || `${deviceType.charAt(0).toUpperCase()}${deviceType.slice(1)}`;

  return {
    browser: browser || 'Unknown browser',
    os: os || 'Unknown OS',
    deviceName: deviceName || 'Unknown device',
    ipAddress: ipAddress || 'Unknown',
    userAgent: userAgent || '',
  };
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
}
