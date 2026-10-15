import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {recognizePhoto} from './src/ocr.mjs';
import {findVisualCandidates} from './src/visual.mjs';
const files=new Map([
  ['/src/contributions.mjs',['src/contributions.mjs','text/javascript; charset=utf-8']],
  ['/src/contribution-ui.mjs',['src/contribution-ui.mjs','text/javascript; charset=utf-8']],
  ['/', ['index.html','text/html; charset=utf-8']],
  ['/style.css',['style.css','text/css; charset=utf-8']],
  ['/src/app.mjs',['src/app.mjs','text/javascript; charset=utf-8']],
  ['/src/search.mjs',['src/search.mjs','text/javascript; charset=utf-8']],
  ['/src/scan.mjs',['src/scan.mjs','text/javascript; charset=utf-8']],
  ['/src/storage.mjs',['src/storage.mjs','text/javascript; charset=utf-8']],
  ['/data/catalog.json',['data/catalog.json','application/json; charset=utf-8']],
  ['/src/flavours.mjs',['src/flavours.mjs','text/javascript; charset=utf-8']],
  ['/assets/bamboo-spring-user.png',['assets/bamboo-spring-user.png','image/png']]
]);
for(let i=0;i<12;i++)files.set('/assets/references/'+i+'.jpg',['assets/references/'+i+'.jpg','image/jpeg']);
for(const name of ['dragon','dragon-card','phoenix-card','phoenix-night','cloud-band','wave-band','meander-band','bamboo-rail','flute-divider','texture-paper','texture-clay'])files.set('/assets/decor/'+name+'.svg',['assets/decor/'+name+'.svg','image/svg+xml']);
http.createServer(async(req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  if(['/api/scan','/api/visual'].includes(route)&&req.method==='POST'){
    const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
    if(req.headers.host!=='127.0.0.1:4173'||(req.headers.origin&&req.headers.origin!=='http://127.0.0.1:4173'))return reply(403,{error:'Недопустимый источник запроса.'});
    if(!['image/jpeg','image/png','image/webp'].includes(req.headers['content-type']))return reply(415,{error:'Выбери JPEG, PNG или WebP.'});
    try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024)return reply(413,{error:'Фото больше 10 МБ.'});chunks.push(chunk);}reply(200,route==='/api/visual'?{candidates:await findVisualCandidates(Buffer.concat(chunks))}:await recognizePhoto(Buffer.concat(chunks),{language:new URL(req.url,'http://localhost').searchParams.get('language')??'eng'}));}
    catch(error){reply(error.status??422,{error:error.status?error.message:'Не удалось прочитать изображение. Попробуй другой снимок.'});}return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  const pathname=new URL(req.url,'http://localhost').pathname;const item=files.get(pathname);
  if(!item){res.writeHead(404);res.end('Not found');return;}
  try{const bytes=await readFile(new URL(item[0],import.meta.url));res.writeHead(200,{'Content-Type':item[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(500);res.end('Unable to load asset');}
}).listen(4173,'127.0.0.1',()=>console.log('Tea Atlas: http://127.0.0.1:4173'));
