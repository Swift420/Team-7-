import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { liquidRouter } from '../src/routes/liquidRoutes.js';
import type { Request, Response } from 'express';

// Helper to simulate an Express Request and Response synchronously/asynchronously
function mockRequestResponse(method: string, path: string, body: any = {}, params: any = {}, query: any = {}) {
  const req = {
    method,
    path,
    url: path,
    body,
    params,
    query,
    headers: {},
  } as unknown as Request;

  let statusCode = 200;
  let responseData: any = null;
  let responseHeaders: Record<string, string> = {};

  let resolvePromise: (val: { status: number; body: any; headers: Record<string, string> }) => void;
  const promise = new Promise<{ status: number; body: any; headers: Record<string, string> }>((resolve) => {
    resolvePromise = resolve;
  });

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      responseHeaders[name.toLowerCase()] = value;
      return this;
    },
    json(data: any) {
      responseData = data;
      resolvePromise({ status: statusCode, body: responseData, headers: responseHeaders });
      return this;
    },
    send(data: any) {
      responseData = data;
      resolvePromise({ status: statusCode, body: responseData, headers: responseHeaders });
      return this;
    },
  } as unknown as Response;

  return { req, res, response: promise };
}

// Find route handler in liquidRouter stack
function getHandler(method: string, path: string) {
  const layer = liquidRouter.stack.find(
    (s: any) => s.route && s.route.path === path && s.route.methods[method.toLowerCase()]
  );
  if (!layer) {
    throw new Error(`Handler not found for ${method} ${path}`);
  }
  return layer.route.stack[0].handle;
}

describe('Liquid Story Engine API Route Handlers (Socket-Free)', () => {
  it('GET /articles lists available sample articles', async () => {
    const handler = getHandler('GET', '/articles');
    const { req, res, response } = mockRequestResponse('GET', '/articles');
    handler(req, res, () => {});
    const result = await response;

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(Array.isArray(result.body.articles));
    assert.ok(result.body.articles.length > 0);
  });

  it('GET /articles/:id fetches specific article with body', async () => {
    const handler = getHandler('GET', '/articles/:id');
    const { req, res, response } = mockRequestResponse('GET', '/articles/1886544', {}, { id: '1886544' });
    handler(req, res, () => {});
    const result = await response;

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.article.headline);
    assert.ok(result.body.article.body.length > 50);
  });

  it('POST /generate creates 6 valid liquid formats', async () => {
    const handler = getHandler('POST', '/generate');
    const { req, res, response } = mockRequestResponse('POST', '/generate', {
      articleId: 'ld.1886544',
      model: 'gemini-3.8-flash',
      mock: true,
    });
    handler(req, res, () => {});
    const result = await response;

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.data.audioBrief);
    assert.equal(result.body.data.executiveNewsletter.bullets.length, 3);
    assert.equal(result.body.data.socialStoryboard.scenes.length, 5);
    assert.equal(result.body.data.instagramCarousel.slides.length, 7);
  });

  it('POST /synthesize-audio returns mp3 stream info', async () => {
    const handler = getHandler('POST', '/synthesize-audio');
    const { req, res, response } = mockRequestResponse('POST', '/synthesize-audio', {
      script: 'In Berlin droht der finanzielle Kollaps. Kurzer Test.',
      author: 'Malte Fischer',
      mock: true,
    });
    handler(req, res, () => {});
    const result = await response;

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.data.audioUrl.endsWith('.mp3'));
    assert.equal(result.body.data.format, 'mp3');
  });

  it('POST /lint reports NZZ style compliance', async () => {
    const handler = getHandler('POST', '/lint');
    const { req, res, response } = mockRequestResponse('POST', '/lint', {
      text: 'Der Bundesrat sagt: "Krise droht".',
      isHeadline: true,
    });
    handler(req, res, () => {});
    const result = await response;

    assert.equal(result.status, 200);
    assert.equal(result.body.data.hasErrors, true);
    assert.ok(result.body.data.errors.some((e: string) => e.includes('Swiss guillemets')));
  });

  it('POST /publish stores payload and GET /published/:articleId retrieves it', async () => {
    const pubHandler = getHandler('POST', '/publish');
    const { req: pReq, res: pRes, response: pResp } = mockRequestResponse('POST', '/publish', {
      articleId: 'test-article-777',
      payload: { articleId: 'test-article-777', note: 'Ready for reader' },
    });
    pubHandler(pReq, pRes, () => {});
    const pResult = await pResp;
    assert.equal(pResult.status, 200);

    const getHandlerFn = getHandler('GET', '/published/:articleId');
    const { req: gReq, res: gRes, response: gResp } = mockRequestResponse(
      'GET',
      '/published/test-article-777',
      {},
      { articleId: 'test-article-777' }
    );
    getHandlerFn(gReq, gRes, () => {});
    const gResult = await gResp;
    assert.equal(gResult.status, 200);
    assert.equal(gResult.body.data.articleId, 'test-article-777');
  });
});

