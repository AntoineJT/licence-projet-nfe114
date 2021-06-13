module.exports = class Optional {
    constructor(something = undefined) {
        this.data = something
    }

    hasSome() {
        return this.data !== undefined
    }

    get some() {
        return this.data
    }
}
