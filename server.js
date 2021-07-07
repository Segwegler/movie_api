const http = require('http');
const url = require('url');
const fs = require('fs');


// http.createServer((request, response) => {
//   response.writeHead(200, {"Content-Type": "text/plain"});
//   response.end("Hello Node!\n");
// }).listen(8080);
//
// console.log("server started on port 8080");


http.createServer((request, response)=>{
  let addr = request.url,
      q = url.parse(addr, true),
      filePath = "";

fs.appendFile("log.txt", "URL: "+addr+"\nTimestamp: "+ new Date() + "\n\n", (err)=>{
  if(err){
    console.log(err);
  }else{
    console.log("added to Log");
  }
});

  if (q.pathname.includes("documentation.html")) {
    filePath = (__dirname + '/documentation.html');
  }else{
    filePath = "index.html";
  }



  fs.readFile(filePath, (err, data)=>{
    if(err){
      throw err;
    }
    response.writeHead(200, {"Content-Type":"html"});

    response.write(data);
    response.end();
  });
}).listen(8080);

console.log("Server running on port 8080")