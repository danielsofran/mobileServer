import {generateMagazin, Item} from './model.js';
import Router from "koa-router";
import {Service} from "./service";

const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');

app.use(bodyparser());
app.use(cors());

app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { issue: [{ error: err.message || 'Unexpected error' }] };
    ctx.response.status = 500;
  }
});

const broadcast = data =>
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });

const router = new Router();
const service = new Service();

const MAGAZINE_URL = '/magazine';

router.get(MAGAZINE_URL, ctx => {
  ctx.response.body = service.get();
  // ctx.response.set('Last-Modified', service.lastUpdated.toUTCString());
  ctx.response.status = 200;
})

router.get(`${MAGAZINE_URL}/:id`, ctx => {
  const itemId = ctx.params.id;
  const item = service.getById(itemId);
  console.warn(item)
  if (item) {
    ctx.response.body = item;
    ctx.response.status = 200;
  } else {
    ctx.response.body = { issue: [{ warning: `item with id ${itemId} not found` }] };
    ctx.response.status = 404;
  }
})

router.post(`${MAGAZINE_URL}`, ctx => {
  const data = ctx.request.body;
  const item = new Item(data);
  if(!item.date) {
    item.date = new Date();
  }
  try { item.validate(); }
  catch (e) {
    console.warn(e)
    ctx.response.body = { issue: e.errors };
    ctx.response.status = 400;
    return;
  }
  console.warn("save")
  service.save(item);
  ctx.response.body = item;
  ctx.response.status = 201;
  broadcast({ event: 'created', payload: { item } });
})

router.put(`${MAGAZINE_URL}/:id`, ctx => {
  const id = ctx.params.id;
  const item = new Item(ctx.request.body)
  item.date = new Date();
  const itemId = item.id;
  if (itemId && id != item.id) {
    ctx.response.body = { issue: [{ error: `Param id and body id should be the same` }] };
    ctx.response.status = 400;
    return;
  }
  if (!itemId) {
    service.save(item);
    ctx.response.body = item;
    ctx.response.status = 201;
    return;
  }
  // find item
  let storedItem = service.getById(id);
  if (!storedItem) {
    ctx.response.body = { issue: [{ error: `item with id ${id} not found` }] };
    ctx.response.status = 400;
    return;
  }
  // update item
  try { item.validate(); }
  catch (e) {
    ctx.response.body = { issue: e.errors };
    ctx.response.status = 400;
    return;
  }
  service.update(id, item);
  ctx.response.body = item;
  ctx.response.status = 200;
  broadcast({ event: 'updated', payload: { item } });
})

router.del(`${MAGAZINE_URL}/:id`, ctx => {
  const id = ctx.params.id;
  try { service.remove(id); }
  catch (e) {
    ctx.response.body = { issue: e.errors };
    ctx.response.status = 400;
    return;
  }
  ctx.response.status = 204;
})

for(let i = 0; i < 10; i++) {
    service.addGeneratedItem()
}

setInterval(() => {
  let item = service.addGeneratedItem();
  console.log(`New item: ${item.name}`);
  broadcast({ event: 'created', payload: { item } });
}, 15000);

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000);

