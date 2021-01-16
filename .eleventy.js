const moment = require('moment');
 
moment.locale('en');

const fs = require("fs");

// image handling
const pluginLocalRespimg = require('eleventy-plugin-local-respimg');

module.exports = function (eleventyConfig) {

  eleventyConfig.setDataDeepMerge(true);

  // Copy `img/` to `_site/img`
  eleventyConfig.addPassthroughCopy("img");
  
  // navigation
  eleventyConfig.addPlugin(require('@11ty/eleventy-navigation'));

  // moment config
  eleventyConfig.addFilter('dateIso', date => {
  return moment(date).toISOString();
  });

  // format date 
  eleventyConfig.addFilter('dateReadable', date => {
  return moment(date).utc().format('LL'); // E.g. May 31, 2019
  })

  // register excerpt shortcode
  eleventyConfig.addShortcode('excerpt', article => extractExcerpt(article));

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (n < 0) {
        return array.slice(n);
    }

    return array.slice(0, n);
    });

  // tags
  eleventyConfig.addCollection("tagList", function(collection) {
    let tagSet = new Set();
    collection.getAll().forEach(function(item) {
      if( "tags" in item.data ) {
        let tags = item.data.tags;

        tags = tags.filter(function(item) {
          switch(item) {
            // this list should match the `filter` list in tags.njk
            case "all":
            case "nav":
            case "thoughts":
            case "work":
            case "tagList":
              return false;
          }

          return true;
        });

        for (const tag of tags) {
          tagSet.add(tag);
        }
      }
    });

    // returning an array in addCollection works in Eleventy 0.5.3
    return [...tagSet];
  });

  // config respimg
  eleventyConfig.addPlugin(pluginLocalRespimg, {
    folders: {
      source: '.', // Folder images are stored in
      output: '_site', // Folder images should be output to
    },
    images: {
      resize: {
        min: 250, // Minimum width to resize an image to
        max: 1500, // Maximum width to resize an image to
        step: 150, // Width difference between each resized image
      },
      hoistClasses: false, // Adds the image tag's classes to the output picture tag
      gifToVideo: false, // Convert GIFs to MP4 videos
      sizes: '100vw', // Default image `sizes` attribute
      lazy: true, // Include `loading="lazy"` attribute for images
    },
  });

  // config 404 page
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, bs) {

        bs.addMiddleware("*", (req, res) => {
          const content_404 = fs.readFileSync('_site/404.html');
          // Add 404 http status code in request header.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      }
    }
  });

};
// END module.exports

// handle excerpts
  function extractExcerpt(article) {
  if (!article.hasOwnProperty('templateContent')) {
    console.warn('Failed to extract excerpt: Document has no property "templateContent".');
    return null;
  }
 
  let excerpt = null;
  const content = article.templateContent;
 
  // The start and end separators to try and match to extract the excerpt
  const separatorsList = [
    { start: '<!-- Excerpt Start -->', end: '<!-- Excerpt End -->' },
    { start: '<p>', end: '</p>' }
  ];
 
  separatorsList.some(separators => {
    const startPosition = content.indexOf(separators.start);
    const endPosition = content.indexOf(separators.end);
 
    if (startPosition !== -1 && endPosition !== -1) {
      excerpt = content.substring(startPosition + separators.start.length, endPosition).trim();
      return true; // Exit out of array loop on first match
    }
  });
 
  return excerpt;
};
// END handle excerpts