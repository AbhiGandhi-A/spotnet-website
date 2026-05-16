import { ServerResponse } from 'http';

export function apiError(res: ServerResponse & { status: (code: number) => any }, error: any, status = 500) {
  return res.status(status).json({ success: false, error: error?.message || error });
}
