import http from 'http';
import Koa from 'koa';
import WebSocket from 'ws';
import Router from 'koa-router';
import bodyParser from "koa-bodyparser";
import jwt from 'koa-jwt';
import cors from '@koa/cors';
import { jwtConfig, timingLogger, exceptionHandler } from './utils.js';
import { initWss } from './wss.js';
import {authRouter} from "./routers/users";
import {magazinRouter} from "./routers/magazin";

const app = new Koa();
const server = http.createServer(app.callback());
const wss = new WebSocket.Server({ server });
initWss(wss);

app.use(cors());
app.use(timingLogger);
app.use(exceptionHandler);
app.use(bodyParser());

const prefix = '/api';

// public
const publicApiRouter = new Router({ prefix });
publicApiRouter.use('/auth', authRouter.routes());
app
    .use(publicApiRouter.routes())
    .use(publicApiRouter.allowedMethods());

// protected
const protectedApiRouter = new Router({ prefix });
app.use(jwt(jwtConfig)); // jwtConfig = {secret: 'my-secret'}
protectedApiRouter.use('/magazine', magazinRouter.routes());
app
    .use(protectedApiRouter.routes())
    .use(protectedApiRouter.allowedMethods());

app.use(async (ctx, next) => { // list all routes
    const routes = app.middleware.map(middleware => {
        if (middleware.router && middleware.router.stack) {
            return middleware.router.stack
                .filter(layer => layer.path) // Filter out unnamed routes
                .map(layer => ({
                    method: layer.methods.join(', ').toUpperCase(),
                    path: `${layer.path}`,
                }));
        }
        return [];
    }).flat();

    console.log('List of Routes:');
    routes.forEach(route => console.log(`${route.method}\t${route.path}`));

    await next();
});

server.listen(3000);
console.log('started on port 3000');
