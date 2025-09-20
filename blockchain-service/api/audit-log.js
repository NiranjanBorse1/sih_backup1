'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuditLog {
    constructor(filePath) {
        this.filePath = filePath;
        this.dir = path.dirname(filePath);
        if (!fs.existsSync(this.dir)) fs.mkdirSync(this.dir, { recursive: true });
        if (!fs.existsSync(this.filePath)) {
            const genesis = this._createBlock(0, 'GENESIS', { message: 'Audit log initialized' }, '0');
            fs.writeFileSync(this.filePath, JSON.stringify([genesis], null, 2));
        }
    }

    _readChain() {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(raw);
    }

    _writeChain(chain) {
        fs.writeFileSync(this.filePath, JSON.stringify(chain, null, 2));
    }

    _hashBlock(block) {
        const payload = `${block.index}|${block.timestamp}|${block.type}|${JSON.stringify(block.data)}|${block.prevHash}`;
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    _createBlock(index, type, data, prevHash) {
        const block = {
            index,
            timestamp: new Date().toISOString(),
            type,
            data,
            prevHash,
            hash: ''
        };
        block.hash = this._hashBlock(block);
        return block;
    }

    addEntry(type, data) {
        const chain = this._readChain();
        const last = chain[chain.length - 1];
        const block = this._createBlock(last.index + 1, type, data, last.hash);
        chain.push(block);
        this._writeChain(chain);
        return block;
    }

    getChain() {
        return this._readChain();
    }

    verify() {
        const chain = this._readChain();
        for (let i = 1; i < chain.length; i++) {
            const prev = chain[i - 1];
            const curr = chain[i];
            const expectedHash = this._hashBlock(curr);
            if (curr.prevHash !== prev.hash) {
                return { valid: false, errorIndex: i, reason: 'prevHash mismatch' };
            }
            if (curr.hash !== expectedHash) {
                return { valid: false, errorIndex: i, reason: 'hash mismatch' };
            }
        }
        return { valid: true, length: chain.length };
    }
}

module.exports = AuditLog;
