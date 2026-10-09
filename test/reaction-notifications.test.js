'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/api.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018}}).outputText;
function api(native, core = {result: {success: true}}) {
    const requests = [], exports = {};
    const context = {exports, AbortController, URLSearchParams, setTimeout, clearTimeout,
        window: {BoardID: 10, UserID: 20, GroupID: 4, PartnerID: 712, ForumAPITicket: 'signed', UserLastVisit: 100},
        fetch: async (url, options) => {
            requests.push({url, options});
            if (url.startsWith('/api.php?')) {
                if (native instanceof Error) throw native;
                return {ok: true, json: async () => native};
            }
            return {status: 200, json: async () => core};
        }};
    vm.runInNewContext(code, context);
    return {api: exports, requests};
}
let count = 0;
async function test(name, fn) { await fn(); console.log('PASS ' + name); count++; }
(async () => {
    await test('author resolved with same-origin session before add', async () => {
        const fixture = api({response: [{id: 40, user_id: 30}]});
        await fixture.api.reactionsAdd(10, 20, 40, '+1');
        const lookup = fixture.requests[0]; assert.strictEqual(lookup.options.credentials, 'same-origin');
        assert(lookup.url.includes('post_id=40')); assert(lookup.options.signal);
        const rpc = JSON.parse(fixture.requests[1].options.body);
        assert.strictEqual(rpc.method, 'reactions/add'); assert.strictEqual(rpc.params.post_author_id, 30);
        assert.strictEqual(rpc.params.check.sign, 'signed');
        assert(!('cookie' in rpc.params));
    });
    for (const [label, response] of [['network failure', Error('timeout')], ['inaccessible post', {response: []}],
        ['wrong post', {response: [{id: 41, user_id: 30}]}], ['invalid author', {response: [{id: 40, user_id: '30x'}]}],
        ['API error', {error: 'denied'}], ['ambiguous result', {response: [{id: 40, user_id: 30}, {id: 40, user_id: 31}]}]]) {
        await test(label + ' still saves without recipient hint', async () => {
            const fixture = api(response); await fixture.api.reactionsAdd(10, 20, 40, '_catjam');
            const rpc = JSON.parse(fixture.requests[fixture.requests.length - 1].options.body);
            assert.strictEqual(rpc.method, 'reactions/add'); assert(!('post_author_id' in rpc.params));
        });
    }
    await test('Core validation failure remains an error for the UI', async () => {
        const fixture = api({response: [{id: 40, user_id: 30}]}, {error: {code: -32602}});
        await assert.rejects(fixture.api.reactionsAdd(10, 20, 40, '+1'));
    });
    await test('deletion does not request author or create notification', async () => {
        const fixture = api(null); await fixture.api.reactionsDelete(10, 20, 40, '+1');
        assert.strictEqual(fixture.requests.length, 1); assert.strictEqual(JSON.parse(fixture.requests[0].options.body).method, 'reactions/delete');
    });
    console.log(count + ' reaction client checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
