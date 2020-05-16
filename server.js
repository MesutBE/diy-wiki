const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const util = require('util');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'text/plain' }));

// Uncomment this out once you've made your first route.
app.use(express.static(path.join(__dirname, 'client', 'build')));
// console.log(path.join(__dirname, 'client', 'build')); // ../diy-wiki/client/build

// some helper functions you can use
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readDir = util.promisify(fs.readdir);

// some more helper functions
const DATA_DIR = 'data';
const TAG_RE = /#\w+/g;
function slugToPath(slug) {
  const filename = `${slug}.md`;
  return path.join(DATA_DIR, filename);
}
function jsonOK(res, data) {
  res.json({ status: 'ok', ...data });
}
function jsonError(res, message) {
  res.json({ status: 'error', message });
}

app.get('/', (req, res) => {
  res.json({ wow: 'it works!' });
});

// If you want to see the wiki client, run npm install && npm build in the client folder,
// then comment the line above and uncomment out the lines below and comment the line above.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
// });

// GET: '/api/page/:slug'
// success response: {status: 'ok', body: '<file contents>'}
// failure response: {status: 'error', message: 'Page does not exist.'}

app.get('/api/page/:slug', (req, res) => {
  const paramSlug = req.params.slug;
  const path = slugToPath(paramSlug);
  readFile(path, 'utf-8')
    .then((content) => {
      jsonOK(res, { body: content });
    })
    .catch((err) => {
      console.log('Error', err);
      jsonError(res, 'Page does not exist.')
    }); 
});

// POST: '/api/page/:slug'
// body: {body: '<file text content>'}
// success response: {status: 'ok'}
// failure response: {status: 'error', message: 'Could not write page.'}

// GET: '/api/pages/all'
// success response: {status:'ok', pages: ['fileName', 'otherFileName']}
//  file names do not have .md, just the name!
// failure response: no failure response

app.get('/api/pages/all', (req, res) => {
  readDir(DATA_DIR, 'utf-8')
    .then((dirRead) => {
      console.log(dirRead);
      let listArr = dirRead.map(fileName => { return fileName.replace('.md', '') });
      console.log(listArr);
      jsonOK(res, { pages :listArr })
    })
    .catch((err) => {
      console.error(err); 
    });
});

// GET: '/api/tags/all'
// success response: {status:'ok', tags: ['tagName', 'otherTagName']}
//  tags are any word in all documents with a # in front of it
// failure response: no failure response

app.get('/api/tags/all', (req, res) => {
  readDir(DATA_DIR, 'utf-8')
    .then((dirRead) => {

      console.log('readDir results: ', dirRead); 

      tagList = [];

      const regex = new RegExp(TAG_RE);

      let listArr = dirRead.filter(fileName => { 

        const path = slugToPath(fileName.replace('.md', '')); // to made path (data/...) from slug (...)
        
        const fileContent = fs.readFileSync(path, 'utf-8')
        const lines = fileContent.split('\n')

        lines.forEach( line => {
          if (regex.test(line)) {
            line.split(' ').forEach(tag => tagList.push(tag.replace('#', '')))

          }
        });
        
        // to list file names
        if (regex.test(fileContent)) {
            return true;
          } else {
            return false;
          }
      });
      // console.log(listArr);
      console.log(tagList);
      
      jsonOK(res, { tags: tagList })
    })
    .catch((err) => {
      console.error('readDir error..', err);
    });
});

// GET: '/api/tags/:tag'
// success response: {status:'ok', tag: 'tagName', pages: ['tagName', 'otherTagName']}
//  file names do not have .md, just the name!
// failure response: no failure response

app.get('/api/tags/:tag', (req, res) => {
  const tagName = req.params.tag;
  readDir(DATA_DIR, 'utf-8')
    .then((dirRead) => {

      const regex = new RegExp(TAG_RE);

      let listArr = dirRead.filter(fileName => {

        const path = slugToPath(fileName.replace('.md', '')); // to made path (data/...) from slug (...)

        const fileContent = fs.readFileSync(path, 'utf-8')
        
        // to list file names
        if (regex.test(fileContent)) {
          if (!fileContent.includes(`#${tagName}`)){ return false };
          return true;
        } else {
          return false;
        }
      });
      listArr = listArr.map(fileName => { return fileName.replace('.md', '') });
      // console.log(listArr);

      jsonOK(res, { tag: tagName , pages: listArr })
    })
    .catch((err) => {
      console.error('readDir error..', err);
    });
});

app.get('/api/page/all', async (req, res) => {
  const names = await fs.readdir(DATA_DIR);
  console.log(names);
  jsonOK(res, { });
});

// https://expressjs.com/en/guide/error-handling.html
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).end();
}); 

const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Wiki app is serving at http://localhost:${port}`));
