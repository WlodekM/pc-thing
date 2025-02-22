const data = new Uint8Array(1024)
console.log(Deno.stdin.readSync(data), data)

