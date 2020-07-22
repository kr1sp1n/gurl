/*

Gemini Protocol Client

*/

import { BufReader } from "https://deno.land/std@v0.54.0/io/mod.ts";

const maxRedirects = 5

let currentRedirects = 0

async function prompt(message = "") {
  const buf = new Uint8Array(1024);
  await Deno.stdout.write(new TextEncoder().encode(message + ": "));
  const n = await Deno.stdin.read(buf);
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

async function request(url) {
  if (!url.startsWith("gemini://")) {
    url = `gemini://${url}`;
  }
  // replace gemini protocol to be able to parse URL:
  url = url.replace("gemini://", "https://");

  let parsedUrl;
  try {
    // try to parse URL:
    parsedUrl = new URL(url);
  } catch (e) {
    console.log(e);
    Deno.exit(1);
  }

  if (!parsedUrl.pathname.startsWith("/")) {
    parsedUrl.pathname = "/";
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const connection = await Deno.connectTls(
    { hostname: parsedUrl.hostname, port: 1965 },
  );
  const geminiUrl = `gemini://${parsedUrl.hostname}${parsedUrl.pathname}`;
  await connection.write(encoder.encode(`${geminiUrl}\r\n`));
  const reader = new BufReader(connection);
  const header = await reader.readString("\n");
  const [ status, ...rest] = (header || "4 ").split(/\s/);
  const meta = rest.join(' ')
  const statusCode = Number(status.substr(0, 1));
  let body
  if (statusCode === 2) {
    const bodyBytes = await Deno.readAll(reader);
    body = decoder.decode(bodyBytes);
  }
  return { url, header, status: Number(status), statusCode, meta, body }
}

function handleFailure({ url, status }) {
  switch (status) {
    case 50:
      console.error('Permanent failure.')
      break;
    case 51:
      console.error(`Not found: ${url}`)
      break;
  }
  Deno.exit(1)
}

async function handleResponse(response) {
  const { url, header, meta, status, statusCode, body } = response
  // console.log(header)
  switch (statusCode) {
    case 1: // INPUT
      const input = await prompt(meta)
      console.log(input)
      break;
    case 2: // SUCCESS
      console.log(body)
      break;
    case 3: // REDIRECT
      currentRedirects++
      if (currentRedirects > maxRedirects) {
        console.error('Too many redirects.')
        Deno.exit(1)
      }
      const response = await request(meta)
      await handleResponse(response)
      break;
    case 5: // FAILURE
      handleFailure({ status, url })
      break;
  }
}

async function main() {
  let [url] = Deno.args;
  if (!url) {
    console.error("Please pass a URL as argument.");
    Deno.exit(1);
  }
  const response = await request(url)
  await handleResponse(response)
}

await main();
