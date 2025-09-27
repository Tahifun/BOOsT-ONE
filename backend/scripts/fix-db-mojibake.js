// npm i mongoose
import mongoose from "mongoose";

const URI = process.env.MONGODB_URI; // vorher setzen
const MARKER = /�|�|�?"|�?"|�?o|�?\?|�?~|�?T|�?�|�|�s�/;

function fixString(s){ return Buffer.from(s, "latin1").toString("utf8"); }

function fixDoc(obj){
  let changed = false;
  if (typeof obj === "string") {
    if (MARKER.test(obj)) {
      const f = fixString(obj);
      if (f !== obj) return [f, true];
    }
    return [obj, false];
  }
  if (Array.isArray(obj)) {
    const out = [];
    for (const v of obj) {
      const [nv, ch] = fixDoc(v);
      if (ch) changed = true;
      out.push(nv);
    }
    return [out, changed];
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) {
      const [nv, ch] = fixDoc(obj[k]);
      if (ch) changed = true;
      out[k] = nv;
    }
    return [out, changed];
  }
  return [obj, false];
}

async function run(dryRun=true){
  await mongoose.connect(URI);
  const cols = await mongoose.connection.db.listCollections().toArray();
  let totalChanged = 0;

  for (const c of cols) {
    const name = c.name;
    const coll = mongoose.connection.db.collection(name);
    const cursor = coll.find({});
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const [fixed, changed] = fixDoc(doc);
      if (!changed) continue;
      totalChanged++;
      if (!dryRun) {
        await coll.updateOne({_id: doc._id}, {$set: fixed});
      }
    }
    console.log(`Checked collection ${name}`);
  }
  console.log("docs changed:", totalChanged, "dryRun:", dryRun);
  await mongoose.disconnect();
}

// 1. Testlauf (nur z�hlen)
await run(true);
// 2. Danach echte Reparatur: �ndere auf run(false)
