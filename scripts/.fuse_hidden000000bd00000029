async function checkHeaders() {
  const resp = await fetch('https://kgpbazaar.vercel.app');
  console.log('--- Headers from https://kgpbazaar.vercel.app ---');
  for (const [key, value] of resp.headers.entries()) {
    console.log(`${key}: ${value}`);
  }
}
checkHeaders();
