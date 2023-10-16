import {generateMagazin} from "./model";

export class Service {
    constructor(pageSize = 10) {
        this._data = [];
        this._lastUpdated = new Date();
        this._lastId = 0;
        this._pageSize = pageSize;
    }

    save(item) {
        item.id = ++this._lastId;
        this._data.push(item);
        this._lastUpdated = item.date;
        this._lastId = item.id;
        return item;
    }

    get() {
        return this._data;
    }

    getById(id) {
        return this._data.find(item => item.id == id);
    }

    update(id, item) {
        const index = this._data.findIndex(item => item.id == id);
        if (index !== -1) {
            this._data[index] = item;
            this._lastUpdated = item.date;
        }
    }

    remove(id) {
        const index = this._data.findIndex(item => item.id == id);
        if (index !== -1) {
            this._data.splice(index, 1);
            this._lastUpdated = new Date();
        }
        else {
            throw { errors: [{ field: 'id', error: `item with id ${id} not found` }] };
        }
    }

    get lastUpdated() {
        return this._lastUpdated;
    }

    addGeneratedItem() {
        return this.save(generateMagazin(this._lastId + 1));
    }
}