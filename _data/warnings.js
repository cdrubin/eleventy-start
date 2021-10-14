const fs = require( 'fs' )
const path = require( 'path' )
const stream = require( 'stream' )
const util = require( 'util' )

const { execSync } = require( 'child_process' )

const yaml = require( 'js-yaml' )

const finished = util.promisify( stream.finished )


function downloadIfNotFound( url, destination ) {
  if ( ! fs.existsSync( destination ) ) {
    console.log( "downloading url '" + url + "' to '" + destination + "'" )
    execSync( "curl '" + url + "' -o " + destination )
  }
}


result = {}


function processProfileDirectory( dir ) {

  // process feeds per person
  const files = fs.readdirSync( dir )

  let content = ''
  for ( const file of files ) {

    if ( typeof file !== 'undefined' && path.parse( file ).ext == '.md' ) {
      content = fs.readFileSync( dir + '/' + file, 'utf8' )
      let slug = path.parse( file ).name

      // if this slug is already present
      if ( result[ slug ] != undefined ) {
				throw( "blog feed for '" + slug + "' already processed. Duplicate profile at '" + dir + '/' + slug + ".md'" )
      }

      let front = content.substr( 4, content.indexOf( '---', 4 ) - 4 )
      frontMatter = yaml.load( front );
      if ( frontMatter.position ) {
        let blog_author = frontMatter.blog_author
        if ( blog_author == undefined )
          blog_author = slug

				// JSON from https://research-cloudflare-com.crypto-team.workers.dev
				downloadIfNotFound( 'https://research-cloudflare-com.crypto-team.workers.dev/blog/author?name=' + blog_author, '_build/blogposts_' + slug + '.json' )
				let person_posts = JSON.parse( fs.readFileSync( '_build/blogposts_' + slug + '.json' ) )

        if ( person_posts.length > 0 )
          result[ slug ] = person_posts
      }
    }
  }


}


result = []


async function main() {

  if ( !fs.existsSync( '_build' ) ) {
        fs.mkdirSync( '_build' )
  }

  downloadIfNotFound( 'https://api.weather.gov/alerts/active?area=CA', '_build/warnings.json' )
  let json = JSON.parse( fs.readFileSync( '_build/warnings.json' ) )

  for ( item of json.features ) {
    result.push( item.properties.headline )
  }  

  //console.log( warnings )

}



module.exports = async function() {
  let done = await main().catch( console.log )

  //console.log( result )

  return result
}

