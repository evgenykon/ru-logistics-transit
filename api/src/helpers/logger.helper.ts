import pino from 'pino';

export const logger = pino(
  {
    level: 'info',
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          nginx_request_id: req.headers.nginx_request_id ?? null,
          remoteAddress: req.ip,
        };
      },
    },
  },
  pino.destination({ sync: false }),
);
