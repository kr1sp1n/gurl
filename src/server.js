/*

Gemini Protocol Server

*/

const tls = require('tls');
const fs = require('fs')

const port = 1965

const options = {
  key: fs.readFileSync(`${__dirname}/../localhost.key`),
  cert: fs.readFileSync(`${__dirname}/../localhost.crt`),
}

const server = tls.createServer(options, (client) => {
  client.on('data', (buf) => {
    console.log('Received from client:', buf.toString())
    client.write('20 text/gemini\r\n')
    client.write('# Hello gemini world.\n')
    client.write('=> gemini://gemini.circumlunar.space Project Gemini\n')
    client.end()
  })
  client.on('error', console.error)
  client.on('end', () => {
    console.log('Client closed connection.')
  })
}).on('error', (err) => {
  console.log(err)
  throw err;
});

server.listen(port, '0.0.0.0', () => {
  console.log('opened server on', server.address());
});