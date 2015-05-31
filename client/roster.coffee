###
 * Federated Wiki : Roster Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-roster/blob/master/LICENSE.txt
###
#
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

includes = {}

escape = (text) ->
  text
    .replace /&/g, '&amp;'
    .replace /</g, '&lt;'
    .replace />/g, '&gt;'


load_sites = (uri) ->
  tuples = uri.split ' '
  while tuples.length
    site = tuples.shift()
    wiki.neighborhoodObject.registerNeighbor site

parse = ($item, item) ->
  roster = {all: []}
  category = null
  lineup = []
  marks = {}
  lines = []

  if $item?
    $item.addClass 'roster-source'
    $item.get(0).getRoster = -> roster

  more = item.text.split /\r?\n/

  flag = (site) ->
    roster.all.push site
    lineup.push site
    br = if lineup.length >= 18
      newline()
    else
      ''
    "<img class=\"remote\" src=\"//#{site}/favicon.png\" title=\"#{site}\" data-site=\"#{site}\" data-slug=\"welcome-visitors\">#{br}"

  newline = ->
    if lineup.length
      [sites, lineup] = [lineup, []]
      if category?
        roster[category] ||= []
        roster[category].push site for site in sites
      """ <a class='loadsites' href= "/#" data-sites="#{sites.join ' '}" title="add these #{sites.length} sites\nto neighborhood">»</a><br> """
    else
      "<br>"

  cat = (name) ->
    category = name

    # escape name

  include = (line, siteslug) ->
    if marks[siteslug]?
      return "<span>trouble looping #{siteslug}</span>"
    else
      marks[siteslug] = true
    if includes[siteslug]?
      [].unshift.apply more, includes[siteslug]
      ''
    else
      $.getJSON "http://#{siteslug}.json", (page) ->
        includes[siteslug] = ["<span>trouble loading #{siteslug}</span>"]
        for i in page.story
          if i.type is 'roster'
            includes[siteslug] = i.text.split /\r?\n/
            break
        $item.empty()
        emit $item, item
        bind $item, item
      "<span>loading #{siteslug}</span>"

  expand = (text) ->
    text
      .replace /^$/, newline
      .replace /^([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(:\d+)?$/, flag
      .replace /^localhost(:\d+)?$/, flag
      .replace /^INCLUDE ([A-Za-z0-9.-:]+\/[a-z0-9-]+)$/, include
      .replace /^([^<].*)$/, cat

  while more.length
    lines.push expand more.shift()
  lines.push newline()
  lines.join ' '

emit = ($item, item) ->
  $item.append """
    <p style="background-color:#eee;padding:15px;">
      #{parse $item, item}
    </p>
  """

bind = ($item, item) ->
  $item.dblclick (e) ->
    if e.shiftKey
      wiki.dialog "Roster Categories", "<pre>#{JSON.stringify $item.get(0).getRoster(), null, 2}</pre>"
    else
      wiki.textEditor $item, item
  $item.find('.loadsites').click (e) ->
    e.preventDefault()
    e.stopPropagation()
    console.log 'roster sites', $(e.target).data('sites').split(' ')
    load_sites $(e.target).data('sites')


window.plugins.roster = {emit, bind} if window?
module.exports = {parse, includes} if module?
