import { Router } from 'express';
import axios, { type AxiosRequestConfig, type Method } from 'axios';

export const proxyRouter = Router();

proxyRouter.post('/send', async (req, res) => {
  try {
    const {
      method,
      url,
      headers = {},
      body,
      params,
      timeout = 30000
    } = req.body;

    if (!method || !url) {
      res.status(400).json({
        success: false,
        error: 'method and url are required'
      });
      return;
    }

    const startTime = Date.now();

    const config: AxiosRequestConfig = {
      method: method.toLowerCase() as Method,
      url,
      headers,
      data: body,
      params,
      timeout,
      validateStatus: () => true, // Don't throw on any status
    };

    const response = await axios(config);
    const endTime = Date.now();

    // Calculate response size
    let responseSize = 0;
    try {
      responseSize = Buffer.byteLength(JSON.stringify(response.data), 'utf-8');
    } catch {
      responseSize = 0;
    }

    res.json({
      success: true,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        body: response.data,
        time: endTime - startTime,
        size: responseSize,
      }
    });
  } catch (error: any) {
    const endTime = Date.now();
    res.json({
      success: false,
      data: {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: { error: error.message },
        time: 0,
        size: 0,
      },
      error: error.message,
    });
  }
});
