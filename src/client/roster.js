/*
 * Federated Wiki : Roster Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-roster/blob/master/LICENSE.txt
 */

/*
# Sample Roster Accessing Code
#
# Any item that exploses a roster will be identifed with class "roster-source".
# These items offer the method getRoster() for retrieving the roster object.
# Convention has roster consumers looking left for the nearest (or all) such objects.
#
#     items = $(".item:lt(#{$('.item').index(div)})")
#     if (sources = items.filter ".roster-source").size()
#       choice = sources[sources.length-1]
#       roster = choice.getRoster()
#
# This simplified version might be useful from the browser's javascript inspector.
#
#     $('.roster-source').get(0).getRoster()
*/

const includes = {}

const escape = text => {
  return text.replace(/&/g, '&amp;'.replace(/</g, '&lt;')).replace(/>/g, '&gt;')
}

const load_sites = uri => {
  const tuples = uri.split(' ')
  while (tuples.length) {
    const site = tuples.shift()
    wiki.neighborhoodObject.registerNeighbor(site)
  }
}

const parse = ($item, item) => {
  let roster = { all: [] }
  let category = null
  let lineup = []
  let marks = {}
  let lines = []

  if ($item != null) {
    $item.addClass('roster-source')
    $item.get(0).getRoster = () => {
      return roster
    }
  }

  const more = item.text.split(/\r?\n/)

  const flag = site => {
    roster.all.push(site)
    lineup.push(site)
    const br = lineup.length >= 18 ? newline() : ''
    return `<img class="remote" src="${wiki.site(site).flag()}" title="${site}" data-site="${site}" data-slug="welcome-visitors">${br}`
  }

  const newline = () => {
    if (lineup.length) {
      let sites = []
      ;[sites, lineup] = [lineup, []]
      if (category != null) {
        roster[category] ||= []
        sites.forEach(site => roster[category].push(site))
      }
      return ` <a class="loadsites" href="/#" data-sites="${sites.join(' ')}" title="add these ${sites.length} sites\nto neighborhood">»</a><br> `
    } else {
      return '<br>'
    }
  }

  const cat = name => {
    return (category = name)
  }

  const includeRoster = (line, siteslug) => {
    if (marks[siteslug] != null) {
      return `<span>trouble looping ${siteslug}</span>`
    } else {
      marks[siteslug] = true
    }
    if (includes[siteslug] != null) {
      ;[].unshift.apply(more, includes[siteslug])
      return ''
    } else {
      const [site, slug] = siteslug.split('/')
      wiki.site(site).get(`${slug}.json`, (error, page) => {
        if (error) {
          console.log(`unable to get ${siteslug}`)
        } else {
          includes[siteslug] = [`<span>trouble loading ${siteslug}</span>`]
          for (const i of page.story) {
            if (i.type === 'roster') {
              includes[siteslug] = i.text.split(/\r?\n/)
              break
            }
          }
          $item.empty()
          emit($item, item)
          bind($item, item)
        }
        return `<span>loading ${siteslug}</span>`
      })
    }
  }

  const includeReferences = (line, siteslug) => {
    if (includes[siteslug]) {
      ;[].unshift.apply(more, includes[siteslug])
      return ''
    } else {
      const [site, slug] = siteslug.split('/')
      wiki.site(site).get(`${slug}.json`, (error, page) => {
        if (error) {
          console.log(`unable to get ${siteslug}"`)
        } else {
          includes[siteslug] = []
          for (const i of page.story)
            if (i.type == 'reference') {
              if (includes[siteslug].indexOf(i.site) < 0) {
                includes[siteslug].push(i.site)
              }
            }
          $item.empty()
          emit($item, item)
          bind($item, item)
        }
      })
      return `<span>loading ${siteslug}</span>`
    }
  }
  const expand = text => {
    return text
      .replace(/^$/, newline)
      .replace(/^([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(:\d+)?$/, flag)
      .replace(/^localhost(:\d+)?$/, flag)
      .replace(/^ROSTER ([A-Za-z0-9.\-:]+\/[a-z0-9-]+)$/, includeRoster)
      .replace(/^REFERENCES ([A-Za-z0-9.\-:]+\/[a-z0-9-]+)$/, includeReferences)
      .replace(/^([^<].*)$/, cat)
  }

  while (more.length) {
    lines.push(expand(more.shift()))
  }
  lines.push(newline())
  return lines.join(' ')
}

const emit = ($item, item) => {
  $item.append(`
    <p style="background-color:#eee;padding:15px;">
      ${parse($item, item)}
    </p>
  `)
}

const bind = ($item, item) => {
  $item.on('dblclick', e => {
    if (e.shiftKey) {
      wiki.dialog(`Roster Categories`, `<pre>${JSON.stringify($item.get(0).getRoster(), null, 2)}</pre>`)
    } else {
      wiki.textEditor($item, item)
    }
  })
  $item.find('.loadsites').on('click', e => {
    e.preventDefault()
    e.stopPropagation()
    console.log('roster sites', $(e.target).data('sites').split(' '))
    load_sites($(e.target).data('sites'))
  })
}

if (typeof window !== 'undefined') {
  window.plugins.roster = { emit, bind }
}

export const roster = typeof window == 'undefined' ? { parse } : undefined
