import { setCors } from './_weather.js';

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.json({ status: 'API is running', modules: 10 });
}
