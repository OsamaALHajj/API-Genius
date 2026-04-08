import { Router, Request, Response } from "express";
import axios from "axios";

export const proxyRouter = Router();

proxyRouter.post("/send", async (req: Request, res: Response) => {
  const { method, url, headers = {}, body, params, timeout = 30000 } = req.body;

  if (!method || !url) {
    res.status(400).json({ success: false, error: "method and url required" });
    return;
  }

  console.log(`📡 Proxy: ${method} ${url}`);
  const start = Date.now();

  try {
    const resp = await axios({
      method: method.toLowerCase(),
      url,
      headers,
      data: body,
      params,
      timeout,
      validateStatus: () => true,
    });

    const elapsed = Date.now() - start;
    let size = 0;
    try {
      size = Buffer.byteLength(JSON.stringify(resp.data), "utf-8");
    } catch {}

    res.json({
      success: true,
      data: {
        status: resp.status,
        statusText: resp.statusText,
        headers: resp.headers,
        body: resp.data,
        time: elapsed,
        size,
      },
    });
  } catch (err: any) {
    res.json({
      success: false,
      data: {
        status: 0,
        statusText: "Network Error",
        headers: {},
        body: { error: err.message },
        time: Date.now() - start,
        size: 0,
      },
      error: err.message,
    });
  }
});
