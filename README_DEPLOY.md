# Deploy-Hinweise (Vite + Vercel)

**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Root Directory:** `./`

Falls es einen Backend-Server gibt: Vercel erwartet Serverless-Funktionen im Ordner `api/` (z.B. `api/hello.ts`). 
Ein separater Ordner `backend/` wird NICHT automatisch deployed. 
Alternativ Backend separat hosten oder in `api/` migrieren.