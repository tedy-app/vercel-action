import https from "node:https";

// dumb fetch implementation
const fetch = (url, options = {}) => new Promise((resolve, reject) => {
  const req = https.request(url, options, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return reject(new Error('statusCode=' + res.statusCode));
    }
    let chunks = [];
    res.on("data", (chunk) => { chunks.push(chunk) });
    res.on("end", () => resolve({ json: () => JSON.parse(Buffer.concat(chunks).toString()) }));
  }).on("error", reject);
  req.end();
});

if (process.env.VERCEL_ENV === "preview") {
  const teamId = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : '';
  const deployment = await fetch(`https://api.vercel.com/v13/deployments/${process.env.VERCEL_URL}${teamId}`, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}` }
  }).then(res => res.json());
  const isSnapletDeployment = deployment.name.startsWith('snaplet-action-');
  const isStaging = deployment.data?.gitSource?.ref === 'staging'
  
  if (isStaging) {
    process.exit(1)
  }
  if (!isSnapletDeployment || !process.env.DIRECT_URL) {
    process.exit(0);
  }
}

process.exit(1);
