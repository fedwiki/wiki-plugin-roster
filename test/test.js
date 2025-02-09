// build time tests for roster plugin
// see http://mochajs.org/
//

import { roster } from '../src/client/roster.js'
import { describe, it } from 'node:test'
import expect from 'expect.js'

const parse = roster.parse

// mock wiki.site(site).flag()
const wiki = {}
wiki.site = site => ({
  flag: () => `//${site}/favicon.png`,
})
// and make wiki global
globalThis.wiki = wiki

describe('roster plugin', () => {
  describe('site markup', () => {
    it('makes image', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/<img class="remote" src="\/\/fed.wiki.org\/favicon.png"/)
    })
    it('has title', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/title="fed.wiki.org"/)
    })
    it('has site data', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/data-site="fed.wiki.org"/)
    })
    it('has slug data', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/data-slug="welcome-visitors"/)
    })
  })
  describe('end of line markup', () => {
    it('has anchor', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/<a class="loadsites" href="\/#"/)
    })
    it('has title', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/ title="add these 1 sites\nto neighborhood"/)
    })
    it('has » at end of line', () => {
      const result = parse(null, { text: 'fed.wiki.org' })
      expect(result).to.match(/>»<\/a><br>/)
    })
  })
  describe('category formatting', () => {
    it('end of line', () => {
      const result = parse(null, { text: 'students' })
      expect(result).to.match(/students *<br>/)
    })
  })

  describe('category access', () => {
    const stub = {
      addClass: function (c) {
        this.c = c
      },
      get: function (n) {
        return this
      },
    }
    it('announces roster-source', () => {
      parse(stub, { text: 'wiki.org' })
      expect(stub.c).to.be('roster-source')
    })
    it('has category all', () => {
      parse(stub, { text: 'wiki.org\nfoo.wiki.org' })
      expect(stub.getRoster()).to.eql({ all: ['wiki.org', 'foo.wiki.org'] })
    })
    it('allows prefix category name', () => {
      parse(stub, { text: 'ward\nwiki.org\nfoo.wiki.org' })
      expect(stub.getRoster().ward).to.eql(['wiki.org', 'foo.wiki.org'])
    })
    it('allows sufix category name', () => {
      parse(stub, { text: 'wiki.org\nfoo.wiki.org\nward' })
      expect(stub.getRoster().ward).to.eql(['wiki.org', 'foo.wiki.org'])
    })
  })
})
