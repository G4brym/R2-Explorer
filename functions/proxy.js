/*
CORS Anywhere as a Cloudflare Worker!
(c) 2019 by Zibri (www.zibri.org)
email: zibri AT zibri DOT org
https://github.com/Zibri/cloudflare-cors-anywhere
*/

/*
whitelist = [ "^http.?://www.zibri.org$", "zibri.org$", "test\\..*" ];  // regexp for whitelisted urls
*/

const blacklist = [] // regexp for blacklisted urls
const whitelist = ['.*'] // regexp for whitelisted origins

function isListed(uri, listing) {
  let ret = false
  if (typeof uri === 'string') {
    listing.forEach((m) => {
      if (uri.match(m) != null) ret = true
    })
  } else { //   decide what to do when Origin is null
    ret = true // true accepts null origins false rejects them.
  }
  return ret
}

export async function onRequest(event) {
  let isOPTIONS = (event.request.method == 'OPTIONS')
  const origin_url = new URL(event.request.url)

  function fix(myHeaders) {
    //            myHeaders.set("Access-Control-Allow-Origin", "*");
    myHeaders.set('Access-Control-Allow-Origin', event.request.headers.get('Origin'))
    if (isOPTIONS) {
      myHeaders.set('Access-Control-Allow-Methods', event.request.headers.get('access-control-request-method'))
      let acrh = event.request.headers.get('access-control-request-headers')
      // myHeaders.set("Access-Control-Allow-Credentials", "true");

      if (acrh) {
        myHeaders.set('Access-Control-Allow-Headers', acrh)
      }

      myHeaders.delete('X-Content-Type-Options')
    }
    return myHeaders
  }

  let fetch_url = decodeURIComponent(decodeURIComponent(origin_url.search.substr(1)))
  if (!fetch_url.includes('https://'))
    fetch_url = `https://${fetch_url}`

  const orig = event.request.headers.get('Origin')

  const remIp = event.request.headers.get('CF-Connecting-IP')

  if ((!isListed(fetch_url, blacklist)) && (isListed(orig, whitelist))) {
    let xheaders = event.request.headers.get('x-cors-headers')

    if (xheaders != null) {
      try {
        xheaders = JSON.parse(xheaders)
      } catch (e) {
      }
    }

    if (origin_url.search.startsWith('?')) {
      let recv_headers = {}
      for (var pair of event.request.headers.entries()) {
        if ((pair[0].match('^origin') == null) &&
          (pair[0].match('eferer') == null) &&
          (pair[0].match('^cf-') == null) &&
          (pair[0].match('^x-forw') == null) &&
          (pair[0].match('^x-cors-headers') == null)
        ) recv_headers[pair[0]] = pair[1]
      }

      if (xheaders != null) {
        Object.entries(xheaders).forEach((c) => recv_headers[c[0]] = c[1])
      }

      let newreq = new Request(event.request, {
        redirect: 'follow',
        headers: recv_headers
      })

      const response = await fetch(fetch_url, newreq)
      var myHeaders = new Headers(response.headers)
      let cors_headers = []
      let allh = {}
      for (var pair of response.headers.entries()) {
        cors_headers.push(pair[0])
        allh[pair[0]] = pair[1]
      }
      cors_headers.push('cors-received-headers')
      myHeaders = fix(myHeaders)

      myHeaders.set('Access-Control-Expose-Headers', cors_headers.join(','))

      myHeaders.set('cors-received-headers', JSON.stringify(allh))

      if (isOPTIONS) {
        var body = null
      } else {
        var body = await response.arrayBuffer()
      }

      const init = {
        headers: myHeaders,
        status: (isOPTIONS ? 200 : response.status),
        statusText: (isOPTIONS ? 'OK' : response.statusText)
      }
      return new Response(body, init)
    } else {
      var myHeaders = new Headers()
      myHeaders = fix(myHeaders)

      if (typeof event.request.cf !== 'undefined') {
        if (typeof event.request.cf.country !== 'undefined') {
          var country = event.request.cf.country
        } else {
          var country = false
        }

        if (typeof event.request.cf.colo !== 'undefined') {
          var colo = event.request.cf.colo
        } else {
          var colo = false
        }
      } else {
        country = false
        colo = false
      }

      return new Response(
        'CLOUDFLARE-CORS-ANYWHERE\n\n' +
        'Source:\nhttps://github.com/Zibri/cloudflare-cors-anywhere\n\n' +
        'Usage:\n' + origin_url.origin + '/?uri\n\n' +
        'Donate:\nhttps://paypal.me/Zibri/5\n\n' +
        'Limits: 100,000 requests/day\n' +
        '          1,000 requests/10 minutes\n\n' +
        (orig != null ? 'Origin: ' + orig + '\n' : '') +
        'Ip: ' + remIp + '\n' +
        (country ? 'Country: ' + country + '\n' : '') +
        (colo ? 'Datacenter: ' + colo + '\n' : '') + '\n' +
        ((xheaders != null) ? '\nx-cors-headers: ' + JSON.stringify(xheaders) : ''),
        {status: 200, headers: myHeaders}
      )
    }
  } else {
    return new Response(
      'Create your own cors proxy</br>\n' +
      "<a href='https://github.com/Zibri/cloudflare-cors-anywhere'>https://github.com/Zibri/cloudflare-cors-anywhere</a></br>\n" +
      '\nDonate</br>\n' +
      "<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a>\n",
      {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'Content-Type': 'text/html'
        }
      })
  }
}
