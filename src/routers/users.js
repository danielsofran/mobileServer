import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import dataStore from "nedb-promise";
import { jwtConfig, createToken } from '../utils.js';
import {Service} from "../service";

const authRouter = new Router();
const service = new Service("./db/users.json", true);

authRouter.post('/signup', async (ctx) => {
    try {
        const user = ctx.request.body;
        await service.save(user);
        ctx.response.body = { token: createToken(user) };
        ctx.response.status = 201; // created
    } catch (err) {
        ctx.response.body = { error: err.message };
        ctx.response.status = 400; // bad request
    }
})

authRouter.post('/login', async (ctx) => {
    const credentials = ctx.request.body;

    const user = await service.getOne({ username: credentials.username });
    if (user && credentials.password === user.password) {
        ctx.response.body = { token: createToken(user) };
        console.warn(ctx.response.body.token)
        ctx.response.status = 201; // created
    } else {
        ctx.response.body = { error: 'Invalid credentials' };
        ctx.response.status = 400; // bad request
    }
})

export {authRouter};