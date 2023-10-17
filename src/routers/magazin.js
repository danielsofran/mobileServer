import Router from "koa-router";
import {broadcast} from "../wss";
import {Service} from "../service";
import {Magazin} from "../model";

const router = new Router();
const service = new Service("./db/items.json", true);

router.get('/', ctx => {
    console.log("Magazine")
    const userId = ctx.state.user._id;
    ctx.response.body = service.get({userId});
    ctx.response.status = 200;
})

router.get(`/:id`, ctx => {
    console.error("getOne")
    const userId = ctx.state.user._id;
    const itemId = ctx.params.id;
    const item = service.getOne({_id: itemId});
    console.warn(item)
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

router.post(`/`, ctx => {
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
        ctx.response.body = service.save(item);
        ctx.response.status = 201;
        broadcast({ event: 'created', payload: { item } });
    }
    catch (err) {
        ctx.response.body = { message: err.message };
        ctx.response.status = 400; // bad request
    }
})

router.put(`/:id`, ctx => {
    const id = ctx.params.id;
    const item = new Magazin(ctx.request.body)
    item.date = new Date();
    const itemId = item.id;
    if (itemId && id != item.id) {
        ctx.response.body = { issue: [{ error: `Param id and body id should be the same` }] };
        ctx.response.status = 400;
        return;
    }
    if (!itemId) {
        item.userId = ctx.state.user._id;
        ctx.response.body = service.save(item)
        ctx.response.status = 201
        return;
    }
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

router.del(`/:id`, ctx => {
    const userId = ctx.state.user._id;
    const id = ctx.params.id;
    try { service.remove(id); }
    catch (e) {
        ctx.response.body = { issue: e.errors };
        ctx.response.status = 400;
        return;
    }
    ctx.response.status = 204;
})

export const magazinRouter = router;