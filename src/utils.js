import jwt from 'jsonwebtoken';

export const jwtConfig = { secret: 'my-secret' };

export const exceptionHandler = async (ctx, next) => {
    try {
        return await next();
    } catch (err) {
        console.log(err);
        ctx.body = { message: err.message || 'Unexpected error.' };
        ctx.status = err.status || 500;
    }
};

export const timingLogger = async (ctx, next) => {
    const start = Date.now();
    await next();
    console.log(`${ctx.method} ${ctx.url} => ${ctx.response.status}, ${Date.now() - start}ms`);
};

export const createToken = (user) => {
    return jwt.sign(
        { username: user.username, _id: user._id },
        jwtConfig.secret,
        { expiresIn: 60 * 60 * 60 },
        undefined
    );
};