const { Octokit } = require("@octokit/rest");
const admin = require('firebase-admin');
const axios = require('axios');
const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const REPO_OWNER = "GOA-neurons";
const REPO_NAME = process.env.GITHUB_REPOSITORY.split('/')[1];
if (!admin.apps.length) { 
    try { admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)) }); } 
    catch(e) { process.exit(1); }
}
const db = admin.firestore();
(async () => {
    try {
        const start = Date.now();
        const [{ data: inst }, { data: rate }] = await Promise.all([
            axios.get(`https://raw.githubusercontent.com/${REPO_OWNER}/delta-brain-sync/main/instruction.json`),
            octokit.rateLimit.get()
        ]);
        await db.collection('cluster_nodes').doc(REPO_NAME).set({
            status: 'ACTIVE', latency: `${Date.now() - start}ms`,
            api_remaining: rate.rate.remaining, command: inst.command,
            last_ping: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        if (inst.replicate) { /* Replication Logic */ }
        process.exit(0);
    } catch (e) { process.exit(1); }
})();