import { BufReader } from "https://deno.land/std@v0.54.0/io/mod.ts";

async function main() {
  let [url] = Deno.args;
  if (!url) {
    console.error("Please pass a URL as argument.");
    Deno.exit(1);
  }
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
  // console.log(parsedUrl);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const connection = await Deno.connectTls(
    { hostname: parsedUrl.hostname, port: 1965 },
  );
  const geminiUrl = `gemini://${parsedUrl.hostname}${parsedUrl.pathname}`;
  await connection.write(encoder.encode(`${geminiUrl}\r\n`));
  const reader = new BufReader(connection);
  const responseHeader = await reader.readString("\n");
  const [status, meta] = (responseHeader || "4 ").split(/\s/);
  const statusCode = Number(status.substr(0, 1));
  // console.log(status)

  if (statusCode === 2) {
    const bodyBytes = await Deno.readAll(reader);
    const body = decoder.decode(bodyBytes);
    console.log(body);
  }
}

await main();
