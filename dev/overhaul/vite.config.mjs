import {fileURLToPath} from 'node:url';

export default {
  root:fileURLToPath(new URL('../../',import.meta.url)),
  base:'./',
  server:{host:'127.0.0.1',port:5174,strictPort:true,hmr:false},
};
