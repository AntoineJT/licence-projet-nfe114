const fs = require('fs')
const fastify = require('fastify')({ logger: true })

fastify.get('/', async (request, reply) => {
    reply.type('text/html').send(fs.readFileSync('index.html', {encoding: 'utf-8'}))
})

const start = async () => {
    try {
        await fastify.listen(3000)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()
