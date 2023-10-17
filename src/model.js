export class Magazin { // magazin
    constructor({ userId, name, lat, long, date, hasDelivery }) {
        this.userId = userId;
        this.name = name;
        this.lat = lat;
        this.long = long;
        this.date = date; // date of creation
        this.hasDelivery = hasDelivery;
    }

    validate() {
        const errors = [];
        if (!this.name) {
            errors.push({ field: 'name', error: 'name is mandatory' });
        }
        if (!this.date) {
            errors.push({ field: 'date', error: 'date is mandatory' });
        }
        if (this.hasDelivery === undefined) {
            errors.push({ field: 'hasSite', error: 'hasSite is mandatory' });
        }
        if (errors.length > 0) {
            throw { errors };
        }
    }
}

const generateRandomGeoLocation = () => {
    const lat = Math.random() * 180 - 90;
    const lng = Math.random() * 360 - 180;
    return { lat: lat, long: lng };
}

export const generateMagazin = (n) => new Magazin({
    name: `Magazin ${n}`,
    lat: generateRandomGeoLocation().lat,
    long: generateRandomGeoLocation().long,
    date: new Date(Date.now() + n * 1000),
    hasDelivery: n % 2 === 0
});

export class User {
    constructor({ username, password }) {
        this.username = username;
        this.password = password;
    }
}