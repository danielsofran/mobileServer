import Router from "koa-router";
import {broadcast} from "../wss";
import {Service} from "../service";
import {Magazin} from "../model";

const router = new Router();
const service = new Service("./db/items.json", true);

router.get('/', async ctx => {
    const userId = ctx.state.user._id;
    // get the query string parameters
    const page = ctx.request.query.page;
    const name = ctx.request.query.name;
    const hasDelivery = ctx.request.query.hasDelivery;
    if(hasDelivery !== undefined) {
        ctx.response.body = await service.get({userId: userId, hasDelivery: hasDelivery});
        ctx.response.status = 200;
        return;
    }
    if(!page) {
        ctx.response.body = await service.get({userId: userId});
        ctx.response.status = 200;
        return;
    }
    if (!name) {
        const result = await service.getPaginated({userId: userId}, page);
        if(result === undefined) {
            ctx.response.body = { issue: [{ warning: `page ${page} not found` }] };
            ctx.response.status = 404;
            return;
        }
        ctx.response.body = result;
        ctx.response.status = 200;
        return;
    }
    // if name is provided, return items that contain that substring
    const regex = new RegExp(`.*${name}.*`);
    console.log("Name: " + name, "Page: " + page)
    ctx.response.body = await service.getPaginated({userId: userId, name: {$regex: regex}}, page);
    ctx.response.status = 200;
})

router.get(`/:id`, async ctx => {
    const userId = ctx.state.user._id;
    const itemId = ctx.params.id;
    const item = await service.getOne({_id: itemId});
    if (item) {
        if (item.userId === userId) {
            ctx.response.body = item;
            ctx.response.status = 200; // ok
        } else {
            ctx.response.status = 403; // forbidden
        }
    } else {
        ctx.response.body = { issue: [{ warning: `item with id ${itemId} not found` }] };
        ctx.response.status = 404;
    }
})

router.post(`/`, async ctx => {
    const userId = ctx.state.user._id;
    const data = ctx.request.body;
    const item = new Magazin(data);
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
    try{
        item.userId = userId;
        ctx.response.body = await service.save(item);
        ctx.response.status = 201;
        broadcast({ event: 'created', payload: { item } });
    }
    catch (err) {
        ctx.response.body = { message: err.message };
        ctx.response.status = 400; // bad request
    }
})

router.put(`/:id`, async ctx => {
    const id = ctx.params.id;
    const item = new Magazin(ctx.request.body)
    // item.date = new Date();
    // const itemId = item._id;
    // if (itemId && id != item._id) {
    //     ctx.response.body = { issue: [{ error: `Param id and body id should be the same` }] };
    //     ctx.response.status = 400;
    //     return;
    // }
    // if (!itemId) {
    //     item.userId = ctx.state.user._id;
    //     ctx.response.body = await service.save(item)
    //     ctx.response.status = 201
    //     return;
    // }
    // find item
    let storedItem = service.getOne(id);
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

router.del(`/:id`, async ctx => {
    const userId = ctx.state.user._id;
    const id = ctx.params.id;
    try { await service.remove(id); }
    catch (e) {
        ctx.response.body = { issue: e.errors };
        ctx.response.status = 400;
        return;
    }
    ctx.response.status = 204;
})

export const magazinRouter = router;