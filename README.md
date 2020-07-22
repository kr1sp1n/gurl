# hello gemini

Playing around with the [gemini protocol][1].

## server
The server is written for nodeJS.

Start the server:

```bash
node src/server.js
```

Use a gemini client like [bombadillo][2] to send requests to the server:

```bash
bombadillo gemini://localhost
```

## client
The client is written for deno (just for fun).

Use the client:

```bash
deno run -A src/client.js gemini.circumlunar.space
```

[1]: https://gemini.circumlunar.space/
[2]: https://bombadillo.colorfield.space/