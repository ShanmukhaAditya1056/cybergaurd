/**
 * CyberGuard AI — In-Memory Store
 * Fallback store when MongoDB is unavailable.
 * Mimics Mongoose model API so controllers work unchanged.
 */
const crypto = require('crypto');

class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.documents = [];
  }

  _genId() {
    return crypto.randomBytes(12).toString('hex');
  }

  async create(doc) {
    const record = {
      _id: this._genId(),
      ...doc,
      createdAt: doc.createdAt || new Date(),
      checkedAt: doc.checkedAt || new Date(),
    };
    this.documents.unshift(record);
    // Cap at 500 documents to prevent memory bloat
    if (this.documents.length > 500) {
      this.documents = this.documents.slice(0, 500);
    }
    return record;
  }

  find(query = {}) {
    let results = this._filter(query);
    return new MemoryQuery(results);
  }

  findOne(query = {}) {
    return new MemoryQuerySingle(this._filter(query));
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const idx = this.documents.findIndex(d => d._id === id);
    if (idx === -1) return null;
    if (update.$set) {
      Object.assign(this.documents[idx], update.$set);
    } else {
      Object.assign(this.documents[idx], update);
    }
    return this.documents[idx];
  }

  async findByIdAndDelete(id) {
    const idx = this.documents.findIndex(d => d._id === id);
    if (idx === -1) return null;
    const [removed] = this.documents.splice(idx, 1);
    return removed;
  }

  async countDocuments(query = {}) {
    return this._filter(query).length;
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      const count = this.documents.length;
      this.documents = [];
      return { deletedCount: count };
    }
    const before = this.documents.length;
    this.documents = this.documents.filter(d => !this._matches(d, query));
    return { deletedCount: before - this.documents.length };
  }

  _filter(query) {
    if (!query || Object.keys(query).length === 0) return [...this.documents];
    return this.documents.filter(d => this._matches(d, query));
  }

  _matches(doc, query) {
    for (const [key, val] of Object.entries(query)) {
      if (key === '$or') {
        const anyMatch = val.some(subQuery => this._matches(doc, subQuery));
        if (!anyMatch) return false;
        continue;
      }
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        // Handle operators like $gte, $in, $regex
        for (const [op, opVal] of Object.entries(val)) {
          if (op === '$gte' && !(doc[key] >= opVal)) return false;
          if (op === '$lte' && !(doc[key] <= opVal)) return false;
          if (op === '$in' && !opVal.includes(doc[key])) return false;
          if (op === '$regex') {
            const re = new RegExp(opVal, typeof val.$options === 'string' ? val.$options : '');
            if (!re.test(doc[key])) return false;
          }
        }
      } else {
        if (doc[key] !== val) return false;
      }
    }
    return true;
  }
}

/**
 * Chainable query builder that mimics Mongoose's Query API
 */
class MemoryQuery {
  constructor(results) {
    this.results = results;
    this._sortKey = null;
    this._sortDir = 1;
    this._limitVal = null;
    this._selectFields = null;
  }

  sort(sortObj) {
    if (typeof sortObj === 'object') {
      const key = Object.keys(sortObj)[0];
      this._sortKey = key;
      this._sortDir = sortObj[key] === -1 ? -1 : 1;
    }
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  select(fields) {
    if (typeof fields === 'string') {
      this._selectFields = fields.split(' ');
    }
    return this;
  }

  then(resolve, reject) {
    try {
      let res = [...this.results];
      if (this._sortKey) {
        res.sort((a, b) => {
          const aVal = a[this._sortKey];
          const bVal = b[this._sortKey];
          if (aVal < bVal) return -1 * this._sortDir;
          if (aVal > bVal) return 1 * this._sortDir;
          return 0;
        });
      }
      if (this._limitVal) {
        res = res.slice(0, this._limitVal);
      }
      resolve(res);
    } catch (e) {
      if (reject) reject(e);
    }
  }
}

class MemoryQuerySingle {
  constructor(results) {
    this.results = results;
    this._sortKey = null;
    this._sortDir = 1;
  }

  sort(sortObj) {
    if (typeof sortObj === 'object') {
      const key = Object.keys(sortObj)[0];
      this._sortKey = key;
      this._sortDir = sortObj[key] === -1 ? -1 : 1;
    }
    return this;
  }

  then(resolve, reject) {
    try {
      let res = [...this.results];
      if (this._sortKey) {
        res.sort((a, b) => {
          const aVal = a[this._sortKey];
          const bVal = b[this._sortKey];
          if (aVal < bVal) return -1 * this._sortDir;
          if (aVal > bVal) return 1 * this._sortDir;
          return 0;
        });
      }
      resolve(res.length > 0 ? res[0] : null);
    } catch (e) {
      if (reject) reject(e);
    }
  }
}

// Singleton collections
const collections = {};

const getCollection = (name) => {
  if (!collections[name]) {
    collections[name] = new MemoryCollection(name);
  }
  return collections[name];
};

module.exports = { getCollection, MemoryCollection };
