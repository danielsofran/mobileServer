import dataStore from 'nedb-promise';

export class Service {
    constructor(filename, autoload, pageSize = 2) {
        this._store = dataStore({ filename, autoload });
        this._pageSize = pageSize;
    }

    async save(item) {
        return await this._store.insert(item);
    }

    async get(props) {
        return await this._store.find(props).then(items => {
            return items;
        });
    }

    async getOne(props) {
        return await this._store.findOne(props);
    }

    async getPaginated(props, page) {
        const skip = (page - 1) * this._pageSize;
        const limit = this._pageSize;

        const results = await this._store.find(props);
        if(results.length < skip) {
            return undefined
        }
        return results.slice(skip, Math.min(skip + limit, results.length));
    }

    update(id, item) {
        this._store.update({ _id: id }, item);
    }

    remove(id) {
        this._store.remove({ _id: id }).error(err => {
            throw { errors: [{ field: 'id', error: `item with id ${id} not found` }] };
        });
    }
}