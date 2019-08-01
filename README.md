###PathTrack API

***Setup environment file***

```
PORT=8081
DATABASE=<mongodb_connection_string>
JOBPORT=8085
```

***Setup config file***
```
module.exports = {
    security: {
        tokenLife: 86400
    },
    google_bucket: {
        bucket: 'localtvads-dev-bucket',
        permissions_file_location: './google-bucket/Page9-aabff2fc558e.json',
        projectId: 'page9-cms',
        bucket_url: 'https://storage.googleapis.com/localtvads-dev-bucket/'
    }
};
```

***Generate API Documentation***

 1 . install apidoc as a dev dependency in the root of the project or as a global dependency
```$xslt
npm install --save-dev apidoc
```
****Or****
```$xslt
npm install -g apidoc
```
 2 . create a apidoc.json file in the root of the project and copy below content in it.
 ```$xslt
{
  "name": "LocalTVAds API",
  "version":"1.0.0",
  "description": "LocalTVAds APIs used for localtvads.com",
  "title": "LocalTvAds API",
  "authors": "tarpitgrover@e9ine.com,sharvilak@e9ine.com"
}
```
3 . Run below command to generate api documentation
```$xslt
apidoc -i routes/ -o doc/
```

4 . Go to doc folder and open index.html in any web browser
```$xslt
cd doc
```

**Version History**

****v1.0.0****
- Initial project requirements
- Project setup