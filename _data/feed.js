let Parser = require( 'node-xml-stream' )

const fs = require( 'fs' )
const path = require( 'path' )
const stream = require( 'stream' )
const util = require( 'util' )

const { execSync } = require( 'child_process' )

const finished = util.promisify( stream.finished )



async function parseRSS( filename ) {

  let blogposts = []
  let blogpost = {}
  let attribute = ''

  let parser = new Parser()
  console.log( "parsing '" + filename + "'" )

  parser.on( 'opentag', ( name, attrs ) => {
    //console.log( ' opentag ' + name )
    
    if ( name == 'item' ) {
      blogpost = { category: [] }
    }
    else {
      switch ( name ) {
        case 'title':
          attribute = 'heading'; break
        case 'description':
        	attribute = 'text'; break
        case 'pubDate':
          attribute = 'date'; break
        case 'media:content':
          blogpost.image = attrs[ 'url' ]; break
        case 'category':
        case 'link':
          attribute = name
          break
        default:
          attribute = ''
      }
    }

  } );


  parser.on( 'closetag', name => {
    if ( name == 'item' ) {
      blogposts.push( blogpost )
    }
  } );

  parser.on( 'text', text => {
    if ( attribute == 'link' ) {
    	blogpost[ attribute ] = text
    }
    else if ( attribute == 'date' ) {
      blogpost[ attribute ] = new Date( text ).toISOString()
    }
  } );

  parser.on( 'cdata', cdata => {
    if ( attribute == 'category' ) {
    	blogpost[ attribute ].push( cdata )
    }
    else if ( [ 'heading', 'text' ].includes( attribute ) ) {
      blogpost[ attribute ] = cdata
    }
  } );

  let fstream = fs.createReadStream( filename )
  fstream.pipe( parser )

  let done = await finished( fstream )

  return blogposts
}

function downloadIfNotFound( url, destination ) {
  if ( ! fs.existsSync( destination ) ) {
    console.log( "downloading url '" + url + "' to '" + destination + "'" )
    execSync( "curl '" + url + "' -o " + destination )
  }
}


result = {}


async function main() {

  if ( !fs.existsSync( '_build' ) ) {
        fs.mkdirSync( '_build' )
  }

  // process feed for the tag 'research'
  downloadIfNotFound( 'https://blog.cloudflare.com/tag/research/rss/', '_build/rss.xml' )
  let posts = await parseRSS( '_build/rss.xml' )

  //console.log( posts )

  result.posts = posts

}



module.exports = async function() {
  let done = await main().catch( console.log )

  //console.log( result )

  return result
}

